import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '@/lib/i18n/dictionaries/en';
import es from '@/lib/i18n/dictionaries/es';
import { fmt, localeFromAcceptLanguage } from '@/lib/i18n/config';

function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => shape(item, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => shape(child, path ? `${path}.${key}` : key));
  }
  return [path];
}

test('Spanish has exactly the English keys (including list lengths)', () => {
  assert.deepEqual(shape(es).sort(), shape(en).sort());
});

test('Spanish strings keep every {placeholder}', () => {
  const placeholders = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  const walk = (a: any, b: any, path: string) => {
    if (typeof a === 'string') return assert.equal(placeholders(b), placeholders(a), path);
    for (const key of Object.keys(a)) walk(a[key], b[key], `${path}.${key}`);
  };
  walk(en, es, 'root');
});

test('fmt fills placeholders and leaves unknown ones', () => {
  assert.equal(fmt('Hi {name}, {missing}', { name: 'Ana' }), 'Hi Ana, {missing}');
});

test('Accept-Language picks a supported locale', () => {
  assert.equal(localeFromAcceptLanguage('es-US,es;q=0.9,en;q=0.8'), 'es');
  assert.equal(localeFromAcceptLanguage('fr-FR,fr;q=0.9'), 'en');
  assert.equal(localeFromAcceptLanguage(undefined), 'en');
});
