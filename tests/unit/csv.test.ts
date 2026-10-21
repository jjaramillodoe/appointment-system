import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from '@/lib/csv';

test('plain values pass through', () => {
  assert.equal(csvCell('María Peña'), 'María Peña');
  assert.equal(csvCell(42), '42');
  assert.equal(csvCell(null), '');
});

test('commas, quotes, and newlines are quoted', () => {
  assert.equal(csvCell('Smith, "Jr"'), '"Smith, ""Jr"""');
  assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
});

test('spreadsheet formulas are neutralized', () => {
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)']) {
    assert.ok(csvCell(value).replace(/^"/, '').startsWith("'"), value);
  }
  assert.equal(csvCell('=HYPERLINK("http://x","click")'), `"'=HYPERLINK(""http://x"",""click"")"`);
});
