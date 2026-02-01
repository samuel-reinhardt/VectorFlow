'use client';

import { ReactNode, useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider value={firebaseServices}>
      {children}
    </FirebaseProvider>
  );
}
