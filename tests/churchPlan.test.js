import test from 'node:test';
import assert from 'node:assert/strict';
import { CHURCH_SCHEDULE } from '../src/churchSchedule.js';
import { weekFor, nextReading, chapterCount, dateKey } from '../src/churchPlan.js';
import { allBooks } from '../src/bibleData.js';

test('church schedule covers all 1189 chapters exactly once in canonical order',()=>{
  const actual=Object.values(CHURCH_SCHEDULE).flatMap(refs=>refs.flatMap(([book,start,end])=>Array.from({length:end-start+1},(_,i)=>[book,start+i])));
  const expected=allBooks.flatMap((book,index)=>Array.from({length:book.chapters},(_,i)=>[index,i+1]));
  assert.deepEqual(actual,expected);
  assert.equal(Object.keys(CHURCH_SCHEDULE).length,203);
  assert.equal(actual.length,1189);
});
test('today, approved corrections, and multi-book assignments match church PDF',()=>{
  assert.deepEqual(CHURCH_SCHEDULE['2026-09-07'],[[0,1,6]]);
  assert.deepEqual(CHURCH_SCHEDULE['2026-09-25'],[[1,33,36]]);
  assert.equal(CHURCH_SCHEDULE['2027-04-21'][0][0],52);
  assert.deepEqual(CHURCH_SCHEDULE['2026-09-17'],[[0,48,50],[1,1,3]]);
  assert.equal(chapterCount(CHURCH_SCHEDULE['2026-09-17']),6);
});
test('week uses Sunday through Saturday across month, year, and DST boundaries',()=>{
  for(const [date,start,end] of [['2026-09-06','2026-09-06','2026-09-12'],['2027-01-01','2026-12-27','2027-01-02'],['2026-11-01','2026-11-01','2026-11-07'],['2027-03-14','2027-03-14','2027-03-20']]){
    const week=weekFor(date);
    assert.equal(week.length,7); assert.equal(week[0].date,start); assert.equal(week[6].date,end);
    assert.equal(new Set(week.map(d=>d.date)).size,7);
  }
});
test('rest days, before start, after end, and local calendar dates',()=>{
  assert.equal(CHURCH_SCHEDULE['2026-09-13'],undefined);
  assert.equal(nextReading('2026-09-06').date,'2026-09-07');
  assert.equal(nextReading('2026-09-13').date,'2026-09-14');
  assert.equal(nextReading('2027-04-30'),null);
  assert.equal(nextReading('2027-05-01'),null);
  assert.equal(dateKey(new Date(2026,8,7,0,1)),'2026-09-07');
});
