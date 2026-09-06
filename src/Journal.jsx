import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Heart, NotebookPen, Search } from 'lucide-react';
import { filterJournal, isDateKey, JOURNAL_LIMITS, localDay } from './journalData.js';
import './journal.css';

const COPY = {
  ko: {
    title: '말씀 메모 · 한 줄 감사', intro: '말씀을 마음에 담고, 오늘의 감사를 남겨 보세요.',
    date: '기록 날짜', today: '오늘', reference: '읽은 말씀 (선택)', referenceHint: '예: 요한복음 3:16–21',
    note: '말씀 메모', noteHint: '마음에 남은 말씀, 깨달음, 삶에 적용할 내용을 자유롭게 적어 보세요.',
    gratitude: '한 줄 감사', gratitudeHint: '오늘 감사한 일 한 가지를 적어 보세요.',
    privacy: '이 브라우저에 자동 저장됩니다. 교회나 다른 사람에게 자동 공유되지 않습니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 상단에서 백업하세요. 백업 파일에는 메모가 평문으로 포함되므로 안전하게 보관하세요.',
    ready: '입력하면 자동으로 저장됩니다.', saved: '자동 저장되었습니다.',
    loadError: '저장된 메모를 읽을 수 없어 편집을 중단했습니다. 브라우저 데이터를 삭제하지 말고 새로고침하거나 올바른 백업을 복원해 주세요.',
    saveError: '기기에 저장하지 못했습니다. 이 화면을 닫지 마세요. 상단의 기록 백업으로 현재 메모를 파일에 보관하거나 다시 저장해 주세요.',
    retry: '다시 저장', created: '처음 작성', updated: '마지막 수정', remove: '이 날짜의 메모·감사 삭제',
    confirm: '선택한 날짜의 말씀 메모와 한 줄 감사를 삭제할까요? 통독 기록은 그대로 유지됩니다. 필요하면 먼저 백업해 주세요.',
    history: '지난 메모와 감사', month: '월별 보기', search: '메모 검색', searchHint: '말씀, 메모, 감사 내용 검색',
    clear: '필터 지우기', empty: '아직 기록이 없습니다. 위에서 첫 메모나 감사를 남겨 보세요.', noMatch: '검색 조건에 맞는 기록이 없습니다.',
    open: '보기 · 수정', more: '더 보기', blank: '내용 없는 기록', count: '개의 날짜 기록',
    shortcut: '오늘의 말씀 메모 · 한 줄 감사', shortcutHint: '읽은 말씀과 감사한 일을 기록하세요.', calendar: '이 날짜의 메모 · 감사 쓰기',
  },
  en: {
    title: 'Scripture Notes & Gratitude', intro: 'Reflect on God’s Word and remember the gifts of each day.',
    date: 'Entry date', today: 'Today', reference: 'Scripture reference (optional)', referenceHint: 'e.g. John 3:16–21',
    note: 'Scripture Notes', noteHint: 'Write a reflection, a meaningful verse, or a way to put God’s Word into practice.',
    gratitude: 'One-Line Gratitude', gratitudeHint: 'What is one thing you are thankful for today?',
    privacy: 'Saved automatically in this browser. Not automatically shared with the church or anyone else. Back up before changing devices or clearing browser data. Backup files contain your notes as plain text; keep them safe.',
    ready: 'Your writing saves automatically.', saved: 'Saved automatically.',
    loadError: 'Your saved journal could not be read. Editing is paused. Do not clear browser data. Reload or restore a valid backup.',
    saveError: 'Could not save to this device. Keep this page open. Download a backup above to preserve your current notes, or try saving again.',
    retry: 'Try saving again', created: 'First written', updated: 'Last edited', remove: 'Delete this date’s notes & gratitude',
    confirm: 'Delete the notes and gratitude for this date? Reading progress will stay unchanged. Back up first if needed.',
    history: 'Past Notes & Gratitude', month: 'Filter by month', search: 'Search notes', searchHint: 'Search references, notes, or gratitude',
    clear: 'Clear filters', empty: 'No entries yet. Write your first note or gratitude above.', noMatch: 'No entries match these filters.',
    open: 'View · Edit', more: 'Show more', blank: 'Empty entry', count: 'dated entries',
    shortcut: 'Today’s Notes & Gratitude', shortcutHint: 'Remember what you read and what you are thankful for.', calendar: 'Write notes & gratitude for this date',
  },
};

export function JournalShortcut({ language, onOpen }) {
  const t = COPY[language];
  return <button type="button" className="journal-shortcut" onClick={() => onOpen(localDay())}>
    <NotebookPen aria-hidden="true" /><span><strong>{t.shortcut}</strong><small>{t.shortcutHint}</small></span>
  </button>;
}

export function CalendarJournalButton({ language, date, onOpen }) {
  return <button type="button" className="journal-calendar-link" disabled={date > localDay()} onClick={() => onOpen(date)}><NotebookPen aria-hidden="true" />{COPY[language].calendar}</button>;
}

export default function Journal({ language, journal, date, onDateChange }) {
  const t = COPY[language];
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const [today, setToday] = useState(localDay);
  const [month, setMonth] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(20);
  useEffect(() => {
    const tick = () => setToday(localDay());
    const timer = setInterval(tick, 30000);
    window.addEventListener('focus', tick);
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); };
  }, []);
  const entries = useMemo(() => filterJournal(journal.entries, month, query), [journal.entries, month, query]);
  const entry = journal.entries[date];
  const formatDay = key => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(`${key}T12:00:00`));
  const formatTime = value => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const blocked = journal.status === 'load-error';
  const statusText = journal.status === 'save-error' ? t.saveError : blocked ? t.loadError : journal.status === 'saved' ? t.saved : t.ready;
  const openEntry = key => { onDateChange(key); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const changeDate = event => {
    const value = event.currentTarget.value;
    if (isDateKey(value) && value <= localDay()) onDateChange(value);
    else if (event.type === 'blur') event.currentTarget.value = date;
  };

  return <div className="journal-page">
    <div className="page-title"><p className="journal-eyebrow"><NotebookPen aria-hidden="true" /> {language === 'ko' ? '나의 하루 기록' : 'MY DAILY JOURNAL'}</p><h1>{t.title}</h1><p>{t.intro}</p></div>
    <section className="journal-editor" aria-label={t.title}>
      <div className="journal-date-row"><label htmlFor="journal-date">{t.date}<input id="journal-date" type="date" value={date} min="0001-01-01" max={today} onChange={changeDate} onInput={changeDate} onBlur={changeDate} /></label><button type="button" onClick={() => onDateChange(localDay())}>{t.today}</button></div>
      <h2>{formatDay(date)}</h2>
      <label className="journal-field" htmlFor="journal-reference">{t.reference}<input id="journal-reference" value={entry?.reference || ''} maxLength={JOURNAL_LIMITS.reference} placeholder={t.referenceHint} disabled={blocked} onChange={e => journal.update(date, { reference: e.target.value })} /></label>
      <label className="journal-field" htmlFor="journal-note"><span><BookOpen aria-hidden="true" />{t.note}</span><textarea id="journal-note" rows={8} value={entry?.note || ''} maxLength={JOURNAL_LIMITS.note} placeholder={t.noteHint} disabled={blocked} onChange={e => journal.update(date, { note: e.target.value })} /><small>{entry?.note.length || 0} / {JOURNAL_LIMITS.note.toLocaleString()}</small></label>
      <label className="journal-field journal-gratitude" htmlFor="journal-gratitude"><span><Heart aria-hidden="true" />{t.gratitude}</span><input id="journal-gratitude" value={entry?.gratitude || ''} maxLength={JOURNAL_LIMITS.gratitude} placeholder={t.gratitudeHint} disabled={blocked} onChange={e => journal.update(date, { gratitude: e.target.value })} /><small>{entry?.gratitude.length || 0} / {JOURNAL_LIMITS.gratitude}</small></label>
      <p role="status" className={journal.status.includes('error') ? 'journal-status error' : 'journal-status'}>{statusText}</p>
      {journal.status === 'save-error' && <button type="button" onClick={journal.retry}>{t.retry}</button>}
      {entry && <div className="journal-meta"><p>{t.created}: {formatTime(entry.createdAt)}<br />{t.updated}: {formatTime(entry.updatedAt)}</p><button type="button" className="journal-delete" disabled={blocked} onClick={() => { if (confirm(t.confirm)) journal.remove(date); }}>{t.remove}</button></div>}
    </section>
    <p className="journal-privacy">{t.privacy}</p>
    <section className="journal-history" aria-labelledby="journal-history-title">
      <h2 id="journal-history-title">{t.history}</h2>
      <div className="journal-filters"><label>{t.month}<input type="month" value={month} onInput={e => { setMonth(e.currentTarget.value); setLimit(20); }} onBlur={e => { setMonth(e.currentTarget.value); setLimit(20); }} onChange={e => { setMonth(e.target.value); setLimit(20); }} /></label><label><span><Search size={16} aria-hidden="true" />{t.search}</span><input type="search" value={query} placeholder={t.searchHint} onChange={e => { setQuery(e.target.value); setLimit(20); }} /></label><button type="button" onClick={() => { setMonth(''); setQuery(''); setLimit(20); }}>{t.clear}</button></div>
      <p className="journal-result-count">{entries.length} {t.count}</p>
      {!entries.length && <p className="journal-empty">{Object.keys(journal.entries).length ? t.noMatch : t.empty}</p>}
      <div className="journal-entry-list">{entries.slice(0, limit).map(([key, item]) => <article className="journal-entry" key={key}>
        <div className="journal-entry-heading"><h3><time dateTime={key}>{formatDay(key)}</time></h3><button type="button" aria-label={`${formatDay(key)} · ${t.open}`} onClick={() => openEntry(key)}>{t.open}</button></div>
        {item.reference && <p className="journal-reference-text">{item.reference}</p>}
        {item.note && <p className="journal-preview">{item.note}</p>}
        {item.gratitude && <p className="journal-gratitude-text"><Heart size={16} aria-hidden="true" /><span>{item.gratitude}</span></p>}
        {!item.reference && !item.note && !item.gratitude && <p>{t.blank}</p>}
        <small>{t.updated}: {formatTime(item.updatedAt)}</small>
      </article>)}</div>
      {entries.length > limit && <button type="button" onClick={() => setLimit(limit + 20)}>{t.more}</button>}
    </section>
  </div>;
}
