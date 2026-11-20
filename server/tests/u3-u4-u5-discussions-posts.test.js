import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Post from '../src/models/Post.js';
import { anonymous, demoUser, loginAs, makeCommunity, makeDiscussion, resetData, startTestDb, stopTestDb } from './helpers.js';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

describe('U3 Start a discussion', () => {
  it('AT1: a discussion started in the selected community is saved there with its title, content and creator', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const res = await user.post(`/api/communities/${community.id}/discussions`).send({ title: 'Best editors?', content: 'Vim or VS Code?' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Best editors?', content: 'Vim or VS Code?' });
    expect(res.body.creator.name).toBe((await demoUser('user')).name);

    const list = await user.get(`/api/communities/${community.id}/discussions`);
    expect(list.body.map((d) => d.title)).toEqual(['Best editors?']);
  });

  it('a discussion needs both a title and content', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const url = `/api/communities/${community.id}/discussions`;
    expect((await user.post(url).send({ title: '', content: 'x' })).status).toBe(400);
    expect((await user.post(url).send({ title: 'x', content: '   ' })).status).toBe(400);
  });

  it('the discussion list shows the newest first, and is empty for a new community', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    expect((await user.get(`/api/communities/${community.id}/discussions`)).body).toEqual([]);

    const creator = await demoUser('user');
    await makeDiscussion(community, creator, { title: 'Older', createdAt: new Date('2026-01-01') });
    await makeDiscussion(community, creator, { title: 'Newer', createdAt: new Date('2026-02-01') });
    const list = await user.get(`/api/communities/${community.id}/discussions`);
    expect(list.body.map((d) => d.title)).toEqual(['Newer', 'Older']);
  });
});

describe('U4 Create a post', () => {
  async function setup({ join }) {
    const community = await makeCommunity();
    const discussion = await makeDiscussion(community, await demoUser('user'));
    const user = await loginAs('user');
    if (join) await user.post(`/api/communities/${community.id}/membership`);
    return { community, discussion, user };
  }

  it('AT1: a post with a title, community and content is published in the selected community', async () => {
    const { community, discussion, user } = await setup({ join: true });
    const res = await user.post('/api/posts').send({
      title: 'Hello', body: 'First post', discussionId: discussion.id, communityId: community.id,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Hello', body: 'First post', discussion: discussion.id, community: community.id });
    expect(res.body.author.name).toBe((await demoUser('user')).name);
  });

  it('AT2: a missing required field blocks publishing and names the missing field', async () => {
    const { discussion, user } = await setup({ join: true });
    const res = await user.post('/api/posts').send({ title: '', body: '', discussionId: discussion.id });
    expect(res.status).toBe(400);
    expect(res.body.fields).toMatchObject({ title: expect.any(String), body: expect.any(String) });
    expect(await Post.countDocuments()).toBe(0);
  });

  it('a missing discussion is reported too', async () => {
    const { user } = await setup({ join: true });
    const res = await user.post('/api/posts').send({ title: 'Hi', body: 'There' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('discussionId');
  });

  it('only members of the community can post (join first)', async () => {
    const { discussion, user } = await setup({ join: false });
    const res = await user.post('/api/posts').send({ title: 'Hi', body: 'There', discussionId: discussion.id });
    expect(res.status).toBe(403);
    expect(await Post.countDocuments()).toBe(0);
  });

  it('the author is always the signed-in user, never a value from the request', async () => {
    const { discussion, user } = await setup({ join: true });
    const other = await demoUser('admin');
    const res = await user.post('/api/posts').send({ title: 'Hi', body: 'There', discussionId: discussion.id, author: other.id });
    expect(res.status).toBe(201);
    expect(res.body.author.id).toBe((await demoUser('user')).id);
  });

  it('anonymous visitors cannot post', async () => {
    const { discussion } = await setup({ join: true });
    const res = await anonymous().post('/api/posts').send({ title: 'Hi', body: 'There', discussionId: discussion.id });
    expect(res.status).toBe(401);
  });
});

describe('U5 View a discussion', () => {
  it('AT1: opening a discussion returns it together with its posts', async () => {
    const community = await makeCommunity();
    const creator = await demoUser('user');
    const discussion = await makeDiscussion(community, creator, { title: 'Study tips', content: 'Share yours' });
    await Post.create({ title: 'Pomodoro', body: '25 minutes', author: creator._id, discussion: discussion._id });

    const user = await loginAs('user');
    const detail = await user.get(`/api/discussions/${discussion.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ title: 'Study tips', content: 'Share yours' });

    const posts = await user.get('/api/posts').query({ discussionId: discussion.id });
    expect(posts.status).toBe(200);
    expect(posts.body.map((p) => p.title)).toEqual(['Pomodoro']);
  });

  it('posts are listed newest first by default and oldest first on request', async () => {
    const community = await makeCommunity();
    const creator = await demoUser('user');
    const discussion = await makeDiscussion(community, creator);
    const make = (title, createdAt) => Post.create({ title, body: title, author: creator._id, discussion: discussion._id, createdAt });
    await make('first', new Date('2026-01-01'));
    await make('second', new Date('2026-01-02'));
    await make('third', new Date('2026-01-03'));

    const user = await loginAs('user');
    const newest = await user.get('/api/posts').query({ discussionId: discussion.id });
    expect(newest.body.map((p) => p.title)).toEqual(['third', 'second', 'first']);
    const oldest = await user.get('/api/posts').query({ discussionId: discussion.id, sort: 'oldest' });
    expect(oldest.body.map((p) => p.title)).toEqual(['first', 'second', 'third']);
  });

  it('a discussion with no posts returns an empty list', async () => {
    const discussion = await makeDiscussion(await makeCommunity(), await demoUser('user'));
    const user = await loginAs('user');
    expect((await user.get('/api/posts').query({ discussionId: discussion.id })).body).toEqual([]);
  });

  it('rejects a bad sort (400), a missing filter (400), an unknown discussion (404) and anonymous visitors (401)', async () => {
    const discussion = await makeDiscussion(await makeCommunity(), await demoUser('user'));
    const user = await loginAs('user');
    expect((await user.get('/api/posts').query({ discussionId: discussion.id, sort: 'popular' })).status).toBe(400);
    expect((await user.get('/api/posts')).status).toBe(400);
    expect((await user.get('/api/discussions/64b7f0c2a1b2c3d4e5f60718')).status).toBe(404);
    expect((await anonymous().get(`/api/discussions/${discussion.id}`)).status).toBe(401);
  });
});
