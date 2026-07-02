# Changelog

## [Unreleased]

### Added
- Groq (LLaMA 3.3 70B) as default AI provider — free, no user signup required
- `analyzeWithGroq()` client using OpenAI-compatible fetch API
- Fallback logic: Groq by default, Gemini when user provides custom API key
- 9 new unit tests for Groq integration (83 total)
- Environment variable `GROQ_API_KEY` in `.env` and `.env.example`

### Changed
- AI analysis now works out of the box with no API key needed
- `analyzer.ts` selects provider based on `apiKey` parameter
- Landing page badge updated to "Now with AI-powered analysis"
- README updated with new architecture, env vars, and project structure
- AGENTS.md updated with Groq provider details and session log

### Fixed
- AI analysis was previously blocked without a Gemini API key with $10 minimum funding

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
