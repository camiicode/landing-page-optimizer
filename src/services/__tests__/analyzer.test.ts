import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtractedData } from '../extractor';

const mockAnalyzeWithGemini = vi.fn();

vi.mock('../llm-client', () => ({
  analyzeWithGemini: mockAnalyzeWithGemini,
}));

function mockData(overrides: Partial<ExtractedData> = {}): ExtractedData {
  return {
    url: 'https://example.com',
    title: 'Test Page Title',
    description: 'A test description for the landing page.',
    language: 'en',
    charset: 'utf-8',
    html: '<html></html>',
    text: 'Some page text content',
    headings: [{ level: 1, text: 'Welcome' }],
    images: [{ src: 'https://ex.com/img.jpg', alt: 'Test image' }],
    links: [{ href: 'https://ex.com/about', text: 'About' }],
    forms: [],
    ctas: [{ text: 'Click Here', href: '/go', type: 'button', tag: 'button' }],
    meta: { ogTitle: 'OG Test' },
    statusCode: 200,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('analyzeWithAI', () => {
  beforeEach(() => {
    mockAnalyzeWithGemini.mockReset();
  });

  it('returns null when Gemini returns null', async () => {
    mockAnalyzeWithGemini.mockResolvedValue(null);
    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).toBeNull();
  });

  it('parses a valid JSON response from Gemini', async () => {
    const validResponse = JSON.stringify({
      summary: 'Good page with room for improvement in CTAs.',
      overallVerdict: 'good',
      recommendations: [
        {
          section: 'ctas',
          issue: 'Only one CTA detected',
          suggestion: 'Add a secondary CTA for non-ready visitors.',
          priority: 'high',
        },
      ],
      copySuggestions: {
        headline: 'Transform Your Workflow Today',
        ctaText: ['Get Started Free', 'See Pricing'],
      },
    });
    mockAnalyzeWithGemini.mockResolvedValue(validResponse);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Good page with room for improvement in CTAs.');
    expect(result!.overallVerdict).toBe('good');
    expect(result!.recommendations).toHaveLength(1);
    expect(result!.recommendations[0].section).toBe('ctas');
    expect(result!.recommendations[0].priority).toBe('high');
    expect(result!.copySuggestions.headline).toBe('Transform Your Workflow Today');
    expect(result!.copySuggestions.ctaText).toHaveLength(2);
  });

  it('strips markdown code fences from Gemini response', async () => {
    const withFences = '```json\n{"summary":"OK","overallVerdict":"good","recommendations":[],"copySuggestions":{}}\n```';
    mockAnalyzeWithGemini.mockResolvedValue(withFences);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('OK');
  });

  it('strips code fences without language tag', async () => {
    const withFences = '```\n{"summary":"OK","overallVerdict":"good","recommendations":[],"copySuggestions":{}}\n```';
    mockAnalyzeWithGemini.mockResolvedValue(withFences);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(result!.summary).toBe('OK');
  });

  it('returns null when JSON is invalid', async () => {
    mockAnalyzeWithGemini.mockResolvedValue('This is not JSON');

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).toBeNull();
  });

  it('returns null when response is missing required fields', async () => {
    const missingFields = JSON.stringify({
      summary: 'Only summary present',
    });
    mockAnalyzeWithGemini.mockResolvedValue(missingFields);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).toBeNull();
  });

  it('returns null when Gemini API throws an error', async () => {
    mockAnalyzeWithGemini.mockRejectedValue(new Error('API quota exceeded'));

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).toBeNull();
  });

  it('accepts recommendations with all valid section values', async () => {
    const sections = ['hero', 'ctas', 'forms', 'seo', 'accessibility', 'social_proof', 'content', 'performance'];
    const recs = sections.map(s => ({
      section: s,
      issue: `Issue with ${s}`,
      suggestion: `Fix ${s}`,
      priority: 'medium' as const,
    }));

    const response = JSON.stringify({
      summary: 'Multi-section analysis.',
      overallVerdict: 'needs_improvement',
      recommendations: recs,
      copySuggestions: {},
    });
    mockAnalyzeWithGemini.mockResolvedValue(response);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(result!.recommendations).toHaveLength(sections.length);
    expect(result!.recommendations.map(r => r.section)).toEqual(sections);
  });

  it('accepts all valid priority values', async () => {
    const priorities = ['high', 'medium', 'low'] as const;
    const recs = priorities.map(p => ({
      section: 'hero',
      issue: 'Test',
      suggestion: 'Fix',
      priority: p,
    }));

    const response = JSON.stringify({
      summary: 'Priority test.',
      overallVerdict: 'poor',
      recommendations: recs,
      copySuggestions: {},
    });
    mockAnalyzeWithGemini.mockResolvedValue(response);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(result!.recommendations.map(r => r.priority)).toEqual(['high', 'medium', 'low']);
  });

  it('handles empty recommendations array', async () => {
    const response = JSON.stringify({
      summary: 'Perfect page, no issues.',
      overallVerdict: 'excellent',
      recommendations: [],
      copySuggestions: {},
    });
    mockAnalyzeWithGemini.mockResolvedValue(response);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(result!.recommendations).toEqual([]);
  });

  it('handles all overallVerdict values', async () => {
    const verdicts = ['excellent', 'good', 'needs_improvement', 'poor'];
    for (const verdict of verdicts) {
      const response = JSON.stringify({
        summary: 'Test.',
        overallVerdict: verdict,
        recommendations: [],
        copySuggestions: {},
      });
      mockAnalyzeWithGemini.mockResolvedValue(response);
      const { analyzeWithAI } = await import('../analyzer');
      const result = await analyzeWithAI(mockData());
      expect(result!.overallVerdict).toBe(verdict);
    }
  });

  it('returns null when recommendations is not an array', async () => {
    const badResponse = JSON.stringify({
      summary: 'Test',
      overallVerdict: 'good',
      recommendations: 'not an array',
      copySuggestions: {},
    });
    mockAnalyzeWithGemini.mockResolvedValue(badResponse);

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).toBeNull();
  });

  it('propagates custom apiKey to analyzeWithGemini', async () => {
    mockAnalyzeWithGemini.mockResolvedValue(JSON.stringify({
      summary: 'Custom key test.',
      overallVerdict: 'good',
      recommendations: [],
      copySuggestions: {},
    }));

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData(), 'my-custom-key');
    expect(result).not.toBeNull();
    expect(mockAnalyzeWithGemini).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'my-custom-key'
    );
  });

  it('works without apiKey parameter (backwards compatible)', async () => {
    mockAnalyzeWithGemini.mockResolvedValue(JSON.stringify({
      summary: 'Default key test.',
      overallVerdict: 'good',
      recommendations: [],
      copySuggestions: {},
    }));

    const { analyzeWithAI } = await import('../analyzer');
    const result = await analyzeWithAI(mockData());
    expect(result).not.toBeNull();
    expect(mockAnalyzeWithGemini).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined
    );
  });
});
