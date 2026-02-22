/**
 * Renders the Daily Report JSON as a 3-page PDF (spec: daily-report-system-prompt.md).
 */
import { jsPDF } from 'jspdf';
import type { DailyReportJson } from './reportTypes';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const LINE_HEIGHT = 5;

/* Aligned with PulseScore design: #00ff88, #f59e0b, #ef4444 */
const COLORS = {
  green: [0, 255, 136] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  blue: [59, 130, 246] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

function scoreColor(score: number): [number, number, number] {
  if (score >= 70) return COLORS.green;
  if (score >= 40) return COLORS.amber;
  return COLORS.red;
}

function drawCircle(
  doc: jsPDF,
  x: number,
  y: number,
  r: number,
  score: number,
  label: string,
  sublabel: string
): void {
  const [r0, g, b] = scoreColor(score);
  doc.setFillColor(r0, g, b);
  doc.circle(x, y, r, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(String(score), x, y + 1.5, { align: 'center' });
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(8);
  doc.text(label, x, y + r + 4, { align: 'center' });
  doc.setFontSize(6);
  const words = sublabel.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (line && doc.getTextWidth(line + ' ' + w) > r * 2.8) {
      lines.push(line);
      line = w;
    } else line = line ? line + ' ' + w : w;
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => doc.text(l, x, y + r + 8 + i * 3.5, { align: 'center' }));
}

function wrapText(doc: jsPDF, text: string, _x: number, maxW: number): string[] {
  const lines: string[] = [];
  const parts = text.split(/\s+/);
  let line = '';
  for (const p of parts) {
    const next = line ? line + ' ' + p : p;
    if (doc.getTextWidth(next) <= maxW) line = next;
    else {
      if (line) lines.push(line);
      line = p;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function renderPage1(doc: jsPDF, report: DailyReportJson): void {
  const dateLabel = report.report_date
    ? new Date(report.report_date + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : report.report_date;
  const title =
    report.report_type === 'partial'
      ? `PulseFlow Partial Report — ${dateLabel}`
      : `PulseFlow Daily Report — ${dateLabel}`;

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.black);
  doc.text(title, PAGE_W / 2, MARGIN + 8, { align: 'center' });

  const blockOrder: ('body' | 'work' | 'nutrition')[] = ['body', 'work', 'nutrition'];
  const names: Record<string, string> = { body: 'Body', work: 'Work', nutrition: 'Nutrition' };
  const smallR = 16;
  const cx1 = 45;
  const cx2 = PAGE_W / 2;
  const cx3 = PAGE_W - 45;
  const circleY = 52;

  blockOrder.forEach((key, i) => {
    const cx = i === 0 ? cx1 : i === 1 ? cx2 : cx3;
    const bs = report.pulse_summary.block_scores[key];
    if (!bs) return;
    drawCircle(doc, cx, circleY, smallR, bs.score, names[key] ?? key, bs.label || '');
  });

  const combinedY = 95;
  const bigR = 22;
  const overall = report.pulse_summary.overall_score ?? 0;
  const reportDateStr = report.report_date ?? '';
  drawCircle(doc, PAGE_W / 2, combinedY, bigR, overall, 'Your Pulse', reportDateStr);

  doc.setTextColor(...COLORS.black);
  doc.setFontSize(8);
  const framingLines = wrapText(
    doc,
    report.pulse_summary.score_framing || '',
    MARGIN,
    PAGE_W - 2 * MARGIN
  );
  framingLines.slice(0, 3).forEach((l, i) => doc.text(l, PAGE_W / 2, combinedY + bigR + 14 + i * 4, { align: 'center' }));

  let y = combinedY + bigR + 28;
  doc.setFontSize(10);
  doc.text('What connected today', MARGIN, y);
  y += LINE_HEIGHT + 2;
  doc.setFontSize(9);
  const connectedLines = wrapText(doc, report.synthesis?.what_connected_today ?? '', MARGIN, PAGE_W - 2 * MARGIN);
  connectedLines.forEach((l) => {
    doc.text(l, MARGIN, y);
    y += 4;
  });
  y += 4;

  const chain = report.synthesis?.chain ?? '';
  if (chain) {
    const pills = chain.split(/\s*→\s*/).map((s) => s.trim()).filter(Boolean);
    doc.setFontSize(8);
    let pillX = MARGIN;
    const pillY = y + 4;
    const pillH = 6;
    for (let i = 0; i < pills.length; i++) {
      const w = Math.min(doc.getTextWidth(pills[i] ?? '') + 8, 50);
      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(pillX, pillY - pillH / 2, w, pillH, 1, 1, 'F');
      doc.setTextColor(...COLORS.black);
      doc.text((pills[i] ?? '').slice(0, 20), pillX + 4, pillY + 1);
      pillX += w + 4;
      if (i < pills.length - 1) {
        doc.setFontSize(6);
        doc.text('→', pillX, pillY + 1);
        pillX += 6;
        doc.setFontSize(8);
      }
    }
  }
}

function signalsTable(doc: jsPDF, signals: Record<string, unknown>, startY: number): number {
  const col2 = 120;
  let y = startY;
  doc.setFontSize(8);
  doc.setDrawColor(200, 200, 200);
  Object.entries(signals).forEach(([k, v], i) => {
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const val = v == null ? '—' : String(v);
    doc.text(label, MARGIN, y + 4);
    doc.text(val, col2, y + 4);
    if (i > 0) doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2);
    y += 6;
  });
  return y + 4;
}

function renderPage2(doc: jsPDF, report: DailyReportJson): void {
  doc.addPage();
  const blocks: ('body' | 'work' | 'nutrition')[] = ['body', 'work', 'nutrition'];
  const names: Record<string, string> = { body: 'Body Signals', work: 'Work Routine', nutrition: 'Nutrition' };
  let y = MARGIN + 6;

  for (const key of blocks) {
    if (!report.blocks_logged.includes(key)) continue;
    const detail = report.block_details[key];
    const bs = report.pulse_summary.block_scores[key];
    const score = bs?.score ?? 0;

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.black);
    doc.text(`${names[key]} — Score ${score}`, MARGIN, y);
    y += 8;

    if (detail?.todays_pattern) {
      doc.setFontSize(9);
      const patternLines = wrapText(doc, detail.todays_pattern, MARGIN, PAGE_W - 2 * MARGIN);
      patternLines.forEach((l) => {
        doc.text(l, MARGIN, y);
        y += 4;
      });
      y += 4;
    }

    if (detail?.raw_signals && Object.keys(detail.raw_signals).length > 0) {
      doc.setFontSize(8);
      doc.text('Signals', MARGIN, y);
      y += 5;
      y = signalsTable(doc, detail.raw_signals, y);
      y += 4;
    }

    if (detail?.drivers?.length) {
      doc.setFontSize(8);
      doc.text('Key drivers', MARGIN, y);
      y += 5;
      detail.drivers.forEach((d) => {
        const lines = wrapText(doc, '• ' + d, MARGIN + 4, PAGE_W - 2 * MARGIN - 4);
        lines.forEach((l) => {
          doc.text(l, MARGIN, y);
          y += 4;
        });
      });
      y += 4;
    }

    if (detail?.user_note?.trim()) {
      doc.setFillColor(...COLORS.lightGray);
      const noteLines = wrapText(doc, detail.user_note.trim(), MARGIN, PAGE_W - 2 * MARGIN - 8);
      const boxH = Math.min(noteLines.length * 4 + 6, 40);
      doc.roundedRect(MARGIN, y, PAGE_W - 2 * MARGIN, boxH, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.black);
      doc.text('Your note:', MARGIN + 4, y + 5);
      noteLines.forEach((l, i) => doc.text(l, MARGIN + 4, y + 10 + i * 4));
      y += boxH + 8;
    }

    y += 10;
    if (y > PAGE_H - 40) {
      doc.addPage();
      y = MARGIN + 6;
    }
  }
}

function renderPage3(doc: jsPDF, report: DailyReportJson): void {
  doc.addPage();
  let y = MARGIN + 6;

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.black);
  doc.text('Recommendations', MARGIN, y);
  y += 10;

  const recs = (report.recommendations ?? []).slice(0, 2);
  recs.forEach((rec) => {
    const cardH = 36;
    if (y + cardH > PAGE_H - 55) {
      doc.addPage();
      y = MARGIN + 6;
    }
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(MARGIN, y, PAGE_W - 2 * MARGIN, cardH, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(rec.action, MARGIN + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Observe: ' + rec.observe, MARGIN + 4, y + 14);
    doc.text('Why: ' + rec.why, MARGIN + 4, y + 21);
    const tags = (rec.blocks_referenced || []).join(', ');
    if (tags) doc.text('Blocks: ' + tags, MARGIN + 4, y + 28);
    y += cardH + 6;
  });

  y += 6;
  doc.setFontSize(10);
  doc.text("Tomorrow's signal to watch", MARGIN, y);
  y += 8;
  doc.setFillColor(...COLORS.lightGray);
  const tomorrowLines = wrapText(doc, report.tomorrow_signal ?? '', MARGIN, PAGE_W - 2 * MARGIN - 8);
  const boxH = Math.min(tomorrowLines.length * 4 + 8, 30);
  doc.roundedRect(MARGIN, y, PAGE_W - 2 * MARGIN, boxH, 2, 2, 'F');
  doc.setFontSize(9);
  tomorrowLines.forEach((l, i) => doc.text(l, MARGIN + 4, y + 6 + i * 4));
  y += boxH + 14;

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  const footerLines = wrapText(doc, report.footer_note ?? '', MARGIN, PAGE_W - 2 * MARGIN);
  footerLines.forEach((l) => {
    doc.text(l, MARGIN, y);
    y += 3.5;
  });
  y += 4;
  const genDate = report.report_date
    ? new Date(report.report_date + 'T12:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '—';
  doc.text(`Generated ${genDate}`, MARGIN, y);
  doc.setFontSize(9);
  doc.text('PulseFlow', PAGE_W - MARGIN, y, { align: 'right' });
}

export function buildReportPdf(report: DailyReportJson): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  renderPage1(doc, report);
  renderPage2(doc, report);
  renderPage3(doc, report);
  return doc;
}

export function reportPdfToBlob(report: DailyReportJson): Blob {
  const doc = buildReportPdf(report);
  return doc.output('blob');
}

export function reportPdfToDataUrl(report: DailyReportJson): string {
  const doc = buildReportPdf(report);
  return doc.output('dataurlstring');
}
