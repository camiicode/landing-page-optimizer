import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('llm-client', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGenerateContent.mockReset();
  });

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
