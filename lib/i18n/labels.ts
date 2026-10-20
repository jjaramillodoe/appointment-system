import { enUS, es as esLocale } from 'date-fns/locale';
import type { Locale } from './config';
import type { Dictionary } from './dictionaries/en';

/** Appointment status → label in the active language (unknown statuses fall back to the raw value). */
export function statusLabel(t: Dictionary, status?: string | null): string {
  const labels: Record<string, string> = t.dashboard.statuses;
  const key = (status || '').toLowerCase();
  return labels[key] ?? (status ? status.replace(/_/g, ' ') : labels.unknown);
}

/** Stored option value (kept in English in the database) → label in the active language. */
export function optionLabel(labels: Record<string, string>, value?: string | null): string {
  if (!value) return '';
  return labels[value] ?? value;
}

export function dateFnsLocale(locale: Locale) {
  return locale === 'es' ? esLocale : enUS;
}
