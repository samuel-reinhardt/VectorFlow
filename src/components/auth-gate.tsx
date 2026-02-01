'use client';

import { useEffect, ReactNode } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Orbit } from 'lucide-react';

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
        <div className="flex flex-col gap-4 items-center justify-center h-screen bg-background">
            <Orbit className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Initializing...</p>
        </div>
    );
  }
  
  return <>{children}</>;
}
