export const APPOINTMENT_CLOCK_VALUES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM',
] as const;

export function toAppointmentClock(time: string): string {
  const trimmed = (time || '').trim();
  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (twelveHour) {
    return `${Number(twelveHour[1])}:${twelveHour[2]} ${twelveHour[3].toUpperCase()}`;
  }

  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFour) return trimmed;

  const hours = Number(twentyFour[1]);
  const minutes = twentyFour[2];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

export function toTwentyFourHour(time: string): string {
  const trimmed = (time || '').trim();
  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return `${String(Number(twentyFour[1])).padStart(2, '0')}:${twentyFour[2]}`;
  }

  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!twelveHour) return trimmed;

  let hours = Number(twelveHour[1]);
  const meridiem = twelveHour[3].toUpperCase();
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  return `${String(hours).padStart(2, '0')}:${twelveHour[2]}`;
}

export function calendarDateFromValue(value?: Date | string | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
