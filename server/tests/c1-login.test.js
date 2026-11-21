import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anonymous, DEMO, loginAs, PASSWORD, startTestDb, stopTestDb } from './helpers.js';

beforeAll(startTestDb);
afterAll(stopTestDb);

describe('C1 Sign in', () => {
  it.each([
    ['user', 'user'],
    ['moderator', 'moderator'],
    ['admin', 'admin'],
  ])('AT1: valid credentials sign in the %s and return the role used to pick the home screen', async (role, expected) => {
    const res = await anonymous().post('/api/auth/login').send({ email: DEMO[role], password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe(expected);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('AT2: a wrong password shows an error and does not create a session', async () => {
    const agent = anonymous();
    const res = await agent.post('/api/auth/login').send({ email: DEMO.user, password: 'WrongPassword1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('AT2: an unknown email is rejected with the same generic message', async () => {
    const res = await anonymous().post('/api/auth/login').send({ email: 'nobody@demo.com', password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('a signed-in user stays signed in (/me) until logout, then is refused', async () => {
    const agent = await loginAs('user');
    expect((await agent.get('/api/auth/me')).body.user.email).toBe(DEMO.user);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('registering with an existing email (any letter case) is rejected with 409', async () => {
    const res = await anonymous()
      .post('/api/auth/register')
      .send({ name: 'Copy Cat', email: 'USER@Demo.com', password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('registering creates a regular user, even if a role is sent', async () => {
    const res = await anonymous()
      .post('/api/auth/register')
      .send({ name: 'New Person', email: 'new.person@test.com', password: PASSWORD, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });

  it('5 wrong passwords lock the account for 5 minutes, and the right password is refused while locked', async () => {
    await anonymous().post('/api/auth/register').send({ name: 'Lock Me', email: 'lock.me@test.com', password: PASSWORD });
    const attempt = (password) => anonymous().post('/api/auth/login').send({ email: 'lock.me@test.com', password });

    for (let i = 0; i < 4; i += 1) expect((await attempt('WrongPassword1!')).status).toBe(401);
    const locked = await attempt('WrongPassword1!');
    expect(locked.status).toBe(423);
    expect(locked.body.retryAfter).toBe(300);
    expect((await attempt(PASSWORD)).status).toBe(423);
  });

  it('protected API routes refuse anonymous visitors', async () => {
    expect((await anonymous().get('/api/communities')).status).toBe(401);
  });
});
