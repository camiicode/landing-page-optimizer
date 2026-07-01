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
- **Static build**: `astro build --config astro.config.static.mjs`

### Key Behaviors
- `page.goto` uses `domcontentloaded` (25s) with `load` fallback (10s) via `.catch()`
- `networkidle` is best-effort (10s, caught silently)
- CORS: `Access-Control-Allow-Origin: *` on all `/api/extract` responses + OPTIONS handler
- Error on timeout shows an ErrorModal (not a toast) with explanatory text about MVP limitations
- On analyze click: form hides → spinner appears with "Analyzing https://..." → on error form reappears
- Session storage key: `extractionResult` (stores `{ data, score }`)

### Tests
- Framework: Vitest (v4)
- Run: `pnpm test` or `pnpm test:watch`
- Test file: `src/services/__tests__/scoring.test.ts` (10 tests)
- Coverage: scoring engine edge cases (title/description boundaries, heading/CTA/form/image tiers)

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

**Pending for next session:**
- No pending tasks — user may add new features
