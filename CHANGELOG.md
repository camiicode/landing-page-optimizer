# Changelog

## [0.2.0] - 2026-07-06 — QOL Release

### Added
- **Persistent history**: Analysis history stored in localStorage with 20-entry FIFO eviction
- **History sidebar**: Drawer with entry list, scores, relative timestamps, delete & export per entry
- **Progress modal**: Animated bar with glow/pulse, 7 simulated stages, cancel button (AbortController), checkmark animation + 3s delay before redirect
- **PDF export**: Individual report download from `/analyze` page + bulk "Export all" from sidebar
- **32 new PDF tests**: 126 total passing (128 including 2 todo)

### Changed
- PDF generation uses built HTML (not live DOM capture) to avoid html2canvas hangs
- `optimizeDeps.include` in Vite config for reliable html2pdf bundle loading
- Progress modal replaces old spinner for extraction UX
- Sidebar "Export all" button has spinner state during generation

### Fixed
- PDF "Download PDF" button no longer hangs silently — uses 30s timeout + inline error messages
- History sidebar "Export all" no longer hangs — uses 30s timeout + alert on failure
- Deep import `html2pdf.js/dist/html2pdf.bundle.min.js` resolved via `optimizeDeps.include`
- Error feedback visible to user on all PDF export failures

### Tests
- 126 passing + 2 todo (128 total across 7 test files)
- New `src/utils/__tests__/pdf.test.ts`: 30 tests for `buildExportHtml` (24) and `generatePdf` (6)

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
