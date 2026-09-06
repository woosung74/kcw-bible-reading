import React, { useEffect, useState } from 'react';
import { createBackup, restoreBackup, validateBackup } from './backupData.js';
import { localDay } from './journalData.js';

const COPY = {
  ko: {
    title: '글자 크기 · 기록 백업', size: '글자 크기', sizes: ['기본', '크게', '아주 크게'],
    backup: '기록 백업 저장', restore: '백업 복원',
    help: '통독 진도, 완독 횟수, 날짜 기록, 말씀 메모와 한 줄 감사를 함께 백업합니다. 같은 언어 버전에서 복원할 수 있습니다. 예전 백업에는 메모가 없으므로 복원 시 현재 메모를 유지합니다.',
    confirm: '통독 기록, 말씀 메모, 한 줄 감사를 이 백업의 내용으로 바꿀까요? 먼저 현재 기록을 백업해 주세요.',
    legacy: '통독 기록을 이 백업의 내용으로 바꿀까요? 예전 백업에 없는 말씀 메모와 한 줄 감사는 그대로 유지합니다. 먼저 현재 기록을 백업해 주세요.',
    restored: '복원했습니다. 앱을 새로 여는 중입니다.', downloaded: '메모와 감사가 포함된 백업 파일 다운로드를 시작했습니다.',
    error: '복원하지 못했습니다. 같은 언어 버전의 올바른 백업인지, 기기 저장 공간이 충분한지 확인하세요.',
    backupError: '백업하지 못했습니다. 저장된 기록을 확인하고 다시 시도해 주세요.',
  },
  en: {
    title: 'Text size · Backup', size: 'Text size', sizes: ['Normal', 'Large', 'Extra large'],
    backup: 'Download backup', restore: 'Restore backup',
    help: 'Back up reading progress, completed rounds, date history, Scripture Notes and One-Line Gratitude together. Restore in the same language version. Older backups preserve your current notes and gratitude.',
    confirm: 'Replace reading progress, Scripture Notes and Gratitude with this backup? Back up your current records first.',
    legacy: 'Replace reading progress with this older backup? Your current notes and gratitude will be preserved. Back up your current records first.',
    restored: 'Restored. Reloading the app.', downloaded: 'Your backup download, including notes and gratitude, has started.',
    error: 'Could not restore. Check that this is a valid backup from the same language version and that the device has enough storage.',
    backupError: 'Could not create a backup. Check your saved records and try again.',
  },
};

export default function Preferences({ language, keys, journalKey, journal, allBooks }) {
  const t = COPY[language];
  const fontKey = keys[0] + '-font';
  const [size, setSize] = useState(() => {
    try { const value = localStorage.getItem(fontKey); return ['normal', 'large', 'xlarge'].includes(value) ? value : 'normal'; }
    catch { return 'normal'; }
  });
  const [message, setMessage] = useState('');
  useEffect(() => {
    document.documentElement.dataset.font = size;
    try { localStorage.setItem(fontKey, size); } catch { /* Font size still works for this session. */ }
  }, [fontKey, size]);
  const backup = () => {
    try {
      if (journal.status === 'load-error') throw new Error('Unreadable journal');
      // Include in-memory notes too, so a storage-quota error does not prevent a file backup.
      const data = createBackup(localStorage, keys, language, journal.entries);
      validateBackup(data, language, allBooks);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `kcw-bible-${language}-${localDay()}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(t.downloaded);
    } catch { setMessage(t.backupError); }
  };
  const restore = async event => {
    const input = event.target;
    try {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 10000000) throw new Error('Backup too large');
      const data = validateBackup(JSON.parse(await file.text()), language, allBooks);
      if (!confirm(data.journal === undefined ? t.legacy : t.confirm)) return;
      restoreBackup(localStorage, keys, journalKey, data);
      setMessage(t.restored);
      location.reload();
    } catch { setMessage(t.error); }
    finally { input.value = ''; }
  };
  return <details className="preferences"><summary>{t.title}</summary>
    <label>{t.size}<select value={size} onChange={e => setSize(e.target.value)}>{['normal', 'large', 'xlarge'].map((value, i) => <option key={value} value={value}>{t.sizes[i]}</option>)}</select></label>
    <button type="button" onClick={backup}>{t.backup}</button>
    <label>{t.restore}<input type="file" accept=".json,application/json" onChange={restore} /></label>
    <p>{t.help}</p><p role="status">{message}</p>
  </details>;
}
