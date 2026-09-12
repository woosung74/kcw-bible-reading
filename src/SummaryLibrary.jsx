import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Download, FileText, Search } from 'lucide-react';
import { SUMMARY_BOOKS } from './summaryLibrary.js';
import PdfDocumentViewer from './PdfDocumentViewer.jsx';
import './summaryLibrary.css';
import './summaryViewer.css';

export default function SummaryLibrary() {
  const [query, setQuery] = useState('');
  const [openItem, setOpenItem] = useState(null);
  const openerRef = useRef(null);
  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? SUMMARY_BOOKS.filter(item =>
      [item.book, item.english, item.description].some(value => value.toLowerCase().includes(term))
    ) : SUMMARY_BOOKS;
  }, [query]);

  const openDocument = (item, event) => {
    openerRef.current = event.currentTarget;
    window.history.pushState({ kcwSummaryViewer: true }, '');
    setOpenItem(item);
  };

  const closeDocument = () => {
    if (window.history.state?.kcwSummaryViewer) window.history.back();
    else setOpenItem(null);
  };

  useEffect(() => {
    if (!openItem) return undefined;
    const handleBack = () => setOpenItem(null);
    const handleKeyDown = event => {
      if (event.key === 'Escape') closeDocument();
    };
    window.addEventListener('popstate', handleBack);
    window.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('summary-viewer-open');
    return () => {
      window.removeEventListener('popstate', handleBack);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('summary-viewer-open');
      window.setTimeout(() => openerRef.current?.focus(), 0);
    };
  }, [openItem]);

  return <section className="summary-library">
    <div className="summary-hero">
      <span>KCW 성경통독 자료실</span>
      <h1>성경 권별 요약</h1>
      <p>성경의 큰 흐름과 각 장의 핵심 내용을 읽어 보세요. 새로운 요약본이 준비될 때마다 이 목록에 계속 추가됩니다.</p>
    </div>
    <label className="summary-search"><Search aria-hidden="true" /><span className="reading-plan-sr">성경 이름 검색</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="성경 이름을 검색하세요" />
    </label>
    <div className="summary-count"><b>등록된 요약본 {SUMMARY_BOOKS.length}권</b><span>구약과 신약 순서대로 표시됩니다.</span></div>
    {items.length ? <div className="summary-grid">{items.map(item => {
      const url = import.meta.env.BASE_URL + item.file;
      return <article className="summary-card" key={item.file}>
        <div className="summary-number">{String(item.order).padStart(2, '0')}</div>
        <div className="summary-copy">
          <span>{item.testament} · {item.chapters}</span>
          <h2>{item.book} <small>{item.english}</small></h2>
          <p>{item.description}</p>
          <div className="summary-meta"><FileText aria-hidden="true" /> PDF · {item.pages}쪽</div>
        </div>
        <div className="summary-actions">
          <button type="button" onClick={event => openDocument(item, event)}><BookOpen aria-hidden="true" />문서 열기</button>
          <a href={url} download={item.file}><Download aria-hidden="true" />다운로드</a>
        </div>
      </article>;
    })}</div> : <p className="summary-empty">검색 결과가 없습니다.</p>}
    <aside className="summary-note"><b>앞으로 추가될 자료</b><p>출애굽기부터 요한계시록까지 완성되는 순서대로 이곳에서 확인할 수 있습니다.</p></aside>
    {openItem && <div className="summary-viewer" role="dialog" aria-modal="true" aria-labelledby="summary-viewer-title">
      <header className="summary-viewer-header">
        <div><span>성경 권별 요약</span><strong id="summary-viewer-title">{openItem.book} · {openItem.english}</strong></div>
        <div className="summary-viewer-actions">
          <a href={`${import.meta.env.BASE_URL}${openItem.file}`} download={openItem.file}><Download aria-hidden="true" />다운로드</a>
          <button type="button" onClick={closeDocument} autoFocus>닫기 · 앱으로 돌아가기</button>
        </div>
      </header>
      <PdfDocumentViewer url={`${import.meta.env.BASE_URL}${openItem.file}`} title={`${openItem.book} 성경 요약 PDF`} />
    </div>}
  </section>;
}
