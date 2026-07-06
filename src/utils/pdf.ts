const PDF_TIMEOUT = 30000;

let _html2pdf: any = null;

async function getHtml2pdf() {
  if (!_html2pdf) {
    const mod = await import('html2pdf.js/dist/html2pdf.bundle.min.js');
    _html2pdf = mod.default;
  }
  return _html2pdf;
}

function scoreColor(s: number): string {
  return s >= 70 ? '#16a34a' : s >= 50 ? '#ca8a04' : '#dc2626';
}

function scoreBg(s: number): string {
  return s >= 70 ? '#f0fdf4' : s >= 50 ? '#fefce8' : '#fef2f2';
}

export function buildExportHtml(
  data: any,
  score: any,
  analysis?: any,
  url?: string,
  timestamp?: number,
): string {
  const sections = score?.sections || {};
  const sData = data || {};
  const safeUrl = url || sData.url || '';
  const safeTs = timestamp || sData.timestamp || Date.now();

  const sectionCards = Object.entries(sections)
    .map(
      ([key, val]) =>
        `<div style="background:${scoreBg(val as number)};border-radius:6px;padding:6px 10px;flex:1;min-width:70px;">
          <div style="font-size:9px;color:#999;text-transform:uppercase;">${key}</div>
          <div style="font-size:14px;font-weight:600;color:#333;">${val}</div>
        </div>`,
    )
    .join('');

  const recsHtml =
    analysis?.recommendations?.length
      ? analysis.recommendations
          .map(
            (r: any) =>
              `<div style="background:#fafafa;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid ${r.priority === 'high' ? '#dc2626' : r.priority === 'medium' ? '#ca8a04' : '#2563eb'};">
                <div style="font-size:10px;text-transform:uppercase;color:#666;margin-bottom:2px;">${r.section} &mdash; ${r.priority}</div>
                <div style="font-size:13px;margin-bottom:2px;"><strong>Issue:</strong> ${r.issue}</div>
                <div style="font-size:13px;color:#555;"><strong>Suggestion:</strong> ${r.suggestion}</div>
              </div>`,
          )
          .join('')
      : '';

  return `
    <div style="font-family:Inter, sans-serif; padding: 20px; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin-bottom: 4px;">${sData.title || 'Analysis Report'}</h1>
      <p style="font-size: 12px; color: #666; margin-bottom: 16px;">${safeUrl} &bull; ${new Date(safeTs).toLocaleString()}</p>

      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <div style="background:${scoreBg(score?.overall ?? 0)};border-radius:8px;padding:12px 20px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:${scoreColor(score?.overall ?? 0)};">${score?.overall ?? 0}</div>
          <div style="font-size:10px;color:#666;text-transform:uppercase;">Overall Score</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1;">
          ${sectionCards}
        </div>
      </div>

      ${sData.description ? `<p style="font-size:13px;color:#444;margin-bottom:12px;"><strong>Description:</strong> ${sData.description}</p>` : ''}
      ${sData.title ? `<p style="font-size:13px;color:#444;margin-bottom:12px;"><strong>Title:</strong> ${sData.title}</p>` : ''}
      ${sData.ctas?.length ? `<p style="font-size:13px;color:#444;margin-bottom:12px;"><strong>CTAs:</strong> ${sData.ctas.map((c: any) => c.text).join(', ')}</p>` : ''}
      ${sData.forms?.length ? `<p style="font-size:13px;color:#444;margin-bottom:12px;"><strong>Forms:</strong> ${sData.forms.length} detected</p>` : ''}

      ${recsHtml ? `<hr style="border:none;border-top:1px solid #eee;margin:16px 0;"><h2 style="font-size:16px;margin-bottom:8px;">AI Recommendations</h2><p style="font-size:13px;color:#444;margin-bottom:12px;">${analysis?.summary || ''}</p>${recsHtml}` : ''}
    </div>`;
}

export async function generatePdf(
  html: string,
  filename: string,
): Promise<void> {
  const html2pdf = await getHtml2pdf();
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await Promise.race([
      html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timed out (30s)')), PDF_TIMEOUT),
      ),
    ]);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
