'use client';

import * as React from 'react';
import * as Icons from 'lucide-react';
import { Search, ChevronDown, Check, Square } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlay/popover';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { ScrollArea } from '@/components/ui/layout/scroll-area';
import { cn } from '@/lib/utils';
import { DynamicIcon } from './dynamic-icon';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  fallbackIcon?: React.ComponentType<any>;
}

// Error Boundary to catch render errors for specific icons
class SafeIcon extends React.Component<{ icon: any, name: string, className?: string }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error(`Failed to render icon: ${this.props.name}`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="w-4 h-4 text-destructive flex items-center justify-center" title="Icon failed to load">!</div>;
        }

        const { icon: Icon, className } = this.props;
        
        // Safety check if Icon is not a valid component type
        if (!Icon) return null;

        return <Icon className={className} />;
    }
}

export function IconPicker({ value, onChange, fallbackIcon: Fallback = Square }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Get all icon names from Lucide
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

  const filteredIcons = React.useMemo(() => {
    const searchLower = search.toLowerCase();
    if (!searchLower) return iconNames.slice(0, 50); // Show top 50 by default
    return iconNames
      .filter((name) => name.toLowerCase().includes(searchLower))
      .slice(0, 100); // Limit results for performance
  }, [search, iconNames]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 px-3 font-normal"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <DynamicIcon name={value} fallback={Fallback} className="w-4 h-4 shrink-0" />
            <span className="truncate">{value || 'Default Icon'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex flex-col h-[350px]">
          <div className="p-3 border-b flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-none focus-visible:ring-0 p-0 text-sm"
              autoFocus
            />
          </div>
          <ScrollArea className="flex-1 p-2">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-4 gap-1">
                {filteredIcons.map((name) => {
                  const Icon = (Icons as any)[name];
                  const isSelected = value === name;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                        setSearch('');
                      }}
                      title={name}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-md transition-colors hover:bg-muted relative group h-[60px]",
                        isSelected && "bg-primary/10 ring-1 ring-primary/30"
                      )}
                    >
                      <SafeIcon icon={Icon} name={name} className={cn(
                        "w-5 h-5 mb-1",
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className="text-[9px] truncate w-full text-center text-muted-foreground px-1">
                        {name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {filteredIcons.length < iconNames.length && (
                  <div className="col-span-4 py-2 mt-2 border-t text-[10px] text-center text-muted-foreground italic">
                    Showing top results. Search to find more icons.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No icons found.
              </div>
            )}
          </ScrollArea>
          {search === '' && (
              <div className="p-2 border-t bg-muted/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs h-8"
                    onClick={() => {
                        onChange('');
                        setOpen(false);
                    }}
                  >
                      Reset to Default
                  </Button>
              </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
