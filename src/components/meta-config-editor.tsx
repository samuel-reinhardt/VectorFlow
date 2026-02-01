'use client';

import * as React from 'react';
import { Plus, Trash2, Settings2, X, Grip } from 'lucide-react';
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
  DialogFooter,
} from '@/components/ui/overlay/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/layout/tabs';
import { Separator } from '@/components/ui/layout/separator';
import type { FieldDefinition, MetaConfig, FieldType, SelectOption, NumberConfig } from '@/types';
import { SelectOptionEditor } from '@/components/select-option-editor';
import { NumberConfigEditor } from '@/components/number-config-editor';
import { normalizeOptions } from '@/lib/metadata-utils';

interface MetaConfigEditorProps {
  config: MetaConfig;
  onUpdate: (type: keyof MetaConfig, fields: FieldDefinition[]) => void;
}

export function MetaConfigEditor({ config, onUpdate }: MetaConfigEditorProps) {
  const [activeTab, setActiveTab] = React.useState<keyof MetaConfig>('step');

  const addField = () => {
    const newField: FieldDefinition = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
    };
    onUpdate(activeTab, [...config[activeTab], newField]);
  };

  const updateField = (id: string, updates: Partial<FieldDefinition>) => {
    const nextFields = config[activeTab].map(f => 
      f.id === id ? { ...f, ...updates } : f
    );
    onUpdate(activeTab, nextFields);
  };

  const deleteField = (id: string) => {
    onUpdate(activeTab, config[activeTab].filter(f => f.id !== id));
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
          title="Metadata Settings" 
          size="sm" 
          className="h-8 px-3 gap-2"
          >
          <Settings2 className="h-4 w-4" />
          <span className="text-xs font-medium">Metadata</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Metadata Settings</DialogTitle>
          <DialogDescription>
            Define custom fields for your nodes, groups, and deliverables.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="step" className="flex-1 flex flex-col" onValueChange={(v) => setActiveTab(v as any)}>
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="step" className="flex-1">Steps</TabsTrigger>
              <TabsTrigger value="deliverable" className="flex-1">Deliverables</TabsTrigger>
              <TabsTrigger value="group" className="flex-1">Groups</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value={activeTab} className="m-0 space-y-6">
              <div className="space-y-4">
                {config[activeTab].map((field) => (
                  <div key={field.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Label</Label>
                          <Input 
                            value={field.label} 
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Type</Label>
                          <Select 
                            value={field.type} 
                            onValueChange={(val: FieldType) => {
                              const updates: Partial<FieldDefinition> = { type: val };
                              // Clear incompatible configs when changing type
                              if (!isNumberType(val)) {
                                updates.numberConfig = undefined;
                              }
                              if (!isSelectType(val)) {
                                updates.options = undefined;
                              }
                              updateField(field.id, updates);
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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive mt-6"
                        onClick={() => deleteField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Number Configuration */}
                    {isNumberType(field.type) && (
                      <NumberConfigEditor
                        config={field.numberConfig}
                        onChange={(config) => updateField(field.id, { numberConfig: config })}
                        fieldType={field.type as 'number' | 'hours' | 'currency' | 'slider'}
                      />
                    )}

                    {/* Select Options Configuration */}
                    {isSelectType(field.type) && (
                      <SelectOptionEditor
                        options={normalizeOptions(field.options)}
                        onChange={(options) => updateField(field.id, { options })}
                      />
                    )}
                  </div>
                ))}

                {config[activeTab].length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">No fields defined for {activeTab}s.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>

          <div className="p-6 pt-2 border-t mt-auto">
            <Button onClick={addField} className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
