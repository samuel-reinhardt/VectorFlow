'use client';

import * as React from 'react';
import { Search, ChevronDown, Check, Tag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlay/popover';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { ScrollArea } from '@/components/ui/layout/scroll-area';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { SelectOption } from '@/types';

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  isMulti?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  isMulti = false,
  className
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    const searchLower = search.toLowerCase();
    if (!searchLower) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchLower) || 
      opt.value.toLowerCase().includes(searchLower)
    );
  }, [search, options]);

  const selectedOption = React.useMemo(() => {
    if (isMulti) return null;
    return options.find(opt => opt.value === value) || null;
  }, [options, value, isMulti]);

  const handleSelect = (val: string) => {
    if (isMulti && Array.isArray(value)) {
      if (!value.includes(val)) {
        onChange([...value, val]);
      }
    } else {
      // Single select OR Multi-select used as an "adder" (passing "" as value)
      onChange(val);
    }
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-9 px-3 font-normal", className)}
        >
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            {selectedOption?.icon && <DynamicIcon name={selectedOption.icon} fallback={Tag} className="w-4 h-4 shrink-0" />}
            <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex flex-col h-[300px]">
          <div className="p-2 border-b flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search options..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-none focus-visible:ring-0 p-0 text-sm"
              autoFocus
            />
          </div>
          <ScrollArea className="flex-1 p-1">
            {filteredOptions.length > 0 ? (
              <div className="space-y-0.5">
                {filteredOptions.map((opt, i) => {
                  const isSelected = isMulti 
                    ? (Array.isArray(value) && value.includes(opt.value))
                    : (value === opt.value);
                  
                  return (
                    <button
                      key={`${opt.value}-${i}`}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "flex items-center w-full gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-muted text-left",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        {opt.icon && <DynamicIcon name={opt.icon} fallback={Tag} className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{opt.label}</span>
                        {opt.color && (
                          <div 
                            className="w-2.5 h-2.5 rounded-full border shrink-0" 
                            style={{backgroundColor: opt.color}}
                          />
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No options found.
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
