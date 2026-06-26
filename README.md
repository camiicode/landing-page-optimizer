# LPO — Landing Page Optimizer

Plataforma de análisis de landing pages impulsada por IA para optimizar conversiones. Analiza copy, CTAs, accesibilidad, SEO, señales de confianza y UX, y genera recomendaciones accionables.

## Stack

| Herramienta | Versión |
|---|---|
| **Astro** | ^7.0.3 |
| **TailwindCSS** | ^4.3.1 |
| **TypeScript** | strict |
| **Node** | >=22.12.0 |

## Estructura

```
src/
├── components/        # Componentes reutilizables
│   ├── common/        # Button, Card, Input, Loading, Section
│   ├── layout/        # BaseLayout, DashboardLayout
│   ├── input/         # UrlInput, UrlValidation
│   └── analysis/      # AnalysisDashboard, ScoreGauge, etc.
├── layouts/
├── pages/             # Rutas del sitio
│   └── api/           # Endpoints de API
├── services/          # Lógica de negocio (analyzer, extractor, scoring, copy)
├── styles/            # global.css — configuración de Tailwind
├── types/             # Tipos compartidos (analysis, api, extraction)
└── utils/             # Utilidades (constants, formatters, validators)
```

## Comandos

| Comando | Acción |
|---|---|
| `pnpm install` | Instalar dependencias |
| `pnpm dev` | Iniciar servidor local en `localhost:4321` |
| `pnpm build` | Build de producción a `./dist/` |
| `pnpm preview` | Vista previa del build |
| `pnpm astro ...` | CLI de Astro (add, check, etc.) |
