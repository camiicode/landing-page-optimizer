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
- **AI Analysis**: Gemini 2.0 Flash via `src/services/llm-client.ts` → `analyzer.ts` → `POST /api/analyze` returns `{ success, analysis }`
- **Custom API Key**: Users can paste their own Gemini API key in the AI card when quota is exhausted; key is stored in `sessionStorage` and sent as `apiKey` field in `POST /api/analyze` body
- **Two-phase frontend**: Score renders immediately from sessionStorage → AI analysis fetched in background and revealed with fade-in animation
- **Static build**: `astro build --config astro.config.static.mjs`
- **Env vars**: `GEMINI_API_KEY` loaded from `.env` via `process.env` (server-only)

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
- `llm-client.ts` accepts optional `apiKey` parameter; if provided, creates a fresh `GoogleGenerativeAI` instance, otherwise reuses the module-level instance from env

### Service Dependencies
- `llm-client.ts` → `@google/generative-ai`
- `prompts.ts` → `extractor.ts` (types only)
- `analyzer.ts` → `llm-client.ts`, `prompts.ts`
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

**Pending for next session:**
- No pending tasks — user may add new features
