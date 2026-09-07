import React, { useEffect, useState } from 'react';
import { allBooks } from './bibleData';
import { CHURCH_SCHEDULE } from './churchSchedule';
import { dateKey, localDate, weekFor, nextReading, chapterCount, PLAN_START, PLAN_END } from './churchPlan';
import './churchPlan.css';
import ChurchTracker from './ChurchTracker.jsx';

export default function ChurchPlan({ language, onOpen }) {
  const ko=language==='ko';
  const [today,setToday]=useState(()=>dateKey());
  useEffect(()=>{
    const refresh=()=>setToday(dateKey());
    const timer=setInterval(refresh,30000);
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[]);
  const refs=CHURCH_SCHEDULE[today] || [];
  const week=weekFor(today);
  const next=nextReading(today);
  const label=([book,start,end])=>`${allBooks[book].name} ${start}${ko?'장':''}${end!==start?` - ${end}${ko?'장':''}`:''}`;
  const format=(key)=>localDate(key).toLocaleDateString(ko?'ko-KR':'en-US',{month:'long',day:'numeric',weekday:'short'});
  const note=today<PLAN_START ? (ko?'교회 통독은 2026년 9월 7일에 시작합니다.':'Our church reading plan starts September 7, 2026.')
    : today>PLAN_END ? (ko?'2026–2027 교회 읽기표 일정이 종료되었습니다.':'The 2026–2027 church reading schedule has ended.')
    : (ko?'오늘은 읽기표에 배정된 분량이 없습니다. 밀린 말씀을 읽거나 묵상해 보세요.':'No reading is assigned today. Catch up or reflect on what you have read.');
  return <section className="church-plan" aria-label={ko?'교회 이번 주 성경읽기':'This week’s church Bible reading'}>
    <div className="church-today">
      <span className="church-kicker">{ko?'우리 교회 성경읽기표':'OUR CHURCH READING PLAN'}</span>
      <h2>{ko?'오늘 읽을 말씀':'Today’s Reading'}</h2>
      <p className="church-date">{format(today)}</p>
      {refs.length ? <><div className="church-ranges">{refs.map(ref=><strong key={ref[0]}>{label(ref)}</strong>)}</div>
        <p>{ko?`총 ${chapterCount(refs)}장 · 아래 버튼에서 통독 기록을 열 수 있습니다.`:`${chapterCount(refs)} chapters · Open your reading tracker below.`}</p>
        <div className="church-open">{refs.map(ref=><button key={ref[0]} onClick={()=>onOpen(allBooks[ref[0]])}>{allBooks[ref[0]].name} {ko?'기록 열기':'tracker'} →</button>)}</div></>
        : <><p className="church-empty">{note}</p>{next && <div className="church-next"><b>{ko?'다음 읽기':'Next reading'} · {format(next.date)}</b><p>{next.refs.map(label).join(' / ')}</p></div>}</>}
    </div>
    <ChurchTracker language={language} today={today} />
    <div className="church-week">
      <h2>{ko?'이번 주 읽을 말씀':'This Week’s Reading'}</h2>
      <p>{format(week[0].date)} - {format(week[6].date)} · {ko?'일요일–토요일':'Sunday–Saturday'}</p>
      <ul>{week.map(({date,refs})=><li key={date} className={date===today?'is-today':''} aria-current={date===today?'date':undefined}>
        <div><time dateTime={date}>{format(date)}</time>{date===today && <span className="church-today-badge">{ko?'오늘':'Today'}</span>}</div>
        <div>{refs.length ? refs.map(ref=><span className="church-week-ref" key={ref[0]}>{label(ref)}</span>) : <span className="church-muted">{date<PLAN_START || date>PLAN_END ? (ko?'일정 기간 밖':'Outside plan dates') : (ko?'배정 없음':'No reading assigned')}</span>}</div>
      </li>)}</ul>
      <small>{ko?'교회 읽기표 기준이며, 개인 통독 기록과는 별도로 안내합니다.':'Based on the church schedule, independently of your personal reading progress.'}</small>
    </div>
  </section>;
}
