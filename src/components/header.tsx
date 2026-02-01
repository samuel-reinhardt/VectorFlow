'use client';

import { Orbit } from 'lucide-react';
import { UserProfile } from './user-profile';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border shadow-sm z-10 bg-card shrink-0">
      <div className="flex items-center gap-3">
        <Orbit className="text-primary h-8 w-8" />
        <h1 className="text-2xl font-headline font-bold">VectorFlow</h1>
      </div>
      <UserProfile />
    </header>
  );
}
