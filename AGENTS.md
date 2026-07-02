## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project Context

### Architecture
- **Frontend**: Static site on GitHub Pages (`base: '/landing-page-optimizer/'`)
- **Backend**: Astro server on Render (`output: 'server'` with `@astrojs/node`)
- **API base URL**: `https://lpo-backend.onrender.com`
- **Extraction**: Playwright Chromium (headless) via `src/services/extractor.ts`
- **Scoring**: Server-side via `src/services/scoring.ts`, returned in API response as `{ success, data, score }`
- **AI Analysis**: Groq (LLaMA 3.1 8B, 14,400 req/day) by default via `src/services/llm-client.ts` → `analyzer.ts` → `POST /api/analyze` returns `{ success, analysis, error? }`. Falls back to Gemini 2.0 Flash when user provides a custom API key.
- **Custom API Key**: Users can paste their own Gemini API key in the AI card; key is stored in `sessionStorage` and sent as `apiKey` field in `POST /api/analyze` body. When no `apiKey` is provided, Groq is used automatically.
- **Two-phase frontend**: Score renders immediately from sessionStorage → AI analysis fetched in background and revealed with fade-in animation
- **Static build**: `astro build --config astro.config.static.mjs`
- **Env vars**: `GROQ_API_KEY` (required) and `GEMINI_API_KEY` (optional) loaded from `.env` via `process.env` (server-only)

### Key Behaviors
- `page.goto` uses `domcontentloaded` (25s) with `load` fallback (10s) via `.catch()`
- `networkidle` is best-effort (10s, caught silently)
- CORS: `Access-Control-Allow-Origin: *` on all `/api/*` responses + OPTIONS handler
- Error on timeout shows an ErrorModal (not a toast) with explanatory text about MVP limitations
- On analyze click: form hides → spinner appears with "Analyzing https://..." → on error form reappears
- Session storage keys: `extractionResult` (stores `{ data, score, analysis? }`), `geminiApiKey` (user-provided API key)
- AI analysis runs in background after score renders; uses Tailwind `opacity-0 translate-y-4` → `requestAnimationFrame` removal for fade-in
- If default API quota exhausted, a card with input field lets users paste their own Gemini API key
- If custom key also fails, a "key failed" card with retry input is shown
- All AI service files gracefully handle missing API key (return `null`)
- `llm-client.ts` has two providers: `analyzeWithGroq()` (default, via fetch) and `analyzeWithGemini()` (user API key, via `@google/generative-ai`)
- `analyzer.ts` decides provider based on `apiKey` param: Groq when no key, Gemini when key provided

### Service Dependencies
- `llm-client.ts` → `@google/generative-ai` (Gemini only), `fetch` (Groq)
- `prompts.ts` → `extractor.ts` (types only)
- `analyzer.ts` → `llm-client.ts` (Groq + Gemini), `prompts.ts`
- `api/analyze.ts` → `analyzer.ts`, `extractor.ts`
- `analyze.astro` → `api/analyze` (sends `{ url, data, apiKey? }`)

### Tests
- Framework: Vitest (v4)
- Run: `pnpm test` or `pnpm test:watch`
- Test files:
  - `src/services/__tests__/scoring.test.ts` — scoring engine edge cases
  - `src/services/__tests__/llm-client.test.ts` — Gemini client mock (API key missing, success, prompt structure, error propagation)
  - `src/services/__tests__/prompts.test.ts` — prompt building (headings, CTAs, forms, images, meta, edge cases)
  - `src/services/__tests__/analyzer.test.ts` — full AI analysis flow (JSON parsing, markdown stripping, validation, error handling)

### Deployments
- Render auto-deploys from `master` branch
- GitHub Pages auto-deploys via `.github/workflows/deploy.yml` (runs `build:static`)

## Session Log

### Session 2026-07-01 (Current State)

**What was done:**
1. Added scoring + CORS to `/api/extract` endpoint (returns `{ data, score }` with CORS headers)
2. Connected frontend to Render API (fetch now uses `https://lpo-backend.onrender.com/api/extract`)
3. Removed client-side dynamic import of `scoring.ts` — score comes from API response
4. Created `astro.config.static.mjs` for GitHub Pages static build
5. Added `build:static` script to package.json
6. Updated GitHub Actions workflow to use `build:static` instead of `build`
7. Changed `page.goto` timeout from 15s to 25s with `load` fallback
8. Created ErrorModal component for timeout errors
9. Translated all UI text and API messages from Spanish to English (~99 strings)
10. Removed "Documentation" nav link
11. Improved loading UX: full-form spinner replaces input during analysis
12. Added Vitest with 10 unit tests for scoring engine
13. Updated README (English, new architecture) and created CHANGELOG

### Session 2026-07-01 (Afternoon — Gemini Integration)

**What was done:**
1. Installed `@google/generative-ai` v0.24.1
2. Created `src/types/analysis.ts` — `AIAnalysis`, `AIRecommendation` interfaces
3. Created `src/services/llm-client.ts` — Gemini 2.0 Flash wrapper with API key validation
4. Created `src/services/prompts.ts` — CRO system prompt + `buildAnalysisPrompt(data)` builder
5. Implemented `src/services/analyzer.ts` — `analyzeWithAI(data)` with markdown stripping, JSON validation, error fallback to `null`
6. Created `POST /api/analyze` endpoint — accepts `{ url, data }`, returns `{ success, analysis }`
7. Updated `analyze.astro` — two-phase rendering: score dashboard loads instantly from sessionStorage, then `POST /api/analyze` fires in background with Tailwind fade-in animation
8. Added 4 test files (scoring, llm-client, prompts, analyzer) with 74 total tests passing
9. Updated AGENTS.md with new architecture docs

### Session 2026-07-02 — Groq Integration

**What was done:**
1. Added `analyzeWithGroq()` to `llm-client.ts` — uses Groq API (LLaMA 3.3 70B) via OpenAI-compatible `fetch`
2. Changed `analyzer.ts` to use Groq by default, Gemini only when user provides `apiKey`
3. Updated `api/analyze.ts` logging to reflect both providers
4. Updated `.env.example` with `GROQ_API_KEY` as primary var
5. Added 9 new tests (83 total): Groq client tests (5) + Groq analyzer tests (4)
6. Changed `index.astro` badge from "GPT-4, Claude & Gemini" to "AI-powered analysis"
7. Updated README, AGENTS.md, and CHANGELOG

**Provider logic:**
- No `apiKey` → `analyzeWithGroq()` (free, Llama 3.1 8B via Groq, 14,400 req/day)
- With `apiKey` → `analyzeWithGemini()` (user's own Gemini key)
- Both return null gracefully → frontend shows API key card with specific error message

### Session 2026-07-02 (Evening — MVP Release 0.1.0)

**What was done:**
1. **Section screenshots**: Added Playwright element-level screenshots for hero, CTAs, and forms during extraction; stored as `data.sectionScreenshots`
2. **AI card display**: Screenshots now appear in recommendation cards for hero/CTA/form sections when AI analyzes them
3. **Timeout bug**: Added `timeout: 2000` to all `el.screenshot()` calls — prevented 15min+ hangs on pages with many hidden CTA/form elements (Playwright's default 30s actionability check per element was the root cause)
4. **Server timeout**: Added 120s global timeout to `/api/extract` via `Promise.race` so requests never hang indefinitely
5. **Extraction logging**: Added `[extractor]` timing logs at each stage for debugging
6. **Diagnostic errors**: When AI analysis fails, API now returns an `error` field specifying whether `GROQ_API_KEY` is missing or if it's a Groq API error (rate limit); frontend displays the specific message
7. **Model switch**: Changed default from `llama-3.3-70b-versatile` (1,000 req/day) to `llama-3.1-8b-instant` (14,400 req/day) after hitting rate limits during testing
8. **Doc updates**: Updated README, CHANGELOG v0.1.0, AGENTS.md; bumped package.json

**Key files changed:**
- `src/types/extraction.ts` — `SectionScreenshots` interface
- `src/services/extractor.ts` — Element screenshots, logging, timeouts, CTA_SELECTORS refactor
- `src/pages/api/extract.ts` — 120s timeout guard
- `src/pages/api/analyze.ts` — Error message when analysis fails
- `src/pages/analyze.astro` — Screenshots in AI cards, diagnostic error display
- `src/services/llm-client.ts` — Model switch to 8B instant
