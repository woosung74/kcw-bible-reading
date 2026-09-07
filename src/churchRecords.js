import { CHURCH_SCHEDULE } from './churchSchedule.js';
import { chapterCount } from './churchPlan.js';
import { isDateKey } from './journalData.js';
export const churchRecordKey = language => 'kcw-church-records-' + language + '-v1';
export function validateChurchRecords(records) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) throw new Error('Invalid church records');
  const clean={};
  for(const [date,entry] of Object.entries(records)) {
    if(!Object.hasOwn(CHURCH_SCHEDULE,date) || !entry || typeof entry!=='object' || !isDateKey(entry.readOn) || typeof entry.updatedAt!=='string' || !Number.isFinite(Date.parse(entry.updatedAt))) throw new Error('Invalid church entry');
    clean[date]={readOn:entry.readOn,updatedAt:entry.updatedAt};
  }
  return clean;
}
export function readChurchRecords(storage, language) {
  return validateChurchRecords(JSON.parse(storage.getItem(churchRecordKey(language)) || '{}'));
}
export function writeChurchRecord(storage, language, date, readOn, now = new Date().toISOString()) {
  if (!Object.hasOwn(CHURCH_SCHEDULE,date)) throw new Error('Unassigned date');
  const records=readChurchRecords(storage,language);
  if(readOn===null) delete records[date];
  else records[date]={readOn,updatedAt:now};
  const valid=validateChurchRecords(records);
  storage.setItem(churchRecordKey(language),JSON.stringify(valid));
  return valid;
}
export function churchProgress(records) {
  const days=Object.keys(validateChurchRecords(records));
  const chapters=days.reduce((sum,date)=>sum+chapterCount(CHURCH_SCHEDULE[date]),0);
  return {days:days.length,chapters,percent:Math.round(chapters/1189*1000)/10};
}
