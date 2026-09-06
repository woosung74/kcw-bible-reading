import React from 'react';
import { BookOpen, Download } from 'lucide-react';
import './readingPlan.css';

export default function ReadingPlan({ language = 'ko' }) {
  const ko = language === 'ko';
  const filename = `kcw-reading-plan-2026-2027-${language}.pdf`;
  const url = import.meta.env.BASE_URL + filename;
  return <section className="reading-plan-card" aria-label={ko ? '성경읽기표 PDF' : 'Bible reading plan PDF'}>
    <div><span className="reading-plan-eyebrow">2026.09.07 - 2027.04.30</span>
      <h2>{ko ? '월별 성경읽기표' : 'Monthly Bible Reading Plan'}</h2>
      <p>{ko ? '큰 글씨 월별 달력 · 8쪽 PDF · 인쇄용 체크란' : '8 monthly calendar pages · Printable checkboxes'}</p>
    </div>
    <div className="reading-plan-actions">
      <a href={url} target="_blank" rel="noopener noreferrer"><BookOpen size={18} />{ko ? '읽기표 보기' : 'View PDF'}<span className="reading-plan-sr">{ko ? ' (새 창)' : ' (new tab)'}</span></a>
      <a href={url} download={filename}><Download size={18} />{ko ? 'PDF 다운로드' : 'Download PDF'}</a>
    </div>
    <small>{ko ? '휴대폰에서 PDF가 열리면 공유 메뉴에서 파일로 저장할 수도 있습니다.' : 'On a phone, you can also save the PDF using the Share menu.'}</small>
  </section>;
}
