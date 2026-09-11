import nodemailer from 'nodemailer';

// Initialize transporter - using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export interface ReminderEmailData {
  recipientEmail: string;
  recipientName: string;
  appointmentTime: string;
  appointmentDate: string;
  hubName: string;
  hoursUntilAppointment: number;
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, appointmentTime, appointmentDate, hubName, hoursUntilAppointment } = data;

    const subject = hoursUntilAppointment === 24
      ? `Reminder: Your appointment tomorrow at ${hubName}`
      : `Reminder: Your appointment today at ${hubName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e40af; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .appointment-details { background-color: white; padding: 15px; border-left: 4px solid #1e40af; margin: 15px 0; }
            .label { font-weight: bold; color: #1e40af; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Reminder</h1>
            </div>

            <div class="content">
              <p>Hi ${recipientName},</p>

              <p>This is a reminder about your upcoming appointment:</p>

              <div class="appointment-details">
                <p><span class="label">Date:</span> ${appointmentDate}</p>
                <p><span class="label">Time:</span> ${appointmentTime}</p>
                <p><span class="label">Location:</span> ${hubName}</p>
              </div>

              <p>Please arrive 5-10 minutes early. If you need to cancel or reschedule, please contact us as soon as possible.</p>

              <p>We look forward to seeing you!</p>

              <p>Best regards,<br>Adult Education at District 79</p>
            </div>

            <div class="footer">
              <p>&copy; 2026 Adult Education District 79. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: `Reminder: You have an appointment on ${appointmentDate} at ${appointmentTime} at ${hubName}`,
    });

    console.log('Email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

export interface BulkEmailData {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
}

export async function sendBulkCommunicationEmail(data: BulkEmailData): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, subject, body } = data;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { padding: 20px; background-color: #f9fafb; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <p>Hi ${recipientName},</p>
              ${body.split('\n').map(line => `<p>${line}</p>`).join('')}
              <p>Best regards,<br>Adult Education at District 79</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Adult Education District 79. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: body,
    });

    console.log('Bulk email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}
