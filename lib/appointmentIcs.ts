import { DateTime } from 'luxon';
import { toAppointmentClock } from './appointmentTime';
import {
  combineSlotDateTime,
  DEFAULT_HUB_TIMEZONE,
  SLOT_DURATION_MINUTES,
  slotCalendarDate,
} from './slotDateTime';

export type AppointmentIcsInput = {
  date: Date | string;
  time: string;
  hubName?: string;
  hubLocation?: string;
};

function icsEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsUtc(dt: DateTime) {
  return dt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

export function buildAppointmentIcs(input: AppointmentIcsInput): string {
  const start = combineSlotDateTime(input.date, toAppointmentClock(input.time), DEFAULT_HUB_TIMEZONE);
  const validStart = start.isValid
    ? start
    : DateTime.fromISO(slotCalendarDate(input.date), { zone: DEFAULT_HUB_TIMEZONE });
  const end = validStart.plus({ minutes: SLOT_DURATION_MINUTES });
  const uid = `${slotCalendarDate(input.date)}-${toAppointmentClock(input.time).replace(/\s/g, '')}@district79.edu`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//District 79 Adult Education//Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsUtc(DateTime.utc())}`,
    `DTSTART:${icsUtc(validStart)}`,
    `DTEND:${icsUtc(end)}`,
    `SUMMARY:${icsEscape('Cita de admisión / Adult Education Intake')}`,
    input.hubName
      ? `LOCATION:${icsEscape([input.hubName, input.hubLocation].filter(Boolean).join(', '))}`
      : '',
    `DESCRIPTION:${icsEscape('Llegue 5-10 minutos antes. Use su panel para cancelar o cambiar la cita. / Please arrive 5-10 minutes early. Use your dashboard to cancel or reschedule.')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function appointmentIcsAttachment(input: AppointmentIcsInput) {
  return {
    filename: 'appointment.ics',
    content: buildAppointmentIcs(input),
    contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
  };
}

export function downloadAppointmentIcs(input: AppointmentIcsInput) {
  const blob = new Blob([buildAppointmentIcs(input)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'appointment.ics';
  link.click();
  URL.revokeObjectURL(url);
}
