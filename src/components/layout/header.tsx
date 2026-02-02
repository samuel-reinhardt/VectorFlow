'use client';

import { Orbit } from 'lucide-react';
import { UserProfile } from './user-profile';
import { useState } from 'react'; // Added useState import

// Assuming HeaderProps is defined elsewhere or will be defined.
// For now, I'll define it based on the original inline type and the new isReadOnly prop.
interface HeaderProps {
  projectName?: string;
  onNameChange?: (name: string) => void;
  syncIndicator?: React.ReactNode;
  isReadOnly?: boolean;
  children?: React.ReactNode;
}

export function Header({ 
  projectName, 
  onNameChange,
  syncIndicator,
  children,
  isReadOnly = false // Added isReadOnly with default value
}: HeaderProps) { // Changed to HeaderProps type
  const [isEditing, setIsEditing] = useState(false); // Added state
  const [tempName, setTempName] = useState(projectName); // Added state

  return (
    <header className="flex items-center justify-between p-4 border-b border-border shadow-sm z-10 bg-card shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-border/50">
          <Orbit className="text-primary h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold hidden sm:block">VectorFlow</h1>
        </div>
        
        {onNameChange ? (
          <div className="flex items-center gap-2 group max-w-[200px] sm:max-w-[400px]">
            <input
              type="text"
              value={projectName || 'Untitled Project'}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={isReadOnly}
              className="text-lg font-semibold bg-transparent border-none focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 w-full hover:bg-muted/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              placeholder="Project Name"
            />
          </div>
        ) : (
          <span className="text-lg font-semibold px-2">{projectName || 'VectorFlow Workspace'}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {syncIndicator}
        <UserProfile />
      </div>
    </header>
  );
}
