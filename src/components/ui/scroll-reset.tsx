'use client';

import { useEffect } from 'react';

export function ScrollReset() {
  useEffect(() => {
    // Reset scroll position to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return null;
}
