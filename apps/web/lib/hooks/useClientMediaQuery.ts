"use client"

import { useSyncExternalStore } from 'react';

export function useClientMediaQuery(query : string) {
  const matches = useSyncExternalStore(
    (onStoreChange) => {
      const mediaQueryList = window.matchMedia(query);
      const handleMatchChange = () => onStoreChange();
      mediaQueryList.addEventListener('change', handleMatchChange);
      return () => mediaQueryList.removeEventListener('change', handleMatchChange);
    },
    () => window.matchMedia(query).matches,
    () => null
  );

  return matches;
}