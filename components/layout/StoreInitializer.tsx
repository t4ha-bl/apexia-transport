'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store/dataStore';

export function StoreInitializer() {
  const initializeStore = useStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return null;
}
