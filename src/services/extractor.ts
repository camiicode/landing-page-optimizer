import { chromium } from 'playwright';
import type { SectionScreenshots } from '../types/extraction';

export interface ExtractedData {
  url: string;
  title: string;
  description: string;
  language: string;
  charset: string;
  html: string;
  text: string;
  headings: { level: number; text: string }[];
  images: { src: string; alt: string }[];
  links: { href: string; text: string }[];
  forms: {
    action: string;
    method: string;
    inputs: { type: string; name: string; placeholder?: string }[];
  }[];
  ctas: {
    text: string;
    href?: string;
    type: 'button' | 'link';
    tag: string;
  }[];
  meta: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    favicon?: string;
    jsonLd?: Record<string, unknown>[];
  };
  screenshot?: string;
  sectionScreenshots?: SectionScreenshots;
  statusCode: number;
  timestamp: string;
}

const CTA_SELECTORS = [
  'button',
  'input[type="submit"]',
  'a[role="button"]',
  'a.btn',
  'a[class*="cta"]',
  'a[class*="button"]',
  'a[class*="btn"]',
  'a[class*="primary"]',
  'a[class*="action"]',
  'a.cta-button',
  'a.wp-block-button__link',
];

export async function extractContent(url: string): Promise<ExtractedData> {
  console.log(`[extractor] Starting extraction for ${url}`);
  const t0 = Date.now();

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  console.log(`[extractor] Browser launched in ${Date.now() - t0}ms`);

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'es-ES',
  });

  const page = await context.newPage();

  try {
    const t1 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() =>
      page.goto(url, { waitUntil: 'load', timeout: 10000 })
    );
    console.log(`[extractor] page.goto completed in ${Date.now() - t1}ms`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const statusCode = page.url() ? 200 : 0;

    const data = await page.evaluate((ctaSelectors: string[]) => {
      const cleanText = (el: Element | null) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
      const cleanAttr = (el: Element | null, attr: string) => el?.getAttribute(attr) || '';

      const title = document.querySelector('title')?.textContent || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const language = document.documentElement.lang || '';
      const charset = document.characterSet || '';
      const html = document.documentElement.outerHTML;
      const text = document.body.innerText;

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
        level: parseInt(h.tagName[1], 10),
        text: h.textContent?.trim() || '',
      })).filter(h => h.text.length > 0);

      const images = Array.from(document.querySelectorAll('img[src]'))
        .map(img => ({
          src: (img as HTMLImageElement).src,
          alt: (img as HTMLImageElement).alt || '',
        }))
        .filter(img => img.src.length > 0);

      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({
          href: (a as HTMLAnchorElement).href,
          text: cleanText(a),
        }))
        .filter(l => l.href.length > 0);

      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        action: (form as HTMLFormElement).action || '',
        method: (form as HTMLFormElement).method || 'get',
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => {
          const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          const tag = el.tagName.toLowerCase();
          return {
            type: tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : (el as HTMLInputElement).type || 'text',
            name: el.name || '',
            placeholder: el.placeholder || '',
          };
        }),
      }));

      const ctaCandidates = new Set<Element>();
      ctaSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => ctaCandidates.add(el));
      });

      const ctas = Array.from(ctaCandidates)
        .map(el => {
          const tag = el.tagName.toLowerCase();
          const text = cleanText(el) || (el as HTMLInputElement).value || '';
          if (!text) return null;
          return {
            text,
            href: tag === 'a' ? (el as HTMLAnchorElement).href : undefined,
            type: (tag === 'a' ? 'link' : 'button') as 'button' | 'link',
            tag,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      const getMetaContent = (selectors: string[]): string | undefined => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.getAttribute('content') || undefined;
        }
        return undefined;
      };

      const ogTitle = getMetaContent(['meta[property="og:title"]', 'meta[name="og:title"]']);
      const ogDescription = getMetaContent(['meta[property="og:description"]', 'meta[name="og:description"]']);
      const ogImage = getMetaContent(['meta[property="og:image"]', 'meta[name="og:image"]']);
      const ogUrl = getMetaContent(['meta[property="og:url"]', 'meta[name="og:url"]']);
      const twitterCard = getMetaContent(['meta[name="twitter:card"]']);
      const twitterTitle = getMetaContent(['meta[name="twitter:title"]']);
      const twitterDescription = getMetaContent(['meta[name="twitter:description"]']);
      const twitterImage = getMetaContent(['meta[name="twitter:image"]']);

      const faviconEl =
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]') ||
        document.querySelector('link[rel="apple-touch-icon"]');
      const favicon = faviconEl?.getAttribute('href') || undefined;

      let jsonLd: Record<string, unknown>[] = [];
      try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLd = Array.from(scripts)
          .map(s => {
            try {
              return JSON.parse(s.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Record<string, unknown>[];
      } catch {
        // ignore JSON-LD parse errors
      }

      return {
        title,
        description,
        language,
        charset,
        html,
        text,
        headings,
        images,
        links,
        forms,
        ctas,
        meta: {
          ogTitle,
          ogDescription,
          ogImage,
          ogUrl,
          twitterCard,
          twitterTitle,
          twitterDescription,
          twitterImage,
          favicon,
          jsonLd,
        },
      };
    }, CTA_SELECTORS);
    console.log(`[extractor] page.evaluate completed in ${Date.now() - t0}ms`);

    let screenshot: string | undefined;
    try {
      screenshot = await page.screenshot({ type: 'png', fullPage: false, timeout: 5000 }).then(buf => buf.toString('base64'));
    } catch {
      // screenshot is optional
    }

    const sectionScreenshots: SectionScreenshots = {};
    try {
      const heroLocator = page.locator('section').filter({ has: page.locator('h1') }).first()
        .or(page.locator('[class*="hero"], [id*="hero"]').first())
        .or(page.locator('header').first())
        .or(page.locator('h1').first());
      const heroBuf = await heroLocator.screenshot({ type: 'png', timeout: 2000 }).catch(() => null);
      if (heroBuf) sectionScreenshots.hero = heroBuf.toString('base64');
    } catch {}
    console.log(`[extractor] Section screenshots — hero done in ${Date.now() - t0}ms`);

    try {
      const ctaEls = await page.locator(CTA_SELECTORS.join(',')).all();
      for (const el of ctaEls) {
        try {
          const buf = await el.screenshot({ type: 'png', timeout: 2000 });
          if (!sectionScreenshots.ctas) sectionScreenshots.ctas = [];
          sectionScreenshots.ctas.push(buf.toString('base64'));
        } catch {}
      }
    } catch {}
    console.log(`[extractor] Section screenshots — ${(sectionScreenshots.ctas ?? []).length} CTAs done in ${Date.now() - t0}ms`);

    try {
      const formEls = await page.locator('form').all();
      for (const el of formEls) {
        try {
          const buf = await el.screenshot({ type: 'png', timeout: 2000 });
          if (!sectionScreenshots.forms) sectionScreenshots.forms = [];
          sectionScreenshots.forms.push(buf.toString('base64'));
        } catch {}
      }
    } catch {}
    console.log(`[extractor] Section screenshots — ${(sectionScreenshots.forms ?? []).length} forms done in ${Date.now() - t0}ms`);

    await browser.close();
    console.log(`[extractor] Total extraction completed in ${Date.now() - t0}ms`);

    return {
      url,
      ...data,
      statusCode,
      screenshot,
      sectionScreenshots: Object.keys(sectionScreenshots).length > 0 ? sectionScreenshots : undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await browser.close();
    throw new Error(
      `Failed to extract content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
