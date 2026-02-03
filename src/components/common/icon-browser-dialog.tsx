import * as React from 'react';
import * as Icons from 'lucide-react';
import { Search, ChevronDown, Check, Square, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { ScrollArea } from '@/components/ui/layout/scroll-area';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/common/dynamic-icon';

import { useIconList } from '@/hooks/use-icon-list';

interface IconBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (iconName: string) => void;
  title?: string;
  description?: string;
}

export function IconBrowserDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  title = "Select Icon"
}: IconBrowserDialogProps) {
  const [search, setSearch] = React.useState('');
  const iconNames = useIconList();

  const filteredIcons = React.useMemo(() => {
    const searchLower = search.toLowerCase();
    if (!searchLower) return iconNames.slice(0, 100);
    return iconNames
      .filter((name) => name.toLowerCase().includes(searchLower))
      .slice(0, 200);
  }, [search, iconNames]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[70vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border-b bg-muted/10 shrink-0">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                    placeholder="Search icons..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                />
             </div>
        </div>

        <ScrollArea className="flex-1 p-4">
            {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {filteredIcons.map(name => {
                         const Icon = (Icons as any)[name];
                         if (!Icon) return null;
                         
                         return (
                             <button
                                key={name}
                                onClick={() => {
                                    onSelect(name);
                                    onOpenChange(false);
                                }}
                                className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-muted transition-colors aspect-square border border-transparent hover:border-border"
                                title={name}
                             >
                                 <Icon className="w-6 h-6 mb-2 text-muted-foreground" />
                                 <span className="text-[10px] text-center w-full truncate px-1 opacity-70">
                                    {name}
                                 </span>
                             </button>
                         );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p>No icons found</p>
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
