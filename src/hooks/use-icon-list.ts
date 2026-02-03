import * as React from 'react';
import * as Icons from 'lucide-react';

export function useIconList() {
  const iconNames = React.useMemo(() => {
    const filters = ['lucide', 'createLucideIcon', 'Icon'];
    const allExports = Object.keys(Icons);
    const exportSet = new Set(allExports);
    
    return allExports.filter(
      (name) => 
        // Likely an icon if it starts with uppercase and is a component
        /^[A-Z]/.test(name) && 
        !filters.includes(name) &&
        (typeof (Icons as any)[name] === 'function' || (Icons as any)[name]?.render) &&
        // Deduplicate: If name ends with "Icon" and the base name exists, skip it
        !(name.endsWith('Icon') && exportSet.has(name.slice(0, -4))) &&
        // Deduplicate: If name starts with "Lucide" and the base name exists, skip it
        !(name.startsWith('Lucide') && exportSet.has(name.slice(6)))
    );
  }, []);

  return iconNames;
}
