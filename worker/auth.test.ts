import { describe, expect, it } from 'vitest';
import { readCookie, signToken, verifyToken } from './auth.ts';

describe('tokens', () => {
  it('round-trips', async () => {
    const token = await signToken('s', 'login', 'a@b.c', 2000);
    expect(await verifyToken('s', 'login', token, 1000)).toEqual({ email: 'a@b.c', expiresAt: 2000 });
  });

  it('rejects tampering, expiry and garbage', async () => {
    const token = await signToken('s', 'login', 'a@b.c', 2000);
    const [payload, signature] = token.split('.');
    const forged = `${btoa(JSON.stringify({ k: 'login', e: 'evil@b.c', x: 9e12 })).replace(/=+$/, '')}.${signature}`;
    expect(await verifyToken('s', 'login', forged, 1000)).toBeUndefined();
    expect(await verifyToken('s', 'login', token, 2000)).toBeUndefined();
    expect(await verifyToken('s', 'login', `${payload}.`, 1000)).toBeUndefined();
    expect(await verifyToken('s', 'login', 'nonsense', 1000)).toBeUndefined();
    expect(await verifyToken('s', 'login', '!!.!!', 1000)).toBeUndefined();
  });
});

describe('readCookie', () => {
  it('finds a cookie among several', () => {
    expect(readCookie('a=1; gmate_session=x=y; b=2', 'gmate_session')).toBe('x=y');
    expect(readCookie(null, 'a')).toBeUndefined();
  });
});
