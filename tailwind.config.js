// tailwind.config.js
// Configuración extendida de Tailwind para LandingLens AI

/** @type {import('tailwindcss').Config} */
export default {
  // Rutas donde Tailwind buscará clases utilizadas
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],

  theme: {
    extend: {
      // ── Paleta de colores personalizada ──────────────────────────
      colors: {
        brand: {
          bg: "#0a0a0a", // Fondo principal
          surface: "#111111", // Superficies elevadas
          border: "#1a1a1a", // Bordes sutiles
          accent: "#4F46E5", // Indigo primario
          "accent-hover": "#6366F1", // Indigo hover
          muted: "#ffffff26", // Texto atenuado
        },
      },

      // ── Fuente personalizada ──────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Animaciones personalizadas ────────────────────────────────
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      // ── Espaciado adicional ───────────────────────────────────────
      maxWidth: {
        "8xl": "90rem",
      },

      // ── Radio de bordes ───────────────────────────────────────────
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },

      // ── Sombras personalizadas ────────────────────────────────────
      boxShadow: {
        "glow-indigo": "0 0 40px -10px rgba(79, 70, 229, 0.4)",
        "glow-sm": "0 0 20px -5px rgba(79, 70, 229, 0.25)",
      },
    },
  },

  plugins: [],
};
