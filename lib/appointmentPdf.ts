import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { appointmentStatusLabel } from '@/lib/appointmentStatus';

export type AppointmentPdfData = {
  studentName: string;
  email?: string;
  phone?: string;
  dateLabel: string;
  timeLabel: string;
  status?: string;
  hubName?: string;
  hubLocation?: string;
  notes?: string;
  directions?: string;
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

export async function downloadAppointmentPdf(data: AppointmentPdfData) {
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
  doc.text('NYC PUBLIC SCHOOLS  ·  DISTRICT 79', margin, 32);
  doc.setFontSize(15);
  doc.text('Adult Education Appointment', margin, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Bring this confirmation to your intake visit.', margin, 70);

  y = 118;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Student', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.studentName || 'Student', margin, y);
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
  doc.text('Appointment Details', margin + 16, y + 18);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${data.dateLabel}`, margin + 16, y + 35);
  doc.text(`Time: ${data.timeLabel}`, margin + 16, y + 49);
  doc.text(`Status: ${appointmentStatusLabel(data.status)}`, margin + 16, y + 63);
  y += 94;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Learning Center', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const hubLines = doc.splitTextToSize(
    [data.hubName, data.hubLocation].filter(Boolean).join('\n') || 'Learning center assigned at intake',
    contentWidth
  );
  doc.text(hubLines, margin, y);
  y += hubLines.length * 12 + 10;

  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes', margin, y);
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
    doc.text('Public Transit Directions', margin, y);
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
    doc.text('Scan for details', pageWidth - margin - 72, 200, { maxWidth: 72 });
  } catch {
    // QR is optional if generation fails
  }

  if (y > 720) {
    doc.addPage();
    y = 56;
  }
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const reminder = 'Please arrive 5–10 minutes early and bring a photo ID if you have one. If you need to cancel or reschedule, use your student dashboard.';
  doc.text(doc.splitTextToSize(reminder, contentWidth), margin, Math.max(y, 730));

  const safeDate = data.dateLabel.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-');
  doc.save(`appointment-${safeDate || 'confirmation'}.pdf`);
}
