# Changelog

## [0.1.0] - 2026-07-02 — MVP Release

### Added
- Groq (LLaMA 3.1 8B) as default AI provider — free, 14,400 req/day
- `analyzeWithGroq()` client using OpenAI-compatible fetch API
- Fallback logic: Groq by default, Gemini when user provides custom API key
- Section-specific screenshots: Playwright captures hero, CTA, and form elements during extraction
- Screenshots displayed in AI recommendation cards for visual context
- Diagnostic error messages when AI analysis fails (missing key vs quota exceeded)
- `SectionScreenshots` type and `sectionScreenshots` field on `ExtractedData`
- `Page.goto` fallback: `load` event after `domcontentloaded` timeout
- ErrorModal component for timeout errors
- Loading UX: full-form spinner replaces input during analysis
- Environment variable `GROQ_API_KEY` in `.env` and `.env.example`

### Changed
- Section screenshots now show for all AI recommendations (no score filter)
- AI analysis works out of the box with no API key needed
- `analyzer.ts` selects provider based on `apiKey` parameter
- Landing page redesigned with dashboard mockup, visual step cards, improved copy
- Footer: "Made by Camiicode" with GitHub + LinkedIn links
- BaseLayout includes OG meta tags, Twitter card, and favicon
- Landing page badge updated to "Now with AI-powered analysis"
- All UI text and API messages translated from Spanish to English

### Fixed
- **Infinite hang on extraction**: `el.screenshot()` timeout set to 2s per element (was 30s default, causing 15min+ waits on hidden elements)
- **Server timeout**: Added 120s global timeout to `/api/extract` via `Promise.race`
- AI analysis was previously blocked without a Gemini API key with $10 minimum funding
- Error messages now show user-friendly copy for network failures

### Tests
- 83 unit tests (scoring, llm-client, prompts, analyzer, api extract)
- Added API endpoint tests for `/api/extract`
- Added composite section formula tests for scoring engine

## [0.0.1] - 2026-06-30

### Added
- Initial MVP with Playwright extraction service
- Landing page with URL input form
- Analysis results dashboard with score gauge
- Section scoring cards (hero, CTAs, forms, SEO, accessibility, social proof)
- Render deployment with Node adapter
- Playwright Chromium browser integration
- Toast notification system for errors
- ScoreGauge, SectionCard, Loading components
