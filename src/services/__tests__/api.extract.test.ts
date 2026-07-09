import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../extractor');

import { POST, OPTIONS } from '../../pages/api/extract';
import { extractContent } from '../extractor';

let requestId = 0;

function createMockRequest(body: unknown): Request {
  requestId++;
  return new Request('http://localhost/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Visitor-Id': `test-visitor-${requestId}`,
    },
    body: JSON.stringify(body),
  });
}

const validMockData = {
  url: 'https://example.com',
  title: 'Test Title',
  description: 'Test Description',
  language: 'en',
  charset: 'utf-8',
  html: '<html></html>',
  text: 'hello',
  headings: [],
  images: [],
  links: [],
  forms: [],
  ctas: [],
  meta: {},
  statusCode: 200,
  timestamp: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OPTIONS handler', () => {
  it('returns 204 with CORS headers', async () => {
    const response = await OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });
});

describe('POST handler', () => {
  it('returns 400 for missing URL', async () => {
    const response = await POST({ request: createMockRequest({}) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or missing URL');
  });

  it('returns 400 for non-string URL', async () => {
    const response = await POST({ request: createMockRequest({ url: 123 }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or missing URL');
  });

  it('returns 400 for invalid URL format', async () => {
    const response = await POST({ request: createMockRequest({ url: 'not a url' }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid URL format');
  });

  it('normalizes URL without protocol', async () => {
    vi.mocked(extractContent).mockResolvedValue(validMockData);
    await POST({ request: createMockRequest({ url: 'example.com' }) });
    expect(vi.mocked(extractContent)).toHaveBeenCalledWith('https://example.com');
  });

  it('trims whitespace from URL', async () => {
    vi.mocked(extractContent).mockResolvedValue(validMockData);
    await POST({ request: createMockRequest({ url: '  https://example.com  ' }) });
    expect(vi.mocked(extractContent)).toHaveBeenCalledWith('https://example.com');
  });

  it('returns success with data and score for valid URL', async () => {
    vi.mocked(extractContent).mockResolvedValue(validMockData);
    const response = await POST({ request: createMockRequest({ url: 'https://example.com' }) });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(validMockData);
    expect(data.score).toBeDefined();
    expect(typeof data.score.overall).toBe('number');
  });

  it('returns 500 when extractor throws', async () => {
    vi.mocked(extractContent).mockRejectedValue(new Error('Browser crashed'));
    const response = await POST({ request: createMockRequest({ url: 'https://example.com' }) });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Browser crashed');
  });

  it('includes CORS headers on success response', async () => {
    vi.mocked(extractContent).mockResolvedValue(validMockData);
    const response = await POST({ request: createMockRequest({ url: 'https://example.com' }) });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes CORS headers on error response', async () => {
    const response = await POST({ request: createMockRequest({}) });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes X-RateLimit-* headers on success', async () => {
    vi.mocked(extractContent).mockResolvedValue(validMockData);
    const response = await POST({ request: createMockRequest({ url: 'https://example.com' }) });
    expect(response.headers.get('X-RateLimit-Limit')).toBe('3');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('2');
    expect(Number(response.headers.get('X-RateLimit-Reset'))).toBeGreaterThan(0);
  });

  it('includes X-RateLimit-* headers on 400 error', async () => {
    const response = await POST({ request: createMockRequest({}) });
    expect(response.headers.get('X-RateLimit-Limit')).toBe('3');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('2');
  });

  it('returns 429 with Retry-After when rate limit exceeded', async () => {
    const visitorId = crypto.randomUUID();

    const req1 = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const req2 = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const req3 = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const req4 = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    vi.mocked(extractContent).mockResolvedValue(validMockData);
    await POST({ request: req1 });
    await POST({ request: req2 });
    await POST({ request: req3 });

    vi.mocked(extractContent).mockRejectedValue(new Error('should not reach'));
    const response = await POST({ request: req4 });
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Daily analysis limit reached');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
});
