import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoring';
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

describe('calculateScore', () => {
  it('returns minimal scores for an empty page', () => {
    const result = calculateScore(mockData());
    expect(result.sections.hero).toBe(0);
    expect(result.sections.ctas).toBe(0);
    expect(result.sections.forms).toBe(0);
    expect(result.sections.seo).toBe(0);
    expect(result.sections.accessibility).toBe(25);
    expect(result.sections.socialProof).toBe(40);
    expect(result.overall).toBe(11);
  });

  it('returns high scores for a complete page', () => {
    const data = mockData({
      title: 'This is a perfectly optimized title for SEO purposes',
      description: 'This description is long enough to be considered optimal for search engine result pages and user engagement.',
      headings: [
        { level: 1, text: 'Main Heading' },
        { level: 2, text: 'Subheading' },
        { level: 3, text: 'Detail' },
      ],
      ctas: [
        { text: 'Buy Now', href: '/buy', type: 'link' as const, tag: 'a' },
        { text: 'Learn More', href: '/learn', type: 'button' as const, tag: 'button' },
        { text: 'Subscribe', href: '/sub', type: 'link' as const, tag: 'a' },
      ],
      forms: [
        { action: '/submit', method: 'post', inputs: [{ type: 'email', name: 'email' }] },
      ],
      images: [
        { src: 'https://example.com/img1.jpg', alt: 'Image 1' },
        { src: 'https://example.com/img2.jpg', alt: 'Image 2' },
        { src: 'https://example.com/img3.jpg', alt: 'Image 3' },
      ],
      links: [
        { href: '/a', text: 'Link A' },
        { href: '/b', text: 'Link B' },
        { href: '/c', text: 'Link C' },
        { href: '/d', text: 'Link D' },
        { href: '/e', text: 'Link E' },
        { href: '/f', text: 'Link F' },
      ],
    });
    const result = calculateScore(data);
    expect(result.overall).toBeGreaterThanOrEqual(80);
    expect(result.sections.hero).toBe(100);
    expect(result.sections.ctas).toBe(100);
    expect(result.sections.forms).toBe(100);
  });

  it('scores title correctly at boundaries', () => {
    const short = calculateScore(mockData({ title: 'Short' }));
    expect(short.details.title.score).toBe(50);

    const min = calculateScore(mockData({ title: 'A'.repeat(20) }));
    expect(min.details.title.score).toBe(100);

    const max = calculateScore(mockData({ title: 'A'.repeat(70) }));
    expect(max.details.title.score).toBe(100);

    const over = calculateScore(mockData({ title: 'A'.repeat(71) }));
    expect(over.details.title.score).toBe(50);

    const empty = calculateScore(mockData({ title: '' }));
    expect(empty.details.title.score).toBe(0);
  });

  it('scores description correctly at boundaries', () => {
    const short = calculateScore(mockData({ description: 'Short' }));
    expect(short.details.description.score).toBe(50);

    const min = calculateScore(mockData({ description: 'A'.repeat(50) }));
    expect(min.details.description.score).toBe(100);

    const max = calculateScore(mockData({ description: 'A'.repeat(160) }));
    expect(max.details.description.score).toBe(100);

    const over = calculateScore(mockData({ description: 'A'.repeat(161) }));
    expect(over.details.description.score).toBe(50);

    const empty = calculateScore(mockData({ description: '' }));
    expect(empty.details.description.score).toBe(0);
  });

  it('scores headings: 0, 50, or 100', () => {
    const none = calculateScore(mockData({ headings: [] }));
    expect(none.details.headings.score).toBe(0);

    const one = calculateScore(mockData({ headings: [{ level: 1, text: 'Only' }] }));
    expect(one.details.headings.score).toBe(50);

    const two = calculateScore(mockData({
      headings: [{ level: 1, text: 'A' }, { level: 2, text: 'B' }],
    }));
    expect(two.details.headings.score).toBe(100);
  });

  it('scores CTAs: 0, 60, or 100', () => {
    const none = calculateScore(mockData({ ctas: [] }));
    expect(none.details.ctas.score).toBe(0);
    expect(none.sections.ctas).toBe(0);

    const one = calculateScore(mockData({
      ctas: [{ text: 'Click', href: '/go', type: 'button', tag: 'button' }],
    }));
    expect(one.details.ctas.score).toBe(60);
    expect(one.sections.ctas).toBe(60);

    const two = calculateScore(mockData({
      ctas: [
        { text: 'A', href: '/a', type: 'button', tag: 'button' },
        { text: 'B', href: '/b', type: 'link', tag: 'a' },
      ],
    }));
    expect(two.details.ctas.score).toBe(100);
    expect(two.sections.ctas).toBe(100);
  });

  it('scores forms: 0 or 100', () => {
    const none = calculateScore(mockData({ forms: [] }));
    expect(none.details.forms.score).toBe(0);

    const one = calculateScore(mockData({
      forms: [{ action: '/submit', method: 'post', inputs: [] }],
    }));
    expect(one.details.forms.score).toBe(100);
  });

  it('scores images: 0, 60, or 100', () => {
    const none = calculateScore(mockData({ images: [] }));
    expect(none.details.images.score).toBe(0);

    const one = calculateScore(mockData({
      images: [{ src: 'https://ex.com/a.jpg', alt: 'A' }],
    }));
    expect(one.details.images.score).toBe(60);

    const three = calculateScore(mockData({
      images: [
        { src: 'https://ex.com/a.jpg', alt: 'A' },
        { src: 'https://ex.com/b.jpg', alt: 'B' },
        { src: 'https://ex.com/c.jpg', alt: 'C' },
      ],
    }));
    expect(three.details.images.score).toBe(100);
  });

  it('sectionMessages exist for every section key', () => {
    const result = calculateScore(mockData());
    const keys = ['hero', 'ctas', 'forms', 'seo', 'accessibility', 'socialProof'];
    for (const key of keys) {
      expect(result.sectionMessages[key]).toBeDefined();
      expect(typeof result.sectionMessages[key].score).toBe('number');
      expect(typeof result.sectionMessages[key].message).toBe('string');
    }
  });

  it('overall is the average of all section scores', () => {
    const result = calculateScore(mockData({
      title: 'Perfect title length for optimal scoring here',
      description: 'Great description that is long enough to pass the fifty character threshold easily.',
      headings: [{ level: 1, text: 'H1' }, { level: 2, text: 'H2' }],
      ctas: [
        { text: 'A', href: '/a', type: 'button', tag: 'button' },
        { text: 'B', href: '/b', type: 'link', tag: 'a' },
      ],
      forms: [{ action: '/s', method: 'post', inputs: [] }],
      images: [
        { src: 'https://ex.com/a.jpg', alt: 'A' },
        { src: 'https://ex.com/b.jpg', alt: 'B' },
        { src: 'https://ex.com/c.jpg', alt: 'C' },
      ],
      links: [
        { href: '/a', text: 'A' }, { href: '/b', text: 'B' },
        { href: '/c', text: 'C' }, { href: '/d', text: 'D' },
        { href: '/e', text: 'E' }, { href: '/f', text: 'F' },
      ],
    }));
    const expected = Math.round(
      Object.values(result.sections).reduce((a, b) => a + b, 0) /
      Object.values(result.sections).length
    );
    expect(result.overall).toBe(expected);
  });

  describe('section messages content', () => {
    it('hero: missing title', () => {
      const result = calculateScore(mockData({ title: '', headings: [] }));
      expect(result.sectionMessages.hero.message).toBe('Missing main title');
    });

    it('hero: title + score >= 70', () => {
      const result = calculateScore(mockData({
        title: 'Perfect title length for optimal SEO results here',
        headings: [{ level: 1, text: 'H1' }, { level: 2, text: 'H2' }],
      }));
      expect(result.sectionMessages.hero.score).toBeGreaterThanOrEqual(70);
      expect(result.sectionMessages.hero.message).toBe('Good value proposition');
    });

    it('hero: title + score < 70', () => {
      const result = calculateScore(mockData({ title: 'Short', headings: [] }));
      expect(result.sectionMessages.hero.score).toBeLessThan(70);
      expect(result.sectionMessages.hero.message).toBe('Could be improved, optimize the title');
    });

    it('ctas: no CTAs', () => {
      const result = calculateScore(mockData({ ctas: [] }));
      expect(result.sectionMessages.ctas.message).toBe('No CTAs detected');
    });

    it('ctas: has CTAs + score >= 70', () => {
      const result = calculateScore(mockData({
        ctas: [
          { text: 'A', href: '/a', type: 'button', tag: 'button' },
          { text: 'B', href: '/b', type: 'link', tag: 'a' },
        ],
      }));
      expect(result.sectionMessages.ctas.score).toBeGreaterThanOrEqual(70);
      expect(result.sectionMessages.ctas.message).toBe('Effective and sufficient CTAs');
    });

    it('ctas: has CTAs + score < 70', () => {
      const result = calculateScore(mockData({
        ctas: [{ text: 'A', href: '/a', type: 'button', tag: 'button' }],
      }));
      expect(result.sectionMessages.ctas.score).toBeLessThan(70);
      expect(result.sectionMessages.ctas.message).toBe('CTAs present but could be improved');
    });

    it('forms: no forms', () => {
      const result = calculateScore(mockData({ forms: [] }));
      expect(result.sectionMessages.forms.message).toBe('No capture form found');
    });

    it('forms: has forms', () => {
      const result = calculateScore(mockData({
        forms: [{ action: '/submit', method: 'post', inputs: [] }],
      }));
      expect(result.sectionMessages.forms.message).toBe('Capture form detected');
    });

    it('seo: missing title and description', () => {
      const result = calculateScore(mockData({ title: '', description: '' }));
      expect(result.sectionMessages.seo.message).toBe('Missing SEO metadata (title and description)');
    });

    it('seo: both present + score >= 70', () => {
      const result = calculateScore(mockData({
        title: 'Perfect title length for optimal SEO results here',
        description: 'This description is long enough to be considered optimal for search engine result pages and user engagement.',
      }));
      expect(result.sectionMessages.seo.score).toBeGreaterThanOrEqual(70);
      expect(result.sectionMessages.seo.message).toBe('Good on-page SEO');
    });

    it('seo: both present + score < 70', () => {
      const result = calculateScore(mockData({ title: 'Short', description: 'Short' }));
      expect(result.sectionMessages.seo.score).toBeLessThan(70);
      expect(result.sectionMessages.seo.message).toBe('Improve SEO metadata');
    });

    it('accessibility: no headings', () => {
      const result = calculateScore(mockData({ headings: [] }));
      expect(result.sectionMessages.accessibility.message).toBe('Missing heading structure');
    });

    it('accessibility: headings + score >= 70', () => {
      const result = calculateScore(mockData({
        headings: [{ level: 1, text: 'A' }, { level: 2, text: 'B' }],
      }));
      expect(result.sectionMessages.accessibility.score).toBeGreaterThanOrEqual(70);
      expect(result.sectionMessages.accessibility.message).toBe('Good accessibility structure');
    });

    it('accessibility: headings + score < 70', () => {
      const result = calculateScore(mockData({
        headings: [{ level: 1, text: 'A' }],
        images: [],
      }));
      expect(result.sectionMessages.accessibility.score).toBeLessThan(70);
      expect(result.sectionMessages.accessibility.message).toBe('Heading structure could be improved');
    });

    it('socialProof: trust signals via images (>= 2)', () => {
      const result = calculateScore(mockData({
        images: [{ src: 'https://ex.com/a.jpg', alt: 'A' }, { src: 'https://ex.com/b.jpg', alt: 'B' }],
        links: [],
      }));
      expect(result.sectionMessages.socialProof.message).toBe('Trust signals detected');
    });

    it('socialProof: trust signals via many links (> 5)', () => {
      const result = calculateScore(mockData({
        images: [],
        links: Array.from({ length: 6 }, (_, i) => ({ href: `/${i}`, text: `${i}` })),
      }));
      expect(result.sectionMessages.socialProof.message).toBe('Trust signals detected');
    });

    it('socialProof: not enough signals', () => {
      const result = calculateScore(mockData({
        images: [{ src: 'https://ex.com/a.jpg', alt: 'A' }],
        links: [{ href: '/a', text: 'A' }, { href: '/b', text: 'B' }],
      }));
      expect(result.sectionMessages.socialProof.message).toBe('Add more social proof (images, testimonials)');
    });
  });

});
