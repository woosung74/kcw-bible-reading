import React, { useMemo, useState } from 'react';
import { BookOpen, Download, FileText, Search } from 'lucide-react';
import { SUMMARY_BOOKS } from './summaryLibrary.js';
import './summaryLibrary.css';

export default function SummaryLibrary() {
  const [query, setQuery] = useState('');
  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? SUMMARY_BOOKS.filter(item =>
      [item.book, item.english, item.description].some(value => value.toLowerCase().includes(term))
    ) : SUMMARY_BOOKS;
  }, [query]);

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
          <a href={url} target="_blank" rel="noopener noreferrer"><BookOpen aria-hidden="true" />문서 열기<span className="reading-plan-sr"> (새 창)</span></a>
          <a href={url} download={item.file}><Download aria-hidden="true" />다운로드</a>
        </div>
      </article>;
    })}</div> : <p className="summary-empty">검색 결과가 없습니다.</p>}
    <aside className="summary-note"><b>앞으로 추가될 자료</b><p>출애굽기부터 요한계시록까지 완성되는 순서대로 이곳에서 확인할 수 있습니다.</p></aside>
  </section>;
}
