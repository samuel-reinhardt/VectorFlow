'use client';

import { ReactNode, useMemo, useEffect } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';
import { consumeAuthHandover } from '@/firebase/auth/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    // Consume any handover cookie present from the OAuth redirect flow
    consumeAuthHandover().catch(console.error);
  }, []);

  return (
    <FirebaseProvider value={firebaseServices}>
      {children}
    </FirebaseProvider>
  );
}
