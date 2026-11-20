import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Membership from '../src/models/Membership.js';
import { anonymous, demoUser, loginAs, makeCommunity, resetData, startTestDb, stopTestDb } from './helpers.js';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(resetData);

describe('A1 Manage communities (administrator)', () => {
  it('AT1: a newly created community appears in the community list', async () => {
    const admin = await loginAs('admin');
    const created = await admin.post('/api/admin/communities').send({ name: 'Gardening', description: 'Plants', rules: 'Be kind' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'Gardening', description: 'Plants', rules: 'Be kind' });

    const list = await admin.get('/api/admin/communities');
    expect(list.body.map((c) => c.name)).toContain('Gardening');

    // ...and members of the platform can see it too
    const member = await loginAs('user');
    expect((await member.get('/api/communities')).body.map((c) => c.name)).toContain('Gardening');
  });

  it('a community needs a name, and names are unique', async () => {
    const admin = await loginAs('admin');
    expect((await admin.post('/api/admin/communities').send({ name: '   ' })).status).toBe(400);
    await admin.post('/api/admin/communities').send({ name: 'Gardening' });
    expect((await admin.post('/api/admin/communities').send({ name: 'Gardening' })).status).toBe(409);
  });

  it('AT2: deleting a community removes it from the active list', async () => {
    const admin = await loginAs('admin');
    const community = await makeCommunity({ name: 'Temporary' });
    expect((await admin.delete(`/api/admin/communities/${community.id}`)).status).toBe(204);
    expect((await admin.get('/api/admin/communities')).body.map((c) => c.name)).not.toContain('Temporary');
  });

  it('a community that already has members cannot be deleted', async () => {
    const admin = await loginAs('admin');
    const community = await makeCommunity();
    await Membership.create({ user: (await demoUser('user'))._id, community: community._id });
    expect((await admin.delete(`/api/admin/communities/${community.id}`)).status).toBe(409);
  });

  it('AT3: assigning a moderator updates the community moderator list', async () => {
    const admin = await loginAs('admin');
    const community = await makeCommunity();
    const moderator = await demoUser('moderator');

    const candidates = await admin.get('/api/admin/moderator-candidates');
    expect(candidates.body.map((u) => u.id)).toContain(moderator.id);

    const res = await admin.put(`/api/admin/communities/${community.id}/moderators/${moderator.id}`);
    expect(res.status).toBe(200);
    expect(res.body.moderators.map((m) => m.id)).toContain(moderator.id);
  });

  it('only users with the moderator role can be assigned as moderators', async () => {
    const admin = await loginAs('admin');
    const community = await makeCommunity();
    const regular = await demoUser('user');
    const res = await admin.put(`/api/admin/communities/${community.id}/moderators/${regular.id}`);
    expect(res.status).toBe(400);
  });

  it('non-administrators are refused (403) and anonymous visitors get 401', async () => {
    const user = await loginAs('user');
    const moderator = await loginAs('moderator');
    expect((await user.post('/api/admin/communities').send({ name: 'Sneaky' })).status).toBe(403);
    expect((await moderator.get('/api/admin/communities')).status).toBe(403);
    expect((await anonymous().get('/api/admin/communities')).status).toBe(401);
  });
});
