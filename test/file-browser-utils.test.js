import test from 'node:test';
import assert from 'node:assert/strict';
import { fileKindLabel, formatFileSize, formatRelativeDate, isRecent, sortEntries } from '../src/file-browser-utils.js';

test('sortEntries keeps folders first and names natural', () => {
  const sorted = sortEntries([
    { name: 'file10.js', type: 'file' },
    { name: 'zeta', type: 'directory' },
    { name: 'file2.js', type: 'file' },
    { name: 'alpha', type: 'directory' },
  ]);
  assert.deepEqual(sorted.map(({ name }) => name), ['alpha', 'zeta', 'file2.js', 'file10.js']);
});

test('formatFileSize uses compact binary units', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(undefined), '—');
});

test('formatRelativeDate reports useful relative values', () => {
  const now = Date.parse('2026-09-23T12:00:00Z');
  assert.equal(formatRelativeDate('2026-09-22T12:00:00Z', now), 'yesterday');
  assert.equal(formatRelativeDate('2026-09-09T12:00:00Z', now), '2 weeks ago');
});

test('isRecent marks dates younger than 30 days', () => {
  const now = Date.parse('2026-09-23T12:00:00Z');
  assert.equal(isRecent('2026-09-01T12:00:00Z', now), true);
  assert.equal(isRecent('2026-08-01T12:00:00Z', now), false);
  assert.equal(isRecent('invalid', now), false);
});

test('fileKindLabel identifies special and common files', () => {
  assert.equal(fileKindLabel('LICENSE'), 'License');
  assert.equal(fileKindLabel('app.js'), 'JavaScript');
  assert.equal(fileKindLabel('Dockerfile'), 'File');
});
