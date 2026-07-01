import type { ExtractedData } from './extractor';

export interface ScoreResult {
  overall: number;
  sections: {
    hero: number;
    ctas: number;
    forms: number;
    seo: number;
    accessibility: number;
    socialProof: number;
  };
  details: {
    title: { score: number; message: string };
    description: { score: number; message: string };
    headings: { score: number; message: string };
    ctas: { score: number; message: string };
    forms: { score: number; message: string };
    images: { score: number; message: string };
  };
  sectionMessages: Record<string, { score: number; message: string }>;
}

export function calculateScore(data: ExtractedData): ScoreResult {
  const titleScore = data.title.length >= 20 && data.title.length <= 70 ? 100 :
                     data.title.length > 0 ? 50 : 0;
  const titleMessage = data.title.length >= 20 && data.title.length <= 70
    ? 'Longitud optima (20-70 caracteres)'
    : data.title.length > 0
      ? 'Ajusta la longitud del titulo'
      : 'Falta titulo';

  const descScore = data.description.length >= 50 && data.description.length <= 160 ? 100 :
                    data.description.length > 0 ? 50 : 0;
  const descMessage = data.description.length >= 50 && data.description.length <= 160
    ? 'Descripcion optima (50-160 caracteres)'
    : data.description.length > 0
      ? 'Ajusta la longitud de la descripcion'
      : 'Falta meta descripcion';

  const headingScore = data.headings.length >= 2 ? 100 :
                       data.headings.length === 1 ? 50 : 0;
  const headingMessage = data.headings.length >= 2
    ? 'Buen uso de headings'
    : data.headings.length === 1
      ? 'Agrega mas headings (H1, H2, H3)'
      : 'No hay headings';

  const ctaCount = data.ctas.length;
  const ctaScore = ctaCount >= 2 ? 100 :
                   ctaCount === 1 ? 60 : 0;
  const ctaMessage = ctaCount >= 2
    ? 'Multiples CTAs detectados'
    : ctaCount === 1
      ? 'Solo un CTA, considera agregar mas'
      : 'No se detectaron CTAs';

  const formCount = data.forms.length;
  const formScore = formCount >= 1 ? 100 : 0;
  const formMessage = formCount >= 1
    ? 'Formulario detectado'
    : 'No hay formulario de captura';

  const imgCount = data.images.length;
  const imgScore = imgCount >= 3 ? 100 :
                   imgCount >= 1 ? 60 : 0;
  const imgMessage = imgCount >= 3
    ? 'Buen numero de imagenes'
    : imgCount >= 1
      ? 'Agrega mas imagenes visuales'
      : 'No hay imagenes';

  const sections = {
    hero: Math.round((titleScore + headingScore) / 2),
    ctas: ctaScore,
    forms: formScore,
    seo: Math.round((titleScore + descScore) / 2),
    accessibility: Math.round((headingScore + (imgCount > 0 ? 100 : 50)) / 2),
    socialProof: Math.round((imgCount >= 2 ? 80 : 40) + (data.links.length > 5 ? 20 : 0)),
  };

  const overall = Math.round(
    Object.values(sections).reduce((a, b) => a + b, 0) / Object.values(sections).length
  );

  const sectionMessages: Record<string, { score: number; message: string }> = {
    hero: {
      score: sections.hero,
      message: data.title
        ? (sections.hero >= 70 ? 'Buena propuesta de valor' : 'Mejorable, optimiza el titulo')
        : 'Falta titulo principal',
    },
    ctas: {
      score: sections.ctas,
      message: data.ctas.length > 0
        ? (sections.ctas >= 70 ? 'CTAs efectivos y suficientes' : 'Hay CTAs pero se pueden mejorar')
        : 'No se detectaron CTAs',
    },
    forms: {
      score: sections.forms,
      message: data.forms.length > 0
        ? 'Formulario de captura detectado'
        : 'No hay formulario de captura',
    },
    seo: {
      score: sections.seo,
      message: data.title && data.description
        ? (sections.seo >= 70 ? 'Buen SEO on-page' : 'Mejora los metadatos SEO')
        : 'Faltan metadatos SEO (title y description)',
    },
    accessibility: {
      score: sections.accessibility,
      message: data.headings.length > 0
        ? (sections.accessibility >= 70 ? 'Buena estructura de accesibilidad' : 'Estructura de headings mejorable')
        : 'Falta estructura de headings',
    },
    socialProof: {
      score: sections.socialProof,
      message: data.images.length >= 2 || data.links.length > 5
        ? 'Senales de confianza detectadas'
        : 'Agrega mas pruebas sociales (imagenes, testimonios)',
    },
  };

  return {
    overall,
    sections,
    details: {
      title: { score: titleScore, message: titleMessage },
      description: { score: descScore, message: descMessage },
      headings: { score: headingScore, message: headingMessage },
      ctas: { score: ctaScore, message: ctaMessage },
      forms: { score: formScore, message: formMessage },
      images: { score: imgScore, message: imgMessage },
    },
    sectionMessages,
  };
}
