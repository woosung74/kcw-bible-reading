import React, { useEffect, useRef, useState } from 'react';
import { CHURCH_SCHEDULE } from './churchSchedule.js';
import { allBooks } from './bibleData.js';
import { dateKey, PLAN_START, PLAN_END, chapterCount } from './churchPlan.js';
import { churchRecordKey, readChurchRecords, writeChurchRecord, churchProgress } from './churchRecords.js';
import './churchTracker.css';
export default function ChurchTracker({language,today}) {
  const ko=language==='ko';
  const clamp=d=>d<PLAN_START?PLAN_START:d>PLAN_END?PLAN_END:d;
  const [selected,setSelected]=useState(()=>clamp(today));
  const [readOn,setReadOn]=useState(()=>dateKey());
  const [records,setRecords]=useState({});
  const [error,setError]=useState(false);
  const [message,setMessage]=useState('');
  const [month,setMonth]=useState(()=>clamp(today).slice(0,7));
  const editor=useRef(null);
  const readDateInput=useRef(null);
  useEffect(()=>{
    const load=()=>{try{setRecords(readChurchRecords(localStorage,language));setError(false);}catch{setError(true);}};
    load(); const sync=e=>{if(e.key===churchRecordKey(language)||e.key===null)load();};
    window.addEventListener('storage',sync);
    return ()=>window.removeEventListener('storage',sync);
  },[language]);
  useEffect(()=>setReadOn(records[selected]?.readOn || dateKey()),[selected,records]);
  const progress=churchProgress(records);
  const refs=CHURCH_SCHEDULE[selected] || [];
  const label=([book,start,end])=>allBooks[book].name+' '+start+(end===start?'':'–'+end)+(ko?'장':'');
  const choose=(date,focus=false)=>{setSelected(date);setMessage('');if(focus){editor.current?.scrollIntoView({behavior:'smooth',block:'center'});editor.current?.focus({preventScroll:true});}};
  const save=remove=>{
    try{
      const actualDate=readDateInput.current?.value ?? readOn;
      if(!remove && (!actualDate || actualDate>dateKey())) throw new Error('Invalid read date');
      if(remove && !confirm(ko?'이 날짜의 읽음 표시만 취소할까요? 기존 개인 통독·메모는 바뀌지 않습니다.':'Uncheck only this scheduled day? Personal progress and notes will not change.'))return;
      setRecords(writeChurchRecord(localStorage,language,selected,remove?null:actualDate));
      setError(false);setMessage(ko?'저장했습니다.':'Saved.');
    }catch{setMessage(ko?'저장하지 못했습니다. 읽은 날짜와 기기 저장 공간을 확인해 주세요.':'Could not save. Check the reading date and device storage.');}
  };
  const months=Array.from({length:8},(_,i)=>{const d=new Date(2026,8+i,1);return dateKey(d).slice(0,7);});
  return <section className="church-tracker" aria-label={ko?'교회 읽기표 진행 기록':'Church plan progress tracker'}>
    <h2>{ko?'교회 읽기표 진행 기록':'Church Plan Progress'}</h2>
    <p>{ko?'개인 통독·메모와 별도로 기록합니다. 이전 기록은 자동으로 옮기지 않습니다.':'Separate from personal progress and notes. Previous records are not automatically copied.'}</p>
    {error ? <p role="alert">{ko?'저장 기록을 읽을 수 없습니다. 기존 데이터를 보호하기 위해 체크를 잠갔습니다. 백업 파일을 확인해 주세요.':'Saved records cannot be read. Editing is locked to protect your data. Check your backup.'}</p> : <>
      <div className="church-tracker-score"><strong>{progress.percent}%</strong><span>{ko?`${progress.chapters} / 1,189장 · ${progress.days} / 203일 완료`:`${progress.chapters} / 1,189 chapters · ${progress.days} / 203 days complete`}</span></div>
      <progress max="1189" value={progress.chapters} aria-label={ko?'교회 읽기표 전체 진행률':'Church plan overall progress'} />
      <p>{ko?'진행률 = 읽음 표시한 날짜의 장 수 ÷ 전체 1,189장':'Progress = chapters in checked assignments ÷ all 1,189 chapters'}</p>
    </>}
    <div className="church-tracker-editor" ref={editor} tabIndex="-1">
      <h3>{ko?'날짜별 읽음 체크·수정':'Check or edit a day'}</h3>
      <label>{ko?'읽기표 날짜 선택':'Choose a scheduled date'}<input type="date" min={PLAN_START} max={PLAN_END} value={selected} onInput={e=>{if(e.target.value)choose(clamp(e.target.value));}} /></label>
      <button type="button" onClick={()=>choose(clamp(today))}>{ko?'오늘로 이동':'Go to today'}</button>
      <div className="church-tracker-range">{refs.map(ref=><strong key={ref[0]}>{label(ref)}</strong>)}</div>
      {refs.length ? <>
        <p className="church-tracker-state">{records[selected] ? (ko?'✓ 읽었어요':'✓ Completed') : (ko?'아직 체크하지 않았어요':'Not checked yet')} · {chapterCount(refs)}{ko?'장':' chapters'}</p>
        <label>{ko?'실제로 읽은 날짜 (늦게 읽은 날도 기록 가능)':'Actual reading date (including catch-up reading)'}<input ref={readDateInput} type="date" value={readOn} max={dateKey()} onChange={e=>setReadOn(e.target.value)} /></label>
        <div className="church-tracker-actions">
          <button className="church-tracker-save" disabled={error || !readOn || readOn>dateKey()} onClick={()=>save(false)}>{records[selected] ? (ko?'읽은 날짜 수정 저장':'Save reading date') : (ko?'✓ 이 분량을 다 읽었어요':'✓ I finished this reading')}</button>
          {records[selected] && <button disabled={error} onClick={()=>save(true)}>{ko?'읽음 표시 취소':'Uncheck this day'}</button>}
        </div>
        <p>{ko?'이 버튼은 선택한 날짜의 배정 분량 전체를 완료로 표시합니다.':'This button marks the entire assignment for the selected date complete.'}</p>
      </> : <p>{ko?'이 날짜에는 배정된 읽기 분량이 없습니다.':'No reading is assigned on this date.'}</p>}
      <p role="status" aria-live="polite">{message}</p>
    </div>
    <details className="church-tracker-history">
      <summary>{ko?'지난 날짜 확인·수정하기':'Review or edit other dates'}</summary>
      <label>{ko?'월 선택':'Choose month'}<select value={month} onChange={e=>setMonth(e.target.value)}>{months.map(m=><option key={m} value={m}>{m}</option>)}</select></label>
      <ul>{Object.entries(CHURCH_SCHEDULE).filter(([d])=>d.startsWith(month)).map(([date,items])=><li key={date}><button onClick={()=>choose(date,true)}>
        <span>{date} · {records[date] ? (ko?'✓ 읽음':'✓ Read') : (ko?'미체크':'Not checked')}</span>
        <strong>{items.map(label).join(' / ')}</strong>
        {records[date] && <small>{ko?'실제로 읽은 날: ':'Read on: '}{records[date].readOn}</small>}
        <small>{ko?'눌러서 확인·수정 →':'Tap to review or edit →'}</small>
      </button></li>)}</ul>
    </details>
    <p>{ko?'이 기기에 저장됩니다. 아래 ‘기록 백업 저장’으로 파일을 보관해 주세요.':'Saved on this device. Keep a file copy using Download backup below.'}</p>
  </section>;
}
