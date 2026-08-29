import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Heart, Home, RotateCcw, Sparkles, Sunrise, Trophy } from 'lucide-react';
import { allBooks, TOTAL_CHAPTERS } from './bibleData';
import './styles.css';

const STORAGE_KEY = 'kcw-bible-progress-v1';
const DATES_KEY = 'kcw-bible-reading-dates-v1';
const ROUNDS_KEY = 'kcw-bible-completed-rounds-v1';
const ROUND_AWARDED_KEY = 'kcw-bible-round-awarded-v1';
const HISTORY_KEY = 'kcw-bible-reading-history-v1';
const BASE_URL = import.meta.env.BASE_URL;

const DAILY_VERSES = [
  { reference: '시편 119:105', text: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다.' },
  { reference: '빌립보서 4:13', text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라.' },
  { reference: '잠언 3:5–6', text: '마음을 다하여 여호와를 신뢰하고 네 길을 그분께 맡기라.' },
  { reference: '이사야 41:10', text: '두려워하지 말라 내가 너와 함께 함이라.' },
  { reference: '예레미야 29:11', text: '너희를 향한 나의 생각은 평안이요 소망을 주려는 생각이라.' },
  { reference: '시편 46:1', text: '하나님은 우리의 피난처시요 힘이시니 환난 중에 만날 큰 도움이시라.' },
  { reference: '마태복음 11:28', text: '수고하고 무거운 짐 진 자들아 다 내게로 오라.' },
  { reference: '로마서 8:28', text: '하나님을 사랑하는 자들에게는 모든 것이 합력하여 선을 이루느니라.' },
  { reference: '시편 23:1', text: '여호와는 나의 목자시니 내게 부족함이 없으리로다.' },
  { reference: '요한복음 14:27', text: '평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라.' },
  { reference: '고린도후서 5:17', text: '누구든지 그리스도 안에 있으면 새로운 피조물이라.' },
  { reference: '갈라디아서 6:9', text: '선한 일을 하다가 낙심하지 말지니 때가 이르면 거두리라.' },
  { reference: '시편 37:5', text: '네 길을 여호와께 맡기라 그를 의지하면 그가 이루시리라.' },
  { reference: '여호수아 1:9', text: '강하고 담대하라 네 하나님 여호와가 너와 함께 하느니라.' },
  { reference: '데살로니가전서 5:16–18', text: '항상 기뻐하고 쉬지 말고 기도하며 범사에 감사하라.' },
  { reference: '히브리서 11:1', text: '믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니.' },
];

function readSaved() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

function readSavedDates() {
  try {
    const saved = JSON.parse(localStorage.getItem(DATES_KEY) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

function readStoredNumber(key) {
  const value = Number(localStorage.getItem(key));
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function readStoredBoolean(key) {
  return localStorage.getItem(key) === 'true';
}

function readSavedHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((entry) => entry && Number.isInteger(entry.round) && entry.round > 0 && typeof entry.chapter === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) : [];
  } catch { return []; }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(year, month - 1, day));
}

function DailyVerse() {
  const todayKey = localDateKey();
  const [year, month, day] = todayKey.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const verse = DAILY_VERSES[dayNumber % DAILY_VERSES.length];
  return <section className="daily-verse" aria-labelledby="daily-verse-title">
    <div className="daily-verse-label"><Sparkles /><div><p>{formatDate(todayKey)}</p><h2 id="daily-verse-title">오늘의 말씀</h2></div></div>
    <blockquote>“{verse.text}”</blockquote>
    <cite>{verse.reference}</cite>
  </section>;
}

function ReadingJourney({ completedRounds, currentRound, isComplete, onStartNext }) {
  return <section className={isComplete ? 'reading-journey complete' : 'reading-journey'} aria-labelledby="journey-title">
    <div className="journey-heading"><span><Trophy /></span><div><p>나의 통독 여정</p><h2 id="journey-title">{isComplete ? `${completedRounds}독 완료!` : `${currentRound}독 진행 중`}</h2></div></div>
    <div className="round-badges" aria-label={`${completedRounds}회 완독`}>
      {completedRounds > 0 ? Array.from({ length: completedRounds }, (_, index) => <span key={index + 1}><CheckCircle2 /> {index + 1}독 완료</span>) : <span className="round-pending">첫 완독을 향해 말씀과 함께 걸어가고 있습니다.</span>}
    </div>
    <p className="journey-message">{isComplete ? `축하합니다! 성경 전체 ${TOTAL_CHAPTERS.toLocaleString()}장을 모두 읽었습니다.` : `한 장 한 장의 말씀이 ${currentRound}독 완주를 향한 소중한 걸음입니다.`}</p>
    {isComplete && <button type="button" className="next-round" onClick={onStartNext}><BookOpen /> {completedRounds + 1}독 시작하기</button>}
  </section>;
}

function Header() {
  return <header className="site-header">
    <img src={`${BASE_URL}church-logo.jpg`} alt="웨체스터제일교회" />
    <span>온가족 성경통독</span>
  </header>;
}

function ProgressRing({ completed }) {
  const percent = Math.round((completed / TOTAL_CHAPTERS) * 100);
  return <div className="progress-ring" style={{ '--progress': `${percent * 3.6}deg` }} aria-label={`전체 진행률 ${percent}%`}>
    <div className="progress-inner"><small>전체 진행률</small><strong>{percent}<em>%</em></strong><span>{completed.toLocaleString()} / {TOTAL_CHAPTERS.toLocaleString()}장</span></div>
  </div>;
}

function BookRow({ book, done, onSelect }) {
  const percent = Math.round((done / book.chapters) * 100);
  const isComplete = done === book.chapters;
  return <button className="book-row" onClick={onSelect}>
    <span className={isComplete ? 'book-status complete' : 'book-status'}>{isComplete ? <CheckCircle2 /> : <Circle />}</span>
    <div className="book-row-copy"><strong>{book.name}</strong><span>{isComplete ? '전체 읽기 완료' : `${done} / ${book.chapters}장 읽음`}</span></div>
    <div className="mini-track"><span style={{ width: `${percent}%` }} /></div>
    <ChevronRight size={20} aria-hidden="true" />
  </button>;
}

function ChapterGrid({ book, completed, toggleChapter, toggleBook }) {
  const done = Array.from({ length: book.chapters }, (_, i) => i + 1).filter((chapter) => completed.has(`${book.name}-${chapter}`)).length;
  const isComplete = done === book.chapters;
  return <section className="chapter-section" aria-labelledby="book-title">
    <div className="section-heading"><div><BookOpen size={27} /><h2 id="book-title">{book.name}</h2></div><span><b>{done}</b> / {book.chapters}장 완료</span></div>
    <div className="book-progress"><span style={{ width: `${(done / book.chapters) * 100}%` }} /></div>
    <button className={isComplete ? 'complete-book active' : 'complete-book'} onClick={() => toggleBook(book)} aria-pressed={isComplete}>
      {isComplete ? <CheckCircle2 /> : <Circle />}
      <span>{isComplete ? `${book.name} 전체 읽기 완료` : `${book.name} 전체 완료로 표시`}</span>
    </button>
    <p className="chapter-help">읽은 장 번호를 한 번 누르면 완료 표시됩니다. 다시 누르면 취소됩니다.</p>
    <div className="chapter-grid">
      {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => {
        const checked = completed.has(`${book.name}-${chapter}`);
        return <button key={chapter} className={checked ? 'chapter done' : 'chapter'} aria-pressed={checked} onClick={() => toggleChapter(book.name, chapter)}>
          {checked ? <><Check size={16} />{chapter}</> : chapter}
        </button>;
      })}
    </div>
  </section>;
}

function Vision() {
  return <section className="vision-panel">
    <Heart size={34} strokeWidth={1.7} />
    <p>웨체스터제일교회 비전</p>
    <h2>복음을 나누는 교회</h2>
    <div className="gold-rule"><span /></div>
    <blockquote>“하나님을 더 사랑하고<br />더 알기 원합니다.”</blockquote>
    <div className="world-vision">
      <span>예배</span><span>소그룹</span><span>이웃섬김</span><span>복음전함</span><span>제자됨</span>
    </div>
  </section>;
}

function ReadingCalendar({ readingEntries }) {
  const todayKey = localDateKey();
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const readingsByDate = useMemo(() => {
    const grouped = {};
    readingEntries.forEach(({ chapter, date, round }) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      (grouped[date] ||= []).push({ chapter, round });
    });
    Object.values(grouped).forEach((items) => items.sort((a, b) => a.round - b.round || a.chapter.localeCompare(b.chapter, 'ko')));
    return grouped;
  }, [readingEntries]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const selectedReadings = readingsByDate[selectedDate] || [];
  const moveMonth = (amount) => {
    const nextMonth = new Date(year, month + amount, 1);
    setMonthDate(nextMonth);
    setSelectedDate(localDateKey(nextMonth));
  };
  const returnToToday = () => {
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  return <section className="calendar-panel" aria-labelledby="calendar-title">
    <div className="calendar-heading">
      <div><CalendarDays /><div><p>날짜별 통독</p><h2 id="calendar-title">통독 달력</h2></div></div>
      <button type="button" onClick={returnToToday}>오늘</button>
    </div>
    <div className="calendar-month-nav">
      <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달"><ChevronLeft /></button>
      <strong>{year}년 {month + 1}월</strong>
      <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달"><ChevronRight /></button>
    </div>
    <div className="calendar-weekdays" aria-hidden="true">
      {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
    </div>
    <div className="calendar-grid">
      {cells.map((day, index) => {
        if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
        const dateKey = localDateKey(new Date(year, month, day));
        const count = readingsByDate[dateKey]?.length || 0;
        const className = ['calendar-day', dateKey === todayKey ? 'today' : '', dateKey === selectedDate ? 'selected' : '', count ? 'has-reading' : ''].filter(Boolean).join(' ');
        return <button type="button" key={dateKey} className={className} onClick={() => setSelectedDate(dateKey)} aria-label={`${formatDate(dateKey)}, ${count}장 통독`}>
          <span>{day}</span>{count > 0 && <b>{count}장</b>}
        </button>;
      })}
    </div>
    <div className="calendar-detail" aria-live="polite">
      <div><span>{formatDate(selectedDate)}</span><strong>{selectedReadings.length}장 통독</strong></div>
      {selectedReadings.length ? <ul>{selectedReadings.map(({ chapter, round }) => {
        const splitAt = chapter.lastIndexOf('-');
        return <li key={`${round}-${chapter}`}><CheckCircle2 /> <b>{round}독</b> · {chapter.slice(0, splitAt)} {chapter.slice(splitAt + 1)}장</li>;
      })}</ul> : <p>이 날짜에 기록된 통독이 없습니다.</p>}
    </div>
    <p className="calendar-note">완료한 회독의 날짜별 기록도 계속 보관됩니다. 기존 완료 기록은 그대로 유지되며, 날짜가 없는 과거 기록은 달력에 표시되지 않습니다.</p>
  </section>;
}

function App() {
  const [completed, setCompleted] = useState(readSaved);
  const [readingDates, setReadingDates] = useState(readSavedDates);
  const [completedRounds, setCompletedRounds] = useState(() => readStoredNumber(ROUNDS_KEY));
  const [roundAwarded, setRoundAwarded] = useState(() => readStoredBoolean(ROUND_AWARDED_KEY));
  const [readingHistory, setReadingHistory] = useState(readSavedHistory);
  const [selectedBook, setSelectedBook] = useState(allBooks[0]);
  const [testament, setTestament] = useState('old');
  const [tab, setTab] = useState('home');
  const [showBookDetail, setShowBookDetail] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed])); }, [completed]);
  useEffect(() => { localStorage.setItem(DATES_KEY, JSON.stringify(readingDates)); }, [readingDates]);
  useEffect(() => { localStorage.setItem(ROUNDS_KEY, String(completedRounds)); }, [completedRounds]);
  useEffect(() => { localStorage.setItem(ROUND_AWARDED_KEY, String(roundAwarded)); }, [roundAwarded]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(readingHistory)); }, [readingHistory]);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${BASE_URL}sw.js`); }, []);
  useEffect(() => {
    if (completed.size === TOTAL_CHAPTERS && !roundAwarded) {
      setCompletedRounds(completedRounds + 1);
      setRoundAwarded(true);
    }
  }, [completed.size, completedRounds, roundAwarded]);

  const doneByBook = useMemo(() => {
    const map = new Map();
    allBooks.forEach((book) => map.set(book.name, Array.from(completed).filter((key) => key.startsWith(`${book.name}-`)).length));
    return map;
  }, [completed]);

  const visibleBooks = testament === 'old' ? allBooks.slice(0, 39) : allBooks.slice(39);
  const toggleChapter = (name, chapter) => {
    const key = `${name}-${chapter}`;
    const willComplete = !completed.has(key);
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setReadingDates((current) => {
      const next = { ...current };
      if (willComplete) next[key] = localDateKey(); else delete next[key];
      return next;
    });
  };
  const toggleBook = (book) => {
    const keys = Array.from({ length: book.chapters }, (_, index) => `${book.name}-${index + 1}`);
    const isComplete = keys.every((key) => completed.has(key));
    const today = localDateKey();
    setCompleted((current) => {
    const next = new Set(current);
    keys.forEach((key) => { if (isComplete) next.delete(key); else next.add(key); });
    return next;
    });
    setReadingDates((current) => {
      const next = { ...current };
      keys.forEach((key) => { if (isComplete) delete next[key]; else if (!completed.has(key)) next[key] = today; });
      return next;
    });
  };
  const openBook = (book) => {
    setSelectedBook(book);
    setTestament(book.testament);
    setShowBookDetail(true);
    setTab('bible');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openBookList = (nextTestament = testament) => {
    setTestament(nextTestament);
    setShowBookDetail(false);
    setTab('bible');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const isRoundComplete = completed.size === TOTAL_CHAPTERS;
  const visibleCompletedRounds = completedRounds + (isRoundComplete && !roundAwarded ? 1 : 0);
  const currentRound = isRoundComplete ? visibleCompletedRounds : completedRounds + (roundAwarded ? 0 : 1);
  const readingEntries = useMemo(() => [
    ...readingHistory,
    ...Object.entries(readingDates).filter(([chapter]) => completed.has(chapter)).map(([chapter, date]) => ({ round: currentRound, chapter, date })),
  ], [completed, currentRound, readingDates, readingHistory]);
  const startNextRound = () => {
    const finishedRound = visibleCompletedRounds;
    const archivedEntries = Object.entries(readingDates).map(([chapter, date]) => ({ round: finishedRound, chapter, date }));
    setReadingHistory((history) => [...history.filter((entry) => entry.round !== finishedRound), ...archivedEntries]);
    setCompletedRounds(finishedRound);
    setRoundAwarded(false);
    setCompleted(new Set());
    setReadingDates({});
    setSelectedBook(allBooks[0]);
    setShowBookDetail(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const nextUnread = allBooks.find((book) => (doneByBook.get(book.name) || 0) < book.chapters) || allBooks[0];
  const todayCount = readingEntries.filter(({ date }) => date === localDateKey()).length;

  return <div className="app-shell">
    <Header />
    <main>
      {tab === 'home' && <>
        <section className="welcome"><Sunrise /><div><p>하나님께서</p><h1>오늘도 함께하시길 축복합니다!</h1><span>온가족 성경통독 2026–2027</span></div></section>
        <DailyVerse />
        <section className="dashboard">
          <ProgressRing completed={completed.size} />
          <div className="today-area"><div className="today-count"><small>오늘 통독</small><strong>{todayCount}<em>장</em></strong></div><button onClick={() => openBook(nextUnread)}><BookOpen /> 계속 읽기</button><button className="calendar-shortcut" onClick={() => { setTab('calendar'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><CalendarDays /> 날짜별 기록 보기</button><p>{nextUnread.name}에서 말씀의 한 걸음을 이어가세요.</p></div>
        </section>
        <ReadingJourney completedRounds={visibleCompletedRounds} currentRound={currentRound} isComplete={isRoundComplete} onStartNext={startNextRound} />
        <div className="testament-links">
          <button onClick={() => openBookList('old')}><span className="round-icon blue"><BookOpen /></span><div><strong>구약 성경</strong><small>창세기 ~ 말라기</small></div><ChevronRight /></button>
          <button onClick={() => openBookList('new')}><span className="round-icon gold"><BookOpen /></span><div><strong>신약 성경</strong><small>마태복음 ~ 요한계시록</small></div><ChevronRight /></button>
        </div>
        <ChapterGrid book={selectedBook} completed={completed} toggleChapter={toggleChapter} toggleBook={toggleBook} />
        <Vision />
      </>}
      {tab === 'bible' && <section className="bible-view">
        {showBookDetail ? <>
          <button className="back-to-books" onClick={() => setShowBookDetail(false)}><ArrowLeft /> 성경 권 목록</button>
          <ChapterGrid book={selectedBook} completed={completed} toggleChapter={toggleChapter} toggleBook={toggleBook} />
        </> : <>
          <div className="page-title"><h1>성경을 선택하세요</h1><p>성경 권을 누르면 장 번호가 바로 열립니다.</p></div>
          <div className="segment"><button className={testament === 'old' ? 'active' : ''} onClick={() => setTestament('old')}>구약 39권</button><button className={testament === 'new' ? 'active' : ''} onClick={() => setTestament('new')}>신약 27권</button></div>
          <div className="book-list">{visibleBooks.map((book) => <BookRow key={book.name} book={book} done={doneByBook.get(book.name) || 0} onSelect={() => openBook(book)} />)}</div>
        </>}
      </section>}
      {tab === 'calendar' && <div className="calendar-page"><div className="page-title"><h1>나의 통독 기록</h1><p>달력에서 오늘과 날짜별 통독 기록을 확인하세요.</p></div><ReadingCalendar readingEntries={readingEntries} /></div>}
      {tab === 'vision' && <div className="vision-page"><div className="page-title"><h1>우리의 비전</h1><p>말씀을 읽고, 삶으로 복음을 나눕니다.</p></div><Vision /><section className="prayer"><h2>우리의 소망과 기도</h2><ol><li>하나님을 더 사랑하고 더 알기 원합니다.</li><li>뉴욕과 웨체스터 지역을 사랑하길 원합니다.</li><li>웨체스터제일교회에 부어주실 새로운 큰 부흥을 고대합니다.</li></ol></section><button className="reset" onClick={() => { if (confirm('완독 횟수를 포함한 모든 통독 기록을 초기화할까요?')) { setCompleted(new Set()); setReadingDates({}); setReadingHistory([]); setCompletedRounds(0); setRoundAwarded(false); } }}><RotateCcw size={17} /> 통독 기록 초기화</button></div>}
    </main>
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {[['home','홈',Home],['bible','성경',BookOpen],['calendar','달력',CalendarDays],['vision','비전',Heart]].map(([key,label,Icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { if (key === 'bible') setShowBookDetail(false); setTab(key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Icon /><span>{label}</span></button>)}
    </nav>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
