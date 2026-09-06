import { useEffect, useRef, useState } from 'react';
import { updateJournal, validateJournal } from './journalData.js';

export function useJournal(storageKey) {
  const [initial] = useState(() => {
    try { return { entries: validateJournal(JSON.parse(localStorage.getItem(storageKey) || '{}')), blocked: false }; }
    catch { return { entries: {}, blocked: true }; }
  });
  const [entries, setEntries] = useState(initial.entries);
  const current = useRef(initial.entries);
  const [status, setStatus] = useState(initial.blocked ? 'load-error' : 'ready');
  const pending = useRef(false);
  const persist = next => {
    current.current = next;
    setEntries(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      pending.current = false;
      setStatus('saved');
      return true;
    } catch {
      pending.current = true;
      setStatus('save-error');
      return false;
    }
  };
  useEffect(() => {
    const guard = event => { if (pending.current) { event.preventDefault(); event.returnValue = ''; } };
    const sync = event => {
      if (event.key !== storageKey || pending.current) return;
      try {
        const next = validateJournal(JSON.parse(event.newValue || '{}'));
        current.current = next;
        setEntries(next);
        setStatus('ready');
      } catch { setStatus('load-error'); }
    };
    window.addEventListener('beforeunload', guard);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('beforeunload', guard); window.removeEventListener('storage', sync); };
  }, [storageKey]);
  return {
    entries, status,
    update: (date, patch) => {
      if (status === 'load-error') return;
      persist(updateJournal(current.current, date, patch));
    },
    remove: date => {
      if (status === 'load-error') return;
      const next = { ...current.current };
      delete next[date];
      persist(next);
    },
    retry: () => persist(current.current),
  };
}
