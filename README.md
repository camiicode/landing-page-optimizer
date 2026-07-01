# LPO — Landing Page Optimizer

AI-powered landing page analysis platform that extracts, scores, and provides actionable recommendations to improve conversion rates.

## Architecture

```
┌─────────────────────┐       ┌──────────────────────┐
│   GitHub Pages      │       │   Render (Free Tier)  │
│   (Static Frontend) │       │   (Node Server)       │
│                     │  API  │                       │
│  index.html         │──────▶│  /api/extract         │
│  analyze/index.html │       │  Playwright Chromium  │
└─────────────────────┘       └──────────────────────┘
```

- **Frontend**: Static site hosted on GitHub Pages
- **Backend**: Node server with Playwright for page extraction + scoring engine

## Stack

| Tool | Version |
|---|---|
| **Astro** | ^7.0.3 |
| **TailwindCSS** | ^4.3.1 |
| **TypeScript** | strict |
| **Playwright** | ^1.61.1 |
| **Node** | >=22.12.0 |
| **Vitest** | ^4.1.9 |

## Project Structure

```
src/
├── components/
│   ├── common/        # Button, Card, Input, Loading, ErrorModal
│   ├── layout/        # BaseLayout
│   └── analysis/      # ScoreGauge, SectionCard
├── pages/
│   ├── index.astro    # Landing page with URL input
│   ├── analyze.astro  # Results dashboard
│   └── api/
│       └── extract.ts # POST endpoint (scoring + CORS)
├── services/
│   ├── extractor.ts   # Playwright page extraction
│   └── scoring.ts     # Scoring engine (0-100)
├── components/
├── styles/
│   └── global.css     # Tailwind global styles
└── services/
    └── __tests__/     # Vitest unit tests
```

## Commands

| Command | Action |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start dev server at `localhost:4321` |
| `pnpm build` | Production build for Render |
| `pnpm build:static` | Static build for GitHub Pages |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm preview` | Preview production build |

## Testing

```bash
pnpm test
```

Tests cover the scoring engine (10 unit tests) including edge cases for title/description length boundaries, heading/CTA/image/form scoring tiers, and overall score calculation.

## Deployment

- **Backend**: Auto-deploys to Render from `master` branch
- **Frontend**: Auto-deploys to GitHub Pages via GitHub Actions
