const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function sortEntries(entries = []) {
  return [...entries].sort((a, b) =>
    Number(b.type === 'directory') - Number(a.type === 'directory') ||
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (!bytes) return '0 B';
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** unit;
  return `${value.toFixed(unit && value < 10 ? 1 : 0)} ${UNITS[unit]}`;
}

export function formatRelativeDate(value, now = Date.now()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const delta = date.getTime() - now;
  const abs = Math.abs(delta);
  const units = abs < 60 * 60e3
    ? ['minute', 60e3]
    : abs < 24 * 60 * 60e3
      ? ['hour', 60 * 60e3]
      : abs < 7 * 24 * 60 * 60e3
        ? ['day', 24 * 60 * 60e3]
        : abs < 30 * 24 * 60 * 60e3
          ? ['week', 7 * 24 * 60 * 60e3]
          : abs < 365 * 24 * 60 * 60e3
            ? ['month', 30 * 24 * 60 * 60e3]
            : ['year', 365 * 24 * 60 * 60e3];
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    .format(Math.round(delta / units[1]), units[0]);
}

export function isRecent(value, now = Date.now()) {
  const time = new Date(value).getTime();
  const age = now - time;
  return Number.isFinite(time) && age >= 0 && age < 30 * 24 * 60 * 60e3;
}

export function fileKindLabel(name = '') {
  const lower = name.toLowerCase();
  if (lower === 'license' || lower.startsWith('license.')) return 'License';
  if (lower === 'third_party_notices') return 'Notices';
  if (lower.startsWith('.git')) return 'Git';
  const extension = lower.includes('.') ? lower.split('.').pop() : '';
  return ({
    css: 'CSS', html: 'HTML', js: 'JavaScript', json: 'JSON', md: 'Markdown',
    png: 'Image', svg: 'SVG', yml: 'YAML', yaml: 'YAML', ts: 'TypeScript',
  })[extension] || (extension ? extension.toUpperCase() : 'File');
}

export function menuItemsFor(items = [], entry, path) {
  return items.filter((item) => !item.when || item.when(entry, path));
}
