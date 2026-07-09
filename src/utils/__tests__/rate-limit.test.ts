import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../rate-limit';

const BASE_IP = '192.168.1.1';

describe('checkRateLimit', () => {
  it('allows first 3 requests for a new visitor', () => {
    const id = crypto.randomUUID();

    const r1 = checkRateLimit(id, BASE_IP);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(id, BASE_IP);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(id, BASE_IP);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks the 4th request and returns 0 remaining', () => {
    const id = crypto.randomUUID();

    checkRateLimit(id, BASE_IP);
    checkRateLimit(id, BASE_IP);
    checkRateLimit(id, BASE_IP);
    const r4 = checkRateLimit(id, BASE_IP);

    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetSeconds).toBeGreaterThan(0);
  });

  it('returns positive resetSeconds when blocked', () => {
    const id = crypto.randomUUID();

    checkRateLimit(id, BASE_IP);
    checkRateLimit(id, BASE_IP);
    checkRateLimit(id, BASE_IP);
    const r4 = checkRateLimit(id, BASE_IP);

    expect(r4.allowed).toBe(false);
    expect(r4.resetSeconds).toBeGreaterThanOrEqual(86000);
    expect(r4.resetSeconds).toBeLessThanOrEqual(86400);
  });

  it('uses visitorId when provided and ignores IP fallback', () => {
    const id = crypto.randomUUID();

    const r1 = checkRateLimit(id, 'ip-a');
    expect(r1.allowed).toBe(true);

    const r2 = checkRateLimit(id, 'ip-b');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it('falls back to IP when visitorId is null', () => {
    const ip = '10.0.0.1';

    const r1 = checkRateLimit(null, ip);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(null, ip);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it('falls back to IP when visitorId is "null" string', () => {
    const ip = '10.0.0.2';

    const r1 = checkRateLimit('null', ip);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit('null', ip);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it('treats different visitors independently', () => {
    const idA = crypto.randomUUID();
    const idB = crypto.randomUUID();

    checkRateLimit(idA, BASE_IP);
    checkRateLimit(idA, BASE_IP);
    checkRateLimit(idA, BASE_IP);
    const rA4 = checkRateLimit(idA, BASE_IP);
    expect(rA4.allowed).toBe(false);

    const rB1 = checkRateLimit(idB, BASE_IP);
    expect(rB1.allowed).toBe(true);
    expect(rB1.remaining).toBe(2);
  });

  it('returns 3 remaining on first request', () => {
    const id = crypto.randomUUID();
    const r1 = checkRateLimit(id, BASE_IP);
    expect(r1.remaining).toBe(2);
  });

  it('decrements remaining correctly on each request', () => {
    const id = crypto.randomUUID();

    expect(checkRateLimit(id, BASE_IP).remaining).toBe(2);
    expect(checkRateLimit(id, BASE_IP).remaining).toBe(1);
    expect(checkRateLimit(id, BASE_IP).remaining).toBe(0);
    expect(checkRateLimit(id, BASE_IP).remaining).toBe(0);
  });
});
