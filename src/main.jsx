import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, Circle, Heart, Home, RotateCcw, Sunrise } from 'lucide-react';
import { allBooks, TOTAL_CHAPTERS } from './bibleData';
import './styles.css';

const STORAGE_KEY = 'kcw-bible-progress-v1';
const BASE_URL = import.meta.env.BASE_URL;

function readSaved() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
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

function App() {
  const [completed, setCompleted] = useState(readSaved);
  const [selectedBook, setSelectedBook] = useState(allBooks[0]);
  const [testament, setTestament] = useState('old');
  const [tab, setTab] = useState('home');
  const [showBookDetail, setShowBookDetail] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed])); }, [completed]);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${BASE_URL}sw.js`); }, []);

  const doneByBook = useMemo(() => {
    const map = new Map();
    allBooks.forEach((book) => map.set(book.name, Array.from(completed).filter((key) => key.startsWith(`${book.name}-`)).length));
    return map;
  }, [completed]);

  const visibleBooks = testament === 'old' ? allBooks.slice(0, 39) : allBooks.slice(39);
  const toggleChapter = (name, chapter) => setCompleted((current) => {
    const next = new Set(current); const key = `${name}-${chapter}`;
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const toggleBook = (book) => setCompleted((current) => {
    const next = new Set(current);
    const keys = Array.from({ length: book.chapters }, (_, index) => `${book.name}-${index + 1}`);
    const isComplete = keys.every((key) => next.has(key));
    keys.forEach((key) => { if (isComplete) next.delete(key); else next.add(key); });
    return next;
  });
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
  const nextUnread = allBooks.find((book) => (doneByBook.get(book.name) || 0) < book.chapters) || allBooks[0];

  return <div className="app-shell">
    <Header />
    <main>
      {tab === 'home' && <>
        <section className="welcome"><Sunrise /><div><p>하나님께서</p><h1>오늘도 함께하시길 축복합니다!</h1><span>온가족 성경통독 2026–2027</span></div></section>
        <section className="dashboard">
          <ProgressRing completed={completed.size} />
          <div className="today-area"><button onClick={() => openBook(nextUnread)}><BookOpen /> 오늘의 통독</button><p>{nextUnread.name}에서<br />말씀의 한 걸음을 이어가세요.</p></div>
        </section>
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
      {tab === 'vision' && <div className="vision-page"><div className="page-title"><h1>우리의 비전</h1><p>말씀을 읽고, 삶으로 복음을 나눕니다.</p></div><Vision /><section className="prayer"><h2>우리의 소망과 기도</h2><ol><li>하나님을 더 사랑하고 더 알기 원합니다.</li><li>뉴욕과 웨체스터 지역을 사랑하길 원합니다.</li><li>웨체스터제일교회에 부어주실 새로운 큰 부흥을 고대합니다.</li></ol></section><button className="reset" onClick={() => { if (confirm('모든 통독 기록을 초기화할까요?')) setCompleted(new Set()); }}><RotateCcw size={17} /> 통독 기록 초기화</button></div>}
    </main>
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {[['home','홈',Home],['bible','성경',BookOpen],['vision','비전',Heart]].map(([key,label,Icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { if (key === 'bible') setShowBookDetail(false); setTab(key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Icon /><span>{label}</span></button>)}
    </nav>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
