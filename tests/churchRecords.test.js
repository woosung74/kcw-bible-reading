import test from 'node:test';
import assert from 'node:assert/strict';
import {writeChurchRecord,readChurchRecords,churchRecordKey,churchProgress,validateChurchRecords} from '../src/churchRecords.js';
import {createBackup,validateBackup,restoreBackup} from '../src/backupData.js';
import {allBooks} from '../src/bibleData.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
test('check, persist, edit actual date, uncheck; unrelated keys untouched',()=>{
 const s=storage();s.setItem('personal','keep');s.setItem('journal','keep');
 let r=writeChurchRecord(s,'ko','2026-09-07','2026-09-08');
 assert.deepEqual(churchProgress(r),{days:1,chapters:6,percent:0.5});
 assert.equal(readChurchRecords(s,'ko')['2026-09-07'].readOn,'2026-09-08');
 r=writeChurchRecord(s,'ko','2026-09-07','2026-09-07');
 assert.equal(churchProgress(r).days,1);
 assert.deepEqual(writeChurchRecord(s,'ko','2026-09-07',null),{});
 assert.equal(s.getItem('personal'),'keep');assert.equal(s.getItem('journal'),'keep');
});
test('reject unassigned dates and malformed data without overwriting',()=>{
 const s=storage();
 assert.throws(()=>writeChurchRecord(s,'ko','2026-09-06','2026-09-07'));
 assert.throws(()=>validateChurchRecords({'2026-09-07':{readOn:'2026-02-30',updatedAt:'bad'}}));
 s.setItem(churchRecordKey('ko'),'broken');
 assert.throws(()=>writeChurchRecord(s,'ko','2026-09-07','2026-09-07'));
 assert.equal(s.getItem(churchRecordKey('ko')),'broken');
});
test('v3 backup round trip and v2 preserves separate church records',()=>{
 const s=storage(),keys=['p','d','r','a','h'];
 const r=writeChurchRecord(s,'ko','2026-09-07','2026-09-08');
 const b=createBackup(s,keys,'ko',{},r);
 assert.equal(b.version,3);
 const target=storage();
 restoreBackup(target,keys,'j',validateBackup(b,'ko',allBooks),churchRecordKey('ko'));
 assert.deepEqual(readChurchRecords(target,'ko'),r);
 const older=createBackup(s,keys,'ko',{});
 restoreBackup(target,keys,'j',validateBackup(older,'ko',allBooks),churchRecordKey('ko'));
 assert.deepEqual(readChurchRecords(target,'ko'),r);
 assert.throws(()=>validateBackup({...b,churchRecords:null},'ko',allBooks));
});
test('failed church write rolls back the other restored records',()=>{
 const s=storage(),keys=['p','d','r','a','h']; s.setItem('p','old');
 const original=s.setItem; s.setItem=(k,v)=>{if(k===churchRecordKey('ko'))throw Error('quota');original(k,v);};
 const backup={values:['[]','{}','0','false','[]'],journal:[],churchRecords:{}};
 assert.throws(()=>restoreBackup(s,keys,'j',backup,churchRecordKey('ko')));
 assert.equal(s.getItem('p'),'old');assert.equal(s.getItem('j'),null);
});
