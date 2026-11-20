import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Membership from '../src/models/Membership.js';
import { anonymous, demoUser, loginAs, makeCommunity, makeDiscussion, resetData, startTestDb, stopTestDb } from './helpers.js';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

describe('U1 Browse and join communities', () => {
  it('lists every community, sorted by name', async () => {
    await makeCommunity({ name: 'Zebra Fans' });
    await makeCommunity({ name: 'Art Club' });
    const user = await loginAs('user');
    const res = await user.get('/api/communities');
    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.name)).toEqual(['Art Club', 'Zebra Fans']);
  });

  it('AT1: opening a community returns its name, rules and description', async () => {
    const community = await makeCommunity({ name: 'Chess', description: 'Moves and mates', rules: 'No engines' });
    const user = await loginAs('user');
    const res = await user.get(`/api/communities/${community.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Chess', description: 'Moves and mates', rules: 'No engines' });
  });

  it('AT1: opening a community also shows its discussions (the available content)', async () => {
    const community = await makeCommunity();
    await makeDiscussion(community, await demoUser('user'), { title: 'Opening theory' });
    const user = await loginAs('user');
    const res = await user.get(`/api/communities/${community.id}/discussions`);
    expect(res.body.map((d) => d.title)).toEqual(['Opening theory']);
  });

  it('AT2: joining updates the membership status, and the page can read it back', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const url = `/api/communities/${community.id}/membership`;

    expect((await user.get(url)).body.member).toBe(false);
    const joined = await user.post(url);
    expect(joined.status).toBe(201);
    expect(joined.body.member).toBe(true);
    expect((await user.get(url)).body.member).toBe(true);

    const mine = await user.get('/api/communities/memberships/mine');
    expect(mine.body.communities).toEqual([community.id]);
  });

  it('AT2: leaving updates the membership status', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const url = `/api/communities/${community.id}/membership`;
    await user.post(url);

    const left = await user.delete(url);
    expect(left.status).toBe(200);
    expect(left.body.member).toBe(false);
    expect((await user.get(url)).body.member).toBe(false);
    expect((await user.get('/api/communities/memberships/mine')).body.communities).toEqual([]);
  });

  it('joining twice never creates a duplicate membership', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const url = `/api/communities/${community.id}/membership`;
    expect((await user.post(url)).status).toBe(201);
    expect((await user.post(url)).status).toBe(200);
    expect(await Membership.countDocuments({ community: community._id })).toBe(1);
  });

  it('leaving a community you never joined is harmless', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const res = await user.delete(`/api/communities/${community.id}/membership`);
    expect(res.status).toBe(200);
    expect(res.body.member).toBe(false);
  });

  it('each person has their own membership', async () => {
    const community = await makeCommunity();
    const user = await loginAs('user');
    const moderator = await loginAs('moderator');
    await user.post(`/api/communities/${community.id}/membership`);
    expect((await moderator.get(`/api/communities/${community.id}/membership`)).body.member).toBe(false);
  });

  it('joining makes the community discussions available in the member discussion list', async () => {
    const community = await makeCommunity();
    await makeDiscussion(community, await demoUser('user'), { title: 'Members only list' });
    const user = await loginAs('user');
    expect((await user.get('/api/discussions')).body).toEqual([]);
    await user.post(`/api/communities/${community.id}/membership`);
    expect((await user.get('/api/discussions')).body.map((d) => d.title)).toEqual(['Members only list']);
  });

  it('rejects a malformed id (400), an unknown community (404) and anonymous visitors (401)', async () => {
    const user = await loginAs('user');
    expect((await user.get('/api/communities/not-an-id')).status).toBe(400);
    expect((await user.post('/api/communities/not-an-id/membership')).status).toBe(400);
    expect((await user.post('/api/communities/64b7f0c2a1b2c3d4e5f60718/membership')).status).toBe(404);
    expect((await anonymous().post('/api/communities/64b7f0c2a1b2c3d4e5f60718/membership')).status).toBe(401);
  });
});
