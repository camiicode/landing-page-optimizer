# LPO — Landing Page Optimizer

AI-powered landing page analysis platform that extracts, scores, and provides actionable AI recommendations to improve conversion rates.

## Architecture

```
┌─────────────────────┐       ┌──────────────────────────┐
│   GitHub Pages      │       │   Render (Free Tier)      │
│   (Static Frontend) │       │   (Node Server)           │
│                     │  API  │                           │
│  index.html         │──────▶│  /api/extract             │
│  analyze/index.html │       │  /api/analyze (Groq + AI) │
└─────────────────────┘       └──────────────────────────┘
```

- **Frontend**: Static site hosted on GitHub Pages
- **Backend**: Node server with Playwright for page extraction + scoring engine + AI analysis (Groq by default, Gemini optional)

## Stack

| Tool | Version |
|---|---|
| **Astro** | ^7.0.3 |
| **TailwindCSS** | ^4.3.1 |
| **TypeScript** | strict |
| **Playwright** | ^1.61.1 |
| **Node** | >=22.12.0 |
| **Vitest** | ^4.1.9 |
| **Groq (LLaMA 3.1 8B)** | Default AI provider (14,400 req/day) |
| **Gemini 2.0 Flash** | Optional (user API key) |

## Project Structure

```
src/
├── components/
│   ├── common/        # Button, Card, Input, Loading, ErrorModal
│   ├── layout/        # BaseLayout
│   └── analysis/      # ScoreGauge, SectionCard
├── pages/
│   ├── index.astro    # Landing page with URL input
│   ├── analyze.astro  # Results dashboard + AI recommendations
│   └── api/
│       ├── extract.ts   # POST endpoint (scoring + CORS)
│       └── analyze.ts   # POST endpoint (AI analysis)
├── services/
│   ├── extractor.ts     # Playwright page extraction
│   ├── scoring.ts       # Scoring engine (0-100)
│   ├── llm-client.ts    # Groq + Gemini AI clients
│   ├── analyzer.ts      # AI analysis orchestrator
│   ├── prompts.ts       # CRO prompt templates
│   └── __tests__/       # Vitest unit tests
├── types/
│   └── analysis.ts      # AI analysis type definitions
├── styles/
│   └── global.css       # Tailwind global styles
└── layouts/
    └── Layout.astro     # Base HTML layout
```

## Features

- **Page extraction**: Playwright Chromium extracts headings, CTAs, forms, images, links, metadata, and more
- **Scoring engine**: 0-100 score across 6 categories (hero, CTAs, forms, SEO, accessibility, social proof)
- **AI analysis**: Conversion recommendations powered by LLaMA 3.1 8B via Groq (free, 14,400 req/day)
- **Custom API key**: Users can optionally use their own Gemini API key for analysis

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

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key for Groq (default AI provider) |
| `GEMINI_API_KEY` | No | API key for Gemini (user-provided fallback) |

## Testing

```bash
pnpm test
```

Tests cover the scoring engine, AI analysis flow, prompt building, and LLM client (83+ unit tests).

## Deployment

- **Backend**: Auto-deploys to Render from `master` branch
- **Frontend**: Auto-deploys to GitHub Pages via GitHub Actions
