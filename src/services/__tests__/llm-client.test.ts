import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock de Google AI ────────────────────────────────────────────
const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => {
  class MockGoogleGenerativeAI {
    constructor(_key: string) {}
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, body: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(body),
  });
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new Error('Network failure'));
}

describe('llm-client', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGenerateContent.mockReset();
  });

  // ── Gemini tests ──────────────────────────────────────────────

  describe('analyzeWithGemini', () => {
    it('returns null when GEMINI_API_KEY is not set', async () => {
      process.env.GEMINI_API_KEY = '';
      const { analyzeWithGemini } = await import('../llm-client');
      const result = await analyzeWithGemini('system', 'user');
      expect(result).toBeNull();
    });

    it('returns content when API key is set and call succeeds', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'Generated analysis text' },
      });
      const { analyzeWithGemini } = await import('../llm-client');
      const result = await analyzeWithGemini('You are an expert', 'Analyze this page');
      expect(result).toBe('Generated analysis text');
      expect(mockGenerateContent).toHaveBeenCalledOnce();
    });

    it('passes system and user prompts combined to the model', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'result' },
      });
      const { analyzeWithGemini } = await import('../llm-client');
      await analyzeWithGemini('System prompt', 'User prompt');
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].parts[0].text).toContain('System prompt');
      expect(callArg.contents[0].parts[0].text).toContain('User prompt');
    });

    it('re-throws errors from the API', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      mockGenerateContent.mockRejectedValue(new Error('API failure'));
      const { analyzeWithGemini } = await import('../llm-client');
      await expect(analyzeWithGemini('sys', 'user')).rejects.toThrow('API failure');
    });

    it('uses custom apiKey when provided instead of env key', async () => {
      process.env.GEMINI_API_KEY = 'default-key';
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'custom key result' },
      });
      const { analyzeWithGemini } = await import('../llm-client');
      const result = await analyzeWithGemini('sys', 'user', 'custom-key-123');
      expect(result).toBe('custom key result');
      expect(mockGenerateContent).toHaveBeenCalledOnce();
    });

    it('returns null when custom apiKey is empty string', async () => {
      process.env.GEMINI_API_KEY = '';
      const { analyzeWithGemini } = await import('../llm-client');
      const result = await analyzeWithGemini('sys', 'user', '');
      expect(result).toBeNull();
    });
  });

  // ── Groq tests ────────────────────────────────────────────────

  describe('analyzeWithGroq', () => {
    it('returns null when GROQ_API_KEY is not set', async () => {
      process.env.GROQ_API_KEY = '';
      const { analyzeWithGroq } = await import('../llm-client');
      const result = await analyzeWithGroq('system', 'user');
      expect(result).toBeNull();
    });

    it('returns content when key is set and fetch succeeds', async () => {
      process.env.GROQ_API_KEY = 'gsk_test-key';
      globalThis.fetch = mockFetchOk({
        choices: [{ message: { content: 'Groq analysis result' } }],
      });
      const { analyzeWithGroq } = await import('../llm-client');
      const result = await analyzeWithGroq('You are an expert', 'Analyze this page');
      expect(result).toBe('Groq analysis result');
    });

    it('sends correct request shape to Groq API', async () => {
      process.env.GROQ_API_KEY = 'gsk_test-key';
      const fetchMock = mockFetchOk({
        choices: [{ message: { content: 'ok' } }],
      });
      globalThis.fetch = fetchMock;
      const { analyzeWithGroq } = await import('../llm-client');
      await analyzeWithGroq('System prompt', 'User prompt');

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Authorization']).toBe('Bearer gsk_test-key');
      expect(opts.body).toContain('"model":"llama-3.1-8b-instant"');
      expect(opts.body).toContain('System prompt');
      expect(opts.body).toContain('User prompt');
    });

    it('returns null on HTTP error from Groq', async () => {
      process.env.GROQ_API_KEY = 'gsk_test-key';
      globalThis.fetch = mockFetchError(429, 'Rate limit exceeded');
      const { analyzeWithGroq } = await import('../llm-client');
      const result = await analyzeWithGroq('sys', 'user');
      expect(result).toBeNull();
    });

    it('returns null on network failure', async () => {
      process.env.GROQ_API_KEY = 'gsk_test-key';
      globalThis.fetch = mockFetchNetworkError();
      const { analyzeWithGroq } = await import('../llm-client');
      const result = await analyzeWithGroq('sys', 'user');
      expect(result).toBeNull();
    });
  });
});
