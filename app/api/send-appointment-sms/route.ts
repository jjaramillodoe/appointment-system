import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, appointment } = body;
    if (!phone || !appointment) {
      return NextResponse.json({ error: 'Missing phone or appointment info' }, { status: 400 });
    }

    // Generate QR code with appointment info (as JSON string)
    const qrData = JSON.stringify({
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      hub: appointment.selectedHub,
      notes: appointment.notes || '',
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Optionally, upload QR code to a public image host or send as a link (here, just send the data URL)
    // For SMS, we can only send text or a link, not an image directly. So, include the QR code as a link (or instruct user to scan from email, etc.)

    // Compose SMS text
    const smsText = `Your appointment:\nDate: ${appointment.appointmentDate}\nTime: ${appointment.appointmentTime}\nLocation: ${appointment.selectedHub}\nNotes: ${appointment.notes || 'None'}\n\nScan your QR code: (check your email or dashboard)`;

    // Send SMS via Brevo
    const smsPayload = {
      sender: 'EdAppoint',
      recipient: phone,
      content: smsText,
      type: 'transactional',
    };
    const brevoRes = await axios.post(BREVO_SMS_URL, smsPayload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    });

    // Return QR code data URL so frontend can show/download it or email it
    return NextResponse.json({ success: true, qrCodeDataUrl });
  } catch (error: any) {
    if (error.response) {
      // Log Brevo error details
      console.error('Brevo SMS API error:', error.response.data);
      return NextResponse.json({ error: error.response.data, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
} 