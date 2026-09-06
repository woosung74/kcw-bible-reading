export const JOURNAL_LIMITS = { reference: 200, note: 10000, gratitude: 300 };

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateJournal(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid journal');
  const result = {};
  for (const [date, entry] of Object.entries(value)) {
    if (!isDateKey(date) || !entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Invalid entry');
    for (const [field, limit] of Object.entries(JOURNAL_LIMITS)) {
      if (typeof entry[field] !== 'string' || entry[field].length > limit) throw new Error('Invalid text');
    }
    for (const field of ['createdAt', 'updatedAt']) {
      if (typeof entry[field] !== 'string' || !Number.isFinite(Date.parse(entry[field]))) throw new Error('Invalid timestamp');
    }
    if (Date.parse(entry.createdAt) > Date.parse(entry.updatedAt)) throw new Error('Invalid timestamp order');
    result[date] = { reference: entry.reference, note: entry.note, gratitude: entry.gratitude, createdAt: entry.createdAt, updatedAt: entry.updatedAt };
  }
  return result;
}

export function updateJournal(entries, date, patch, now = new Date().toISOString()) {
  if (!isDateKey(date)) throw new Error('Invalid date');
  const previous = entries[date] || { reference: '', note: '', gratitude: '', createdAt: now, updatedAt: now };
  return validateJournal({ ...entries, [date]: { ...previous, ...patch, createdAt: previous.createdAt, updatedAt: now } });
}

export function filterJournal(entries, month = '', query = '') {
  const needle = query.trim().toLocaleLowerCase();
  return Object.entries(entries)
    .filter(([date, entry]) => (!month || date.startsWith(month)) &&
      `${date}\n${entry.reference}\n${entry.note}\n${entry.gratitude}`.toLocaleLowerCase().includes(needle))
    .sort(([a], [b]) => b.localeCompare(a));
}
