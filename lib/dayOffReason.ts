export const DAY_OFF_CATEGORIES = [
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Staff professional development', label: 'Staff professional development' },
  { value: 'Weather / emergency closure', label: 'Weather / emergency closure' },
  { value: 'Building closed', label: 'Building closed' },
  { value: 'Other', label: 'Other' },
] as const;

export const MAX_DAY_OFF_REASON_LENGTH = 200;

export function buildDayOffReason(category: string, details: string): string {
  const detail = details.trim();
  if (category === 'Other') {
    return (detail || 'Closed').slice(0, MAX_DAY_OFF_REASON_LENGTH);
  }

  const reason = detail ? `${category} — ${detail}` : category;
  return reason.slice(0, MAX_DAY_OFF_REASON_LENGTH);
}

export function normalizeDayOffReason(reason?: string | null): string {
  const trimmed = (reason || '').trim();
  return trimmed.slice(0, MAX_DAY_OFF_REASON_LENGTH) || 'Closed';
}

export function splitDayOffReason(reason?: string): { category: string; details: string } {
  const trimmed = (reason || '').trim();
  if (!trimmed) {
    return { category: DAY_OFF_CATEGORIES[0].value, details: '' };
  }

  const match = DAY_OFF_CATEGORIES.find((category) => (
    category.value !== 'Other' &&
    (trimmed === category.value || trimmed.startsWith(`${category.value} — `))
  ));

  if (!match) {
    return { category: 'Other', details: trimmed };
  }

  const prefix = `${match.value} — `;
  return {
    category: match.value,
    details: trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : '',
  };
}

export function formatClosedDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}
