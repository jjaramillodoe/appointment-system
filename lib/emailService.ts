import { logger } from '@/lib/logger';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { appointmentIcsAttachment } from './appointmentIcs';

let transporter: Transporter | null = null;

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
  });

  return transporter;
}

async function sendMail(options: Parameters<Transporter['sendMail']>[0]) {
  const mailer = getTransporter();
  if (!mailer) {
    logger.info('Email skipped: SMTP_HOST is not configured');
    return null;
  }
  return mailer.sendMail(options);
}

export interface ReminderEmailData {
  recipientEmail: string;
  recipientName: string;
  appointmentTime: string;
  appointmentDate: string;
  hubName: string;
  hoursUntilAppointment: number;
  calendarDate?: string;
  /** Calendar relation in the hub timezone; drives the subject line */
  when?: 'today' | 'tomorrow' | 'upcoming';
  dashboardUrl?: string;
}

const REMINDER_SUBJECTS = {
  today: (hub: string) => `Recordatorio: su cita hoy en ${hub} / Reminder: appointment today`,
  tomorrow: (hub: string) => `Recordatorio: su cita mañana en ${hub} / Reminder: appointment tomorrow`,
  upcoming: (hub: string) => `Recordatorio: su próxima cita en ${hub} / Reminder: upcoming appointment`,
};

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, appointmentTime, appointmentDate, hubName, hoursUntilAppointment } = data;

    const when = data.when ?? (hoursUntilAppointment >= 24 ? 'tomorrow' : 'today');
    const subject = REMINDER_SUBJECTS[when](hubName);
    const dashboardButton = data.dashboardUrl
      ? `<p><a class="button" href="${data.dashboardUrl}">Ver, cambiar o cancelar / View, reschedule or cancel</a></p>`
      : '';

    const htmlContent = appointmentEmailShell(
      'Recordatorio de cita / Appointment reminder',
      `
        <p>Hola ${recipientName},</p>
        <p>Le recordamos su cita de admisión:</p>
        <div class="appointment-details">
          <p><span class="label">Fecha / Date:</span> ${appointmentDate}</p>
          <p><span class="label">Hora / Time:</span> ${appointmentTime}</p>
          <p><span class="label">Lugar / Location:</span> ${hubName}</p>
        </div>
        <p>Llegue 5-10 minutos antes. Si el centro está cerrado, revise su panel para ver el motivo y elija otro día.</p>
        ${dashboardButton}
        <hr>
        <p>Hi ${recipientName},</p>
        <p>This is a reminder about your upcoming appointment. Please arrive 5-10 minutes early. If the site is unexpectedly closed, check your dashboard for the posted reason and pick another day.</p>
      `
    );

    const result = await sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: `Recordatorio / Reminder: ${appointmentDate} ${appointmentTime} at ${hubName}`,
      attachments: calendarAttachment({
        calendarDate: data.calendarDate,
        appointmentTime,
        hubName,
      }),
    });

    if (!result) return false;
    logger.debug('Email sent:', result.messageId);
    return true;
  } catch (error) {
    logger.error('Error sending reminder email:', error);
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

    const result = await sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: body,
    });

    if (!result) return false;
    logger.debug('Bulk email sent:', result.messageId);
    return true;
  } catch (error) {
    logger.error('Error sending bulk email:', error);
    return false;
  }
}

export interface AppointmentNoticeData {
  recipientEmail: string;
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  hubName?: string;
  hubLocation?: string;
  profileUrl: string;
  calendarDate?: string;
  preferredLanguage?: string;
}

function calendarAttachment(data: Pick<AppointmentNoticeData, 'calendarDate' | 'appointmentTime' | 'hubName' | 'hubLocation'>) {
  if (!data.calendarDate || !data.appointmentTime) return undefined;
  return [appointmentIcsAttachment({
    date: data.calendarDate,
    time: data.appointmentTime,
    hubName: data.hubName,
    hubLocation: data.hubLocation,
  })];
}

function appointmentEmailShell(title: string, innerHtml: string) {
  return `
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
          .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${title}</h1></div>
          <div class="content">${innerHtml}</div>
          <div class="footer"><p>&copy; 2026 Adult Education District 79. All rights reserved.</p></div>
        </div>
      </body>
    </html>
  `;
}

export async function sendIntakeRequiredEmail(data: AppointmentNoticeData): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, appointmentDate, appointmentTime, hubName, profileUrl } = data;
    const htmlContent = appointmentEmailShell(
      'Complete su registro / Intake required',
      `
        <p>Hola ${recipientName},</p>
        <p>Su cita está reservada, pero no queda confirmada hasta que complete su perfil de estudiante.</p>
        <div class="appointment-details">
          <p><span class="label">Fecha / Date:</span> ${appointmentDate}</p>
          <p><span class="label">Hora / Time:</span> ${appointmentTime}</p>
          ${hubName ? `<p><span class="label">Lugar / Location:</span> ${hubName}</p>` : ''}
        </div>
        <p><a class="button" href="${profileUrl}">Completar registro / Complete registration</a></p>
        <hr>
        <p>Hi ${recipientName},</p>
        <p>Your appointment slot is reserved, but your registration is not confirmed until you complete your student profile.</p>
      `
    );

    const result = await sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: recipientEmail,
      subject: 'Complete su registro / Intake required',
      html: htmlContent,
      text: `Su cita el ${appointmentDate} a las ${appointmentTime} está reservada. Complete su perfil: ${profileUrl}`,
      attachments: calendarAttachment(data),
    });

    if (!result) return false;
    logger.debug('Intake required email sent:', result.messageId);
    return true;
  } catch (error) {
    logger.warn('Intake required email was not sent. Appointment status was still saved.');
    return false;
  }
}

export async function sendAppointmentConfirmationEmail(data: AppointmentNoticeData): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, appointmentDate, appointmentTime, hubName } = data;
    const htmlContent = appointmentEmailShell(
      'Cita confirmada / Appointment confirmed',
      `
        <p>Hola ${recipientName},</p>
        <p>Su cita de admisión de educación para adultos está confirmada. Adjunto encontrará un archivo de calendario.</p>
        <div class="appointment-details">
          <p><span class="label">Fecha / Date:</span> ${appointmentDate}</p>
          <p><span class="label">Hora / Time:</span> ${appointmentTime}</p>
          ${hubName ? `<p><span class="label">Lugar / Location:</span> ${hubName}</p>` : ''}
        </div>
        <p>Llegue 5-10 minutos antes. Si necesita cancelar o cambiar la cita, use su panel de estudiante.</p>
        <hr>
        <p>Hi ${recipientName},</p>
        <p>Your adult education intake appointment is confirmed. A calendar file is attached.</p>
      `
    );

    const result = await sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: recipientEmail,
      subject: `Cita confirmada${hubName ? ` en ${hubName}` : ''} / Appointment confirmed`,
      html: htmlContent,
      text: `Cita confirmada / Appointment confirmed: ${appointmentDate} ${appointmentTime}${hubName ? ` at ${hubName}` : ''}`,
      attachments: calendarAttachment(data),
    });

    if (!result) return false;
    logger.debug('Appointment confirmation email sent:', result.messageId);
    return true;
  } catch (error) {
    logger.warn('Appointment confirmation email was not sent. Appointment status was still saved.');
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<boolean> {
  try {
    const result = await sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: email,
      subject: 'Restablecer contraseña / Reset your Adult Education password',
      html: appointmentEmailShell(
        'Restablecer contraseña / Reset password',
        `<p>Hola ${name},</p><p>Use este enlace para elegir una contraseña nueva. Vence en una hora.</p><p><a class="button" href="${resetUrl}">Restablecer contraseña / Reset password</a></p><hr><p>Hi ${name},</p><p>Use this link to choose a new password. It expires in one hour.</p>`
      ),
      text: `Restablecer contraseña / Reset your password: ${resetUrl}`,
    });
    return Boolean(result);
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    return false;
  }
}

export async function sendWaitlistAvailableEmail(data: AppointmentNoticeData): Promise<boolean> {
  try {
    const seatWhen = data.appointmentDate && data.appointmentTime ? ` (${data.appointmentDate}, ${data.appointmentTime})` : '';
    const result = await sendMail({
      from: process.env.SMTP_FROM || 'noreply@district79.edu',
      to: data.recipientEmail,
      subject: `Se abrió un cupo / A seat opened at ${data.hubName || 'your learning center'}`,
      html: appointmentEmailShell(
        'Hay un cupo / A seat is available',
        `<p>Hola ${data.recipientName},</p><p>Se abrió un cupo en ${data.hubName || 'su centro'}${seatWhen}. Resérvelo desde su panel antes de que se llene.</p><p><a class="button" href="${data.profileUrl.replace('/profile', '/dashboard')}">Abrir panel / Open dashboard</a></p><hr><p>Hi ${data.recipientName},</p><p>A seat opened at ${data.hubName || 'your learning center'}${seatWhen}. Book it from your dashboard before it fills again.</p>`
      ),
      text: `Se abrió un cupo / A seat opened at ${data.hubName || 'your learning center'}.`,
    });
    return Boolean(result);
  } catch (error) {
    logger.error('Error sending waitlist email:', error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      logger.info('Email skipped: SMTP_HOST is not configured');
      return false;
    }
    await mailer.verify();
    logger.debug('Email service is ready');
    return true;
  } catch (error) {
    logger.warn('Email service is unavailable');
    return false;
  }
}
