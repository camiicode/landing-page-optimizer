# Changelog

## [Unreleased]

### Added
- Unit testing with Vitest (10 tests for scoring engine)
- ErrorModal component with friendly timeout explanation
- Loading state with spinner animation during page analysis
- Static build config for GitHub Pages deployment (`astro.config.static.mjs`)
- CORS headers on API endpoint to allow cross-origin requests
- Scoring data included in API response

### Changed
- Translated all UI text from Spanish to English
- Frontend now calls Render API directly (`https://lpo-backend.onrender.com/api/extract`)
- Score computed server-side and returned with extraction data
- Removed client-side dynamic import of scoring module
- `page.goto` timeout increased from 15s to 25s with `load` fallback (10s)
- GitHub Actions workflow uses `build:static` instead of server build
- Updated meta description and title to English
- Changed `html lang` from `es` to `en`

### Removed
- "Documentation" link from navigation
- Client-side scoring calculation (moved to API)

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
