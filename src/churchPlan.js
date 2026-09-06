import { CHURCH_SCHEDULE } from './churchSchedule.js';
export const PLAN_START = '2026-09-07';
export const PLAN_END = '2027-04-30';
export function dateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
export function localDate(key) { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); }
export function weekFor(key) {
  const start=localDate(key); start.setDate(start.getDate()-start.getDay());
  return Array.from({length:7},(_,i)=> { const day=new Date(start); day.setDate(start.getDate()+i); const date=dateKey(day); return {date,refs:CHURCH_SCHEDULE[date] || []}; });
}
export function nextReading(key) {
  const date=Object.keys(CHURCH_SCHEDULE).find(date=>date>key);
  return date ? {date,refs:CHURCH_SCHEDULE[date]} : null;
}
export function chapterCount(refs) { return refs.reduce((sum,[,start,end])=>sum+end-start+1,0); }
