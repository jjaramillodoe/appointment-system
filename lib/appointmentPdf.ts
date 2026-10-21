import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { fmt } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';

export type AppointmentPdfData = {
  studentName: string;
  email?: string;
  phone?: string;
  dateLabel: string;
  timeLabel: string;
  /** Already translated status label */
  statusLabel?: string;
  hubName?: string;
  hubLocation?: string;
  notes?: string;
  directions?: string;
  copy: Dictionary['dashboard']['pdf'];
};

function stripMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/\r\n/g, '\n')
    .trim();
}

/** Build the PDF without saving it (usable outside the browser, e.g. in checks). */
export async function buildAppointmentPdf(data: AppointmentPdfData) {
  const { copy } = data;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 48;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 86, 'F');
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 86, pageWidth, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(copy.header, margin, 32);
  doc.setFontSize(15);
  doc.text(copy.title, margin, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(copy.bringThis, margin, 70);

  y = 118;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(copy.student, margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.studentName || copy.student, margin, y);
  y += 13;
  if (data.email) {
    doc.text(data.email, margin, y);
    y += 13;
  }
  if (data.phone) {
    doc.text(data.phone, margin, y);
    y += 18;
  } else {
    y += 6;
  }

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, contentWidth, 76, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text(copy.details, margin + 16, y + 18);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(fmt(copy.date, { value: data.dateLabel }), margin + 16, y + 35);
  doc.text(fmt(copy.time, { value: data.timeLabel }), margin + 16, y + 49);
  doc.text(fmt(copy.status, { value: data.statusLabel || '' }), margin + 16, y + 63);
  y += 94;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(copy.center, margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const hubLines = doc.splitTextToSize(
    [data.hubName, data.hubLocation].filter(Boolean).join('\n') || copy.centerFallback,
    contentWidth
  );
  doc.text(hubLines, margin, y);
  y += hubLines.length * 12 + 10;

  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(copy.notes, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 12 + 10;
  }

  if (data.directions) {
    if (y > 640) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(copy.transit, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const directionLines = doc.splitTextToSize(stripMarkdown(data.directions), contentWidth);
    doc.text(directionLines, margin, y);
    y += directionLines.length * 10 + 12;
  }

  const qrPayload = JSON.stringify({
    name: data.studentName,
    date: data.dateLabel,
    time: data.timeLabel,
    hub: data.hubName,
  });
  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 160, margin: 1 });
    if (y > 680) {
      doc.addPage();
      y = 56;
    }
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 72, 118, 72, 72);
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(copy.scan, pageWidth - margin - 72, 200, { maxWidth: 72 });
  } catch {
    // QR is optional if generation fails
  }

  if (y > 720) {
    doc.addPage();
    y = 56;
  }
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(copy.reminder, contentWidth), margin, Math.max(y, 730));

  // Strip accents so "miércoles" stays readable in the filename
  const safeDate = data.dateLabel
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return { doc, fileName: `${copy.fileName}-${safeDate || 'confirmation'}.pdf` };
}

export async function downloadAppointmentPdf(data: AppointmentPdfData) {
  const { doc, fileName } = await buildAppointmentPdf(data);
  doc.save(fileName);
}
