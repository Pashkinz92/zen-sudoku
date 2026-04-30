import { useEffect, useState } from 'react';

export type OfflineState = 'unsupported' | 'pending' | 'ready' | 'updated';

export interface OfflineStatus {
  state: OfflineState;
  isPersistent: boolean;
  isOnline: boolean;
  cacheSizeMB: number | null;
}

declare global {
  interface Window {
    __offlineState?: OfflineState;
  }
}

async function readQuota(): Promise<number | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  try {
    const est = await navigator.storage.estimate();
    return est.usage ? Math.round((est.usage / 1024 / 1024) * 10) / 10 : null;
  } catch {
    return null;
  }
}

export function useOfflineStatus(): OfflineStatus {
  const [state, setState] = useState<OfflineState>(
    () => window.__offlineState ?? (('serviceWorker' in navigator) ? 'pending' : 'unsupported'),
  );
  const [isPersistent, setIsPersistent] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheSizeMB, setCacheSizeMB] = useState<number | null>(null);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<OfflineState>).detail;
      setState(detail);
      readQuota().then(setCacheSizeMB);
    };
    window.addEventListener('pwa:state', onChange);
    return () => window.removeEventListener('pwa:state', onChange);
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return;
    navigator.storage.persisted().then(setIsPersistent);
    readQuota().then(setCacheSizeMB);
  }, []);

  return { state, isPersistent, isOnline, cacheSizeMB };
}

/** Try to upgrade to persistent storage; safe to call repeatedly. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
