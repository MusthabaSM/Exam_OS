'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';

export function CapacitorHardwareBackButton() {
  const router = useRouter();

  useEffect(() => {
    // Check if we are running in Capacitor before adding the listener
    // This safely handles SSR and standard web browser usage
    if (typeof window !== 'undefined') {
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            router.back();
          } else {
            // If already at the root, allow normal app exit behavior
            App.exitApp();
          }
        });
      }
    }

    return () => {
      if (typeof window !== 'undefined' && !!(window as any).Capacitor) {
        App.removeAllListeners();
      }
    };
  }, [router]);

  return null;
}
