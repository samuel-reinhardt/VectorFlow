'use client';

import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name?: string;
  fallback: React.ComponentType<LucideProps>;
}

export function DynamicIcon({ name, fallback: Fallback, ...props }: DynamicIconProps) {
  if (!name) return <Fallback {...props} />;

  // Lucide icons are PascalCase in the export
  const iconName = name.charAt(0).toUpperCase() + name.slice(1);
  const IconComponent = (Icons as any)[iconName] || (Icons as any)[name];

  if (!IconComponent) {
    return <Fallback {...props} />;
  }

  return <IconComponent {...props} />;
}
