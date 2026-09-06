import { isDateKey, validateJournal } from './journalData.js';

export function createBackup(storage, keys, language, journal) {
  const defaults = ['[]', '{}', '0', 'false', '[]'];
  return { app: 'kcw-bible', version: 2, language, savedAt: new Date().toISOString(),
    values: keys.map((key, i) => storage.getItem(key) ?? defaults[i]), journal: validateJournal(journal) };
}

export function validateBackup(data, language, allBooks) {
  if (!data || data.app !== 'kcw-bible' || ![1, 2].includes(data.version) || data.language !== language ||
      !Array.isArray(data.values) || data.values.length !== 5 || !data.values.every(v => typeof v === 'string')) throw new Error('Invalid backup');
  const [progress, dates, rounds, awarded, history] = data.values.map(v => JSON.parse(v));
  const valid = new Set(allBooks.flatMap(b => Array.from({ length: b.chapters }, (_, i) => `${b.name}-${i + 1}`)));
  if (!Array.isArray(progress) || !progress.every(k => valid.has(k)) ||
      !dates || typeof dates !== 'object' || Array.isArray(dates) || !Object.entries(dates).every(([k, d]) => valid.has(k) && isDateKey(d)) ||
      !Number.isSafeInteger(rounds) || rounds < 0 || rounds > 1000 || typeof awarded !== 'boolean' ||
      !Array.isArray(history) || !history.every(e => e && valid.has(e.chapter) && Number.isSafeInteger(e.round) && e.round > 0 && isDateKey(e.date))) throw new Error('Invalid reading records');
  return { values: data.values, journal: data.version === 2 ? validateJournal(data.journal) : undefined };
}

// A v1 backup has no journal: leave existing notes untouched. Roll back all writes on failure.
export function restoreBackup(storage, keys, journalKey, backup) {
  const writes = keys.map((key, i) => [key, backup.values[i]]);
  if (backup.journal !== undefined) writes.push([journalKey, JSON.stringify(backup.journal)]);
  const before = writes.map(([key]) => [key, storage.getItem(key)]);
  try {
    for (const [key, value] of writes) storage.setItem(key, value);
  } catch (error) {
    for (const [key, value] of before) {
      if (storage.getItem(key) !== value) {
        if (value === null) storage.removeItem(key); else storage.setItem(key, value);
      }
    }
    throw error;
  }
}
