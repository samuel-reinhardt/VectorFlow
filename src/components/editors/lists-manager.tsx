'use client';

import * as React from 'react';
import { Plus, Trash2, List as ListIcon, Edit2, Search } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { ListDefinition, SelectOption } from '@/types';
import { SelectOptionEditor } from './select-option-editor';
import { cn } from '@/lib/utils';

interface ListsManagerProps {
  lists: ListDefinition[];
  onChange: (lists: ListDefinition[]) => void;
  palette: string[];
}

export function ListsManager({ lists, onChange, palette }: ListsManagerProps) {
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedList = lists.find(l => l.id === selectedListId);

  const addList = () => {
    const newList: ListDefinition = {
      id: crypto.randomUUID(),
      name: 'New List',
      items: []
    };
    onChange([...lists, newList]);
    setSelectedListId(newList.id);
  };

  const updateList = (id: string, updates: Partial<ListDefinition>) => {
    onChange(lists.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteList = (id: string) => {
    onChange(lists.filter(l => l.id !== id));
    if (selectedListId === id) {
      setSelectedListId(null);
    }
  };

  const handleUpdateItems = (items: SelectOption[]) => {
    if (selectedListId) {
      updateList(selectedListId, { items });
    }
  };

  const filteredLists = lists.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full border-t">
      {/* Sidebar List */}
      <div className="w-56 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b space-y-3">
             <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search lists..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                />
            </div>
          <Button onClick={addList} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> New List
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredLists.map(list => (
            <div 
              key={list.id}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md text-sm cursor-pointer hover:bg-muted transition-colors",
                selectedListId === list.id ? "bg-muted font-medium" : "text-muted-foreground"
              )}
              onClick={() => setSelectedListId(list.id)}
            >
              <div className="flex items-center gap-2 truncate">
                <ListIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{list.name}</span>
              </div>
            </div>
          ))}
          {filteredLists.length === 0 && (
             <div className="text-center py-8 text-xs text-muted-foreground">
                {lists.length === 0 ? "No lists created." : "No matching lists."}
             </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedList ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>List Name</Label>
                  <Input 
                    value={selectedList.name} 
                    onChange={(e) => updateList(selectedList.id, { name: e.target.value })}
                    className="font-medium text-lg h-10 w-full md:w-[300px]"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteList(selectedList.id)}
                  title="Delete List"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage options for this list. These options can be reused across multiple Select, Multi-Select, Radio, or Checkbox fields.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <SelectOptionEditor 
                options={selectedList.items} 
                onChange={handleUpdateItems}
                palette={palette}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <ListIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a list to edit or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
