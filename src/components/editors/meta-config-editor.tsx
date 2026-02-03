import * as React from 'react';
import { Plus, Trash2, Settings2, X, Grip, LayoutTemplate, Palette, Search, List as ListIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlay/dialog';
import type { FieldDefinition, MetaConfig, FieldType } from '@/types';
import { SelectOptionEditor } from '@/components/editors/select-option-editor';
import { NumberConfigEditor } from '@/components/editors/number-config-editor';
import { normalizeOptions } from '@/lib/metadata-utils';
import { VisualRulesEditor } from './visual-rules-editor';
import { ListsManager } from './lists-manager';
import { ListDefinition } from '@/types';
import { cn } from '@/lib/utils';

interface MetaConfigEditorProps {
  config: MetaConfig;
  onUpdate: (type: keyof MetaConfig, value: any) => void;
}

export function MetaConfigEditor({ config, onUpdate }: MetaConfigEditorProps) {
  const [activeSection, setActiveSection] = React.useState<'structure' | 'visuals' | 'lists'>('structure');
  const [activeFieldId, setActiveFieldId] = React.useState<string | null>(null); // For collapsible sections
  const [searchQuery, setSearchQuery] = React.useState('');
  const [targetFilter, setTargetFilter] = React.useState<UnifiedTarget | 'all'>('all');

  // Virtual Schema Logic: Unify fields across scopes
  const getUnifiedFields = (config: MetaConfig) => {
    const unified = new Map<string, FieldDefinition & { targets: ('step' | 'deliverable' | 'group' | 'edge')[] }>();
    
    (['step', 'deliverable', 'group', 'edge'] as const).forEach(scope => {
        const fields = (config[scope] as FieldDefinition[]) || [];
        fields.forEach(f => {
            if (!f) return;
            if (!unified.has(f.id)) {
                unified.set(f.id, { ...f, targets: [scope] });
            } else {
                const existing = unified.get(f.id)!;
                if (!existing.targets.includes(scope)) existing.targets.push(scope);
            }
        });
    });

    return Array.from(unified.values());
  };

  const addUnifiedField = () => {
      const newField: FieldDefinition = {
          id: `field_${Date.now()}`,
          label: 'New Field',
          type: 'text'
      };
      
      // Default to 'step' target
      onUpdate('step', [...(config.step || []), newField]);
  };

  type UnifiedTarget = 'step' | 'deliverable' | 'group' | 'edge';

  const updateUnifiedField = (
      field: FieldDefinition & { targets: UnifiedTarget[] }, 
      updates: Partial<FieldDefinition> & { targets?: UnifiedTarget[] }
  ) => {
      const newTargets = updates.targets || field.targets;
      const newFieldDef: FieldDefinition = {
          id: field.id,
          label: updates.label ?? field.label,
          type: updates.type ?? field.type,
          options: updates.options ?? field.options,
          numberConfig: updates.numberConfig ?? field.numberConfig,
          optionsSource: updates.optionsSource ?? field.optionsSource,
          listId: updates.listId ?? field.listId,
      };

      (['step', 'deliverable', 'group', 'edge'] as const).forEach(scope => {
          const shouldHave = newTargets.includes(scope);
          const currentList = (config[scope] as FieldDefinition[]) || [];
          const exists = currentList.find(f => f && f.id === field.id);

          if (shouldHave) {
              if (exists) {
                  onUpdate(scope, currentList.map(f => (f && f.id === field.id) ? newFieldDef : f));
              } else {
                  onUpdate(scope, [...currentList, newFieldDef]);
              }
          } else {
              if (exists) {
                  onUpdate(scope, currentList.filter(f => f && f.id !== field.id));
              }
          }
      });
  };

  const deleteUnifiedField = (id: string) => {
       (['step', 'deliverable', 'group', 'edge'] as const).forEach(scope => {
           const currentList = (config[scope] as FieldDefinition[]) || [];
           if (currentList.find(f => f && f.id === id)) {
               onUpdate(scope, currentList.filter(f => f && f.id !== id));
           }
       });
  };

  const isNumberType = (type: FieldType) => 
    ['number', 'hours', 'currency', 'slider'].includes(type);

  const isSelectType = (type: FieldType) => 
    ['select', 'multi-select'].includes(type);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          title="Project Settings" 
          size="sm" 
          className="h-8 px-3 gap-2"
          >
          <Settings2 className="h-4 w-4" />
          <span className="text-xs font-medium">Project Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Configure project structure and visual rules (colors, icons, auto-styling).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden h-full">
            {/* Sidebar Navigation */}
            <div className="w-48 border-r bg-muted/10 p-2 space-y-1 shrink-0">
                <Button 
                    variant={activeSection === 'structure' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2 h-9" 
                    onClick={() => setActiveSection('structure')}
                >
                    <LayoutTemplate className="w-4 h-4" /> Structure
                </Button>
                <Button 
                    variant={activeSection === 'visuals' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2 h-9" 
                    onClick={() => setActiveSection('visuals')}
                >
                    <Palette className="w-4 h-4" /> Visual Rules
                </Button>
                <Button 
                    variant={activeSection === 'lists' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2 h-9" 
                    onClick={() => setActiveSection('lists')}
                >
                    <ListIcon className="w-4 h-4" /> Lists
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
                {activeSection === 'structure' ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="px-6 py-4 border-b bg-muted/5">
                            <h3 className="text-sm font-medium mb-1">Custom Fields</h3>
                            <p className="text-xs text-muted-foreground">Define fields and assign them to one or multiple entity types.</p>
                        </div>
              
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Search and Filters */}
                            <div className="space-y-3 mb-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search fields..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button 
                                        variant={targetFilter === 'all' ? 'secondary' : 'outline'} 
                                        size="sm" 
                                        className="h-7 text-xs"
                                        onClick={() => setTargetFilter('all')}
                                    >
                                        All
                                    </Button>
                                    {(['step', 'deliverable', 'group', 'edge'] as const).map(t => (
                                        <Button
                                            key={t}
                                            variant={targetFilter === t ? 'secondary' : 'outline'}
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setTargetFilter(t)}
                                        >
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {getUnifiedFields(config)
                                .filter(f => {
                                    const matchesSearch = f.label.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesFilter = targetFilter === 'all' || f.targets.includes(targetFilter);
                                    return matchesSearch && matchesFilter;
                                })
                                .map((field) => (
                                <div key={field.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="grid flex-1 gap-4 sm:grid-cols-12">
                                            {/* Label - spans 4 cols */}
                                            <div className="sm:col-span-4 space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Label</Label>
                                                <Input 
                                                    value={field.label} 
                                                    onChange={(e) => updateUnifiedField(field, { label: e.target.value })}
                                                />
                                            </div>

                                            {/* Type - spans 3 cols */}
                                            <div className="sm:col-span-3 space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Type</Label>
                                                <Select 
                                                    value={field.type} 
                                                    onValueChange={(val: FieldType) => {
                                                        const updates: Partial<FieldDefinition> = { type: val };
                                                        if (!['number', 'hours', 'currency', 'slider'].includes(val)) updates.numberConfig = undefined;
                                                        if (!['select', 'multi-select'].includes(val)) updates.options = undefined;
                                                        updateUnifiedField(field, updates);
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Text</SelectItem>
                                                        <SelectItem value="long-text">Long Text</SelectItem>
                                                        <SelectItem value="date">Date</SelectItem>
                                                        <SelectItem value="number">Number</SelectItem>
                                                        <SelectItem value="hours">Hours</SelectItem>
                                                        <SelectItem value="currency">Currency</SelectItem>
                                                        <SelectItem value="slider">Slider</SelectItem>
                                                        <SelectItem value="select">Select</SelectItem>
                                                        <SelectItem value="multi-select">Multi-Select</SelectItem>
                                                        <SelectItem value="checkbox-group">Checkbox Group</SelectItem>
                                                        <SelectItem value="radio">Radio Group</SelectItem>
                                                        <SelectItem value="toggle">Toggle</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Targets - spans 5 cols */}
                                            <div className="sm:col-span-5 space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Applies To</Label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(['step', 'deliverable', 'group', 'edge'] as const).map(target => {
                                                        const isActive = field.targets.includes(target);
                                                        return (
                                                            <button
                                                                key={target}
                                                                onClick={() => {
                                                                    if (isActive && field.targets.length === 1) return; // Prevent deselecting last

                                                                    const newTargets = isActive 
                                                                        ? field.targets.filter(t => t !== target)
                                                                        : [...field.targets, target];
                                                                    updateUnifiedField(field, { targets: newTargets });
                                                                }}
                                                                className={`
                                                                    px-2 py-1 text-[10px] rounded border transition-colors
                                                                    ${isActive 
                                                                        ? 'bg-primary text-primary-foreground border-primary' 
                                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'}
                                                                    ${isActive && field.targets.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                                                                `}
                                                                title={isActive && field.targets.length === 1 ? "Cannot deselect text target (delete field instead)" : ""}
                                                            >
                                                                {target.charAt(0).toUpperCase() + target.slice(1)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-muted-foreground hover:text-destructive mt-6 h-8 w-8"
                                            onClick={() => deleteUnifiedField(field.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                
                                    {['select', 'multi-select', 'checkbox-group', 'radio'].includes(field.type) && (
                                        <div className="bg-muted/30 p-3 rounded-md space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold">Options Configuration</Label>
                                                <div className="flex bg-muted rounded p-0.5">
                                                    <button 
                                                        className={cn("text-[10px] px-2 py-0.5 rounded", !field.optionsSource || field.optionsSource === 'manual' ? "bg-background shadow-sm" : "")}
                                                        onClick={() => updateUnifiedField(field, { optionsSource: 'manual' })}
                                                    >
                                                        Manual
                                                    </button>
                                                    <button 
                                                        className={cn("text-[10px] px-2 py-0.5 rounded", field.optionsSource === 'list' ? "bg-background shadow-sm" : "")}
                                                        onClick={() => updateUnifiedField(field, { optionsSource: 'list' })}
                                                    >
                                                        From List
                                                    </button>
                                                </div>
                                            </div>

                                            {(!field.optionsSource || field.optionsSource === 'manual') ? (
                                                <SelectOptionEditor
                                                    options={normalizeOptions(field.options)}
                                                    onChange={(options) => updateUnifiedField(field, { options })}
                                                    palette={config.visualRules?.palette || []}
                                                />
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Select List</Label>
                                                    <Select 
                                                        value={field.listId || ''} 
                                                        onValueChange={(val) => updateUnifiedField(field, { listId: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a list..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(config.lists || []).map(list => (
                                                                <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(config.lists || []).length === 0 && (
                                                        <p className="text-[10px] text-destructive">No lists available. Create one in the "Lists" tab.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Advanced Configuration Collapsible - for Number/Slider types */}
                                    {['number', 'hours', 'currency', 'slider'].includes(field.type) && (
                                        <div className="border rounded-md">
                                            <button 
                                                className="flex items-center justify-between w-full p-2 text-xs font-medium hover:bg-muted/50 text-left"
                                                onClick={() => setActiveFieldId(activeFieldId === field.id ? null : field.id)}
                                            >
                                                <span>Advanced Configuration</span>
                                                {activeFieldId === field.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            </button>
                                            
                                            {activeFieldId === field.id && (
                                                <div className="p-3 border-t bg-muted/30">
                                                    <NumberConfigEditor
                                                        config={field.numberConfig}
                                                        onChange={(config) => updateUnifiedField(field, { numberConfig: config })}
                                                        fieldType={field.type as any}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {getUnifiedFields(config).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p className="text-sm">No custom fields defined.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Add a field to track extra data on your items.</p>
                                </div>
                            )}
                            
                            <Button onClick={addUnifiedField} variant="outline" className="w-full border-dashed">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Field
                            </Button>
                        </div>
                    </div>
                ) : activeSection === 'visuals' ? (
                    <div className="flex-1 p-6 overflow-hidden">
                        <VisualRulesEditor 
                            rules={config.visualRules || { palette: [], icons: [], autoStyle: [] }} 
                            metaConfig={config}
                            onChange={(newRules) => onUpdate('visualRules', newRules)} 
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <ListsManager 
                            lists={config.lists || []}
                            onChange={(lists) => onUpdate('lists', lists)}
                            palette={config.visualRules?.palette || []}
                        />
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
