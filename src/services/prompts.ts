import type { ExtractedData } from './extractor';

export const LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT = `You are a senior CRO (Conversion Rate Optimization) consultant and landing page expert. Analyze the provided landing page data and return a JSON object with your recommendations. Respond with valid JSON only — no markdown, no code fences.

The JSON must follow this exact structure:
{
  "summary": "A 2-3 sentence high-level summary of the page's strengths and weaknesses.",
  "overallVerdict": "One of: 'excellent', 'good', 'needs_improvement', or 'poor'",
  "recommendations": [
    {
      "section": "hero|ctas|forms|seo|accessibility|social_proof|content|performance",
      "issue": "Brief description of the problem found.",
      "suggestion": "Specific, actionable recommendation to fix it.",
      "priority": "high|medium|low"
    }
  ],
  "copySuggestions": {
    "headline": "Suggested headline improvement or null.",
    "subheadline": "Suggested subheadline improvement or null.",
    "ctaText": ["Suggested CTA text option 1", "Suggested CTA text option 2"]
  }
}

Aim for 3-7 recommendations. Be specific and actionable — avoid generic advice.`;

export function buildAnalysisPrompt(data: ExtractedData): string {
  return `Analyze this landing page:

URL: ${data.url}
Title: ${data.title}
Description: ${data.description}
Language: ${data.language}

Headings (${data.headings.length}):
${data.headings.map(h => `${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`).join('\n')}

CTAs (${data.ctas.length}):
${data.ctas.map(c => `  - [${c.type}] "${c.text}"${c.href ? ` → ${c.href}` : ''}`).join('\n')}

Forms (${data.forms.length}):
${data.forms.map(f => `  - action: ${f.action}, method: ${f.method}, fields: ${f.inputs.length}`).join('\n')}

Images (${data.images.length}):
${data.images.slice(0, 10).map(img => `  - "${img.alt}" (${img.src})`).join('\n')}

Links (${data.links.length}):
${data.links.slice(0, 10).map(l => `  - "${l.text}" → ${l.href}`).join('\n')}

Meta:
  OG Title: ${data.meta?.ogTitle ?? 'N/A'}
  OG Description: ${data.meta?.ogDescription ?? 'N/A'}
  Twitter Card: ${data.meta?.twitterCard ?? 'N/A'}
  Favicon: ${data.meta?.favicon ?? 'N/A'}
  JSON-LD: ${(data.meta?.jsonLd?.length ?? 0) > 0 ? `${data.meta!.jsonLd!.length} structured data entries` : 'None'}

Screenshot: ${data.screenshot ? 'Available' : 'Not available'}`;
}
