import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt, LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT } from '../prompts';
import type { ExtractedData } from '../extractor';

function mockData(overrides: Partial<ExtractedData> = {}): ExtractedData {
  return {
    url: 'https://example.com',
    title: '',
    description: '',
    language: 'en',
    charset: 'utf-8',
    html: '',
    text: '',
    headings: [],
    images: [],
    links: [],
    forms: [],
    ctas: [],
    meta: {},
    statusCode: 200,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT', () => {
  it('contains expected sections and JSON structure', () => {
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('CRO');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('summary');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('overallVerdict');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('recommendations');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('copySuggestions');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('headline');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('ctaText');
  });

  it('requires JSON-only response (no markdown)', () => {
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('valid JSON only');
    expect(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT).toContain('no markdown');
  });
});

describe('buildAnalysisPrompt', () => {
  it('includes the URL and title in the output', () => {
    const data = mockData({
      url: 'https://mysite.com/landing',
      title: 'My Awesome Landing Page',
    });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('mysite.com/landing');
    expect(prompt).toContain('My Awesome Landing Page');
  });

  it('lists all headings with proper level notation', () => {
    const data = mockData({
      headings: [
        { level: 1, text: 'Main Title' },
        { level: 2, text: 'Sub Title' },
        { level: 3, text: 'Detail' },
      ],
    });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('H1:');
    expect(prompt).toContain('H2:');
    expect(prompt).toContain('H3:');
    expect(prompt).toContain('Main Title');
    expect(prompt).toContain('Sub Title');
    expect(prompt).toContain('Detail');
  });

  it('includes CTAs with type and text', () => {
    const data = mockData({
      ctas: [
        { text: 'Buy Now', href: '/buy', type: 'button', tag: 'button' },
        { text: 'Learn More', href: '/learn', type: 'link', tag: 'a' },
      ],
    });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('Buy Now');
    expect(prompt).toContain('/buy');
    expect(prompt).toContain('Learn More');
    expect(prompt).toContain('[button]');
    expect(prompt).toContain('[link]');
  });

  it('includes forms with field count', () => {
    const data = mockData({
      forms: [
        {
          action: '/submit',
          method: 'post',
          inputs: [
            { type: 'email', name: 'email' },
            { type: 'text', name: 'name' },
          ],
        },
      ],
    });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('/submit');
    expect(prompt).toContain('fields: 2');
  });

  it('counts images up to a maximum of 10', () => {
    const images = Array.from({ length: 15 }, (_, i) => ({
      src: `https://ex.com/img${i}.jpg`,
      alt: `Image ${i}`,
    }));
    const data = mockData({ images });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('Images (15)');
    expect(prompt).toContain('Image 0');
    expect(prompt).toContain('Image 9');
  });

  it('handles empty page data gracefully', () => {
    const data = mockData();
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('example.com');
    expect(prompt).toContain('CTAs (0)');
    expect(prompt).toContain('Forms (0)');
    expect(prompt).toContain('Images (0)');
    expect(prompt).toContain('Links (0)');
  });

  it('reports screenshot availability', () => {
    const withScreenshot = mockData({ screenshot: 'base64data' });
    expect(buildAnalysisPrompt(withScreenshot)).toContain('Available');

    const withoutScreenshot = mockData({ screenshot: undefined });
    expect(buildAnalysisPrompt(withoutScreenshot)).toContain('Not available');
  });

  it('reports structured data when jsonLd is present', () => {
    const data = mockData({
      meta: { jsonLd: [{ '@context': 'https://schema.org' } as any] },
    });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('1 structured data entries');
  });

  it('shows N/A for missing meta fields', () => {
    const data = mockData({ meta: {} });
    const prompt = buildAnalysisPrompt(data);
    expect(prompt).toContain('OG Title: N/A');
    expect(prompt).toContain('OG Description: N/A');
  });
});
