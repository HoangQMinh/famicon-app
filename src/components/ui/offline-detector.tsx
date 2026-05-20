'use client';
import { useEffect } from 'react';

export function OfflineDetector() {
  useEffect(() => {
    function handleOffline() {
      window.location.href = '/offline.html';
    }
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);
  return null;
}
