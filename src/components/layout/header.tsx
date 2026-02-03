'use client';

import { Orbit, Pencil } from 'lucide-react';
import { UserProfile } from './user-profile';
import { useState } from 'react';

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
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="flex items-center gap-3 pr-6 border-r border-border/50">
          <Orbit className="text-primary h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold hidden sm:block">VectorFlow</h1>
        </div>
        
        {onNameChange ? (
          <div className="flex items-center gap-2 group flex-1 min-w-0">
             {isEditing && !isReadOnly ? (
                <input
                  type="text"
                  value={projectName || ''}
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditing(false);
                       e.currentTarget.blur();
                    }
                  }}
                  autoFocus
                  style={{ width: `${Math.max((projectName || '').length, 12) + 1}ch` }}
                  className="text-lg font-semibold bg-background border border-primary/20 rounded px-2 py-1 max-w-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-ellipsis"
                  placeholder="Untitled Project"
                />
             ) : (
                <div 
                  className={`text-lg font-semibold px-2 py-1 rounded truncate cursor-pointer select-none transition-colors border border-transparent flex-1 min-w-0 flex items-center gap-2 group/edit`}
                  onClick={() => !isReadOnly && setIsEditing(true)}
                  title={projectName || 'Untitled Project'}
                >
                  <span className="truncate">{projectName || 'Untitled Project'}</span>
                  {!isReadOnly && (
                    <Pencil 
                      size={14} 
                      className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-muted-foreground shrink-0" 
                    />
                  )}
                </div>
             )}
          </div>
        ) : (
          <span className="text-lg font-semibold px-2 truncate flex-1 min-w-0" title={projectName || 'VectorFlow Workspace'}>{projectName || 'VectorFlow Workspace'}</span>
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
