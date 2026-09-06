import test from 'node:test';
import assert from 'node:assert/strict';
import { allBooks } from '../src/bibleData.js';
import { filterJournal, isDateKey, localDay, updateJournal, validateJournal } from '../src/journalData.js';
import { createBackup, restoreBackup, validateBackup } from '../src/backupData.js';

const language = allBooks[0].name === 'Genesis' ? 'en' : 'ko';
const keys = ['progress', 'dates', 'rounds', 'awarded', 'history'];
const timestamp = '2026-09-05T12:00:00.000Z';
const journal = updateJournal({}, '2026-09-04', { reference: 'John 3:16', note: '묵상\nFaith & love <script>literal text</script>', gratitude: '가족과 함께한 시간 / Family time' }, timestamp);
const progress = JSON.stringify([`${allBooks[0].name}-1`]);
const values = [progress, JSON.stringify({ [`${allBooks[0].name}-1`]: '2026-09-04' }), '1', 'false', '[]'];
function storage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
}
function fixture(version = 2) { return { app: 'kcw-bible', version, language, values: [...values], ...(version === 2 ? { journal } : {}) }; }

test('validates real dates including leap years', () => {
  assert.equal(isDateKey('2024-02-29'), true);
  for (const d of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', 'bad', '__proto__', '0000-01-01']) assert.equal(isDateKey(d), false);
  assert.equal(localDay(new Date(2026, 8, 4, 23, 59)), '2026-09-04');
});
test('updates a daily entry without losing its creation time or other fields', () => {
  const next = updateJournal(journal, '2026-09-04', { note: 'Edited reflection' }, '2026-09-06T12:00:00.000Z');
  assert.equal(next['2026-09-04'].createdAt, timestamp);
  assert.equal(next['2026-09-04'].gratitude, journal['2026-09-04'].gratitude);
  assert.equal(next['2026-09-04'].updatedAt, '2026-09-06T12:00:00.000Z');
  assert.equal(Object.keys(next).length, 1);
  assert.notEqual(next['2026-09-04'].note, journal['2026-09-04'].note);
});
test('stores gratitude-only entries and keeps dates independent', () => {
  const next = updateJournal(journal, '2026-09-05', { gratitude: 'A new day' }, timestamp);
  assert.equal(next['2026-09-05'].note, '');
  assert.deepEqual(next['2026-09-04'], journal['2026-09-04']);
  assert.deepEqual(filterJournal(next).map(([d]) => d), ['2026-09-05', '2026-09-04']);
});
test('searches dates, scripture, multiline notes and gratitude; filters by month', () => {
  for (const query of ['2026-09-04', 'john', '묵상', 'FAMILY']) assert.equal(filterJournal(journal, '2026-09', query).length, 1);
  assert.equal(filterJournal(journal, '2026-08').length, 0);
  assert.equal(filterJournal(journal, '', 'not found').length, 0);
});
test('rejects malformed and oversized journal data without mutation', () => {
  for (const value of [null, [], {'2026-02-30': journal['2026-09-04']}, {'2026-09-04': {...journal['2026-09-04'], note: 5}}, {'2026-09-04': {...journal['2026-09-04'], gratitude: 'a'.repeat(301)}}, {'2026-09-04': {...journal['2026-09-04'], createdAt: 'bad'}}]) assert.throws(() => validateJournal(value));
  assert.deepEqual(validateJournal(journal), journal);
});
test('v2 backup and restore round trip preserves all text, timestamps and progress', () => {
  const source = storage(Object.fromEntries(keys.map((k, i) => [k, values[i]])));
  const file = JSON.parse(JSON.stringify(createBackup(source, keys, language, journal)));
  const validated = validateBackup(file, language, allBooks);
  const target = storage();
  restoreBackup(target, keys, 'journal', validated);
  assert.deepEqual(keys.map(k => target.getItem(k)), values);
  assert.deepEqual(JSON.parse(target.getItem('journal')), journal);
});
test('v1 backup restores progress but preserves existing journal', () => {
  const target = storage({ journal: JSON.stringify(journal) });
  restoreBackup(target, keys, 'journal', validateBackup(fixture(1), language, allBooks));
  assert.deepEqual(JSON.parse(target.getItem('journal')), journal);
  assert.equal(target.getItem('progress'), progress);
});
test('v2 backup can restore a deliberately empty journal', () => {
  const target = storage({ journal: JSON.stringify(journal) });
  restoreBackup(target, keys, 'journal', validateBackup({...fixture(), journal:{}}, language, allBooks));
  assert.equal(target.getItem('journal'), '{}');
});
test('rejects wrong language, unsupported version, invalid dates, missing journal and invalid chapter', () => {
  const wrongChapter = fixture(); wrongChapter.values[0] = '["not-a-book-1"]';
  const wrongDate = fixture(); wrongDate.values[1] = JSON.stringify({[`${allBooks[0].name}-1`]:'2026-02-30'});
  for (const data of [{...fixture(), language: language === 'en' ? 'ko' : 'en'}, {...fixture(), version:3}, {...fixture(), journal:null}, wrongChapter, wrongDate]) assert.throws(() => validateBackup(data, language, allBooks));
});
test('rolls back every changed key after a quota failure', () => {
  const target = storage({ progress: 'original-progress', journal: 'original-journal' });
  const write = target.setItem;
  target.setItem = (key, value) => { if (key === 'journal' && value !== 'original-journal') throw new Error('Quota exceeded'); return write(key, value); };
  assert.throws(() => restoreBackup(target, keys, 'journal', validateBackup(fixture(), language, allBooks)));
  assert.equal(target.getItem('progress'), 'original-progress');
  assert.equal(target.getItem('journal'), 'original-journal');
  for (const key of keys.slice(1)) assert.equal(target.getItem(key), null);
});
test('new users can back up empty progress and a journal', () => {
  const data = createBackup(storage(), keys, language, journal);
  assert.doesNotThrow(() => validateBackup(data, language, allBooks));
});
