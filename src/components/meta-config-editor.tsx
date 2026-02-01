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
import type { FieldDefinition, MetaConfig, FieldType } from '@/types';

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Metadata Settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
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
                            onValueChange={(val: FieldType) => updateField(field.id, { type: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="long-text">Long Text</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
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

                    {(field.type === 'select' || field.type === 'multi-select') && (
                      <div className="space-y-2">
                        <Label>Options (comma separated)</Label>
                        <Input 
                          value={field.options?.join(', ') || ''} 
                          onChange={(e) => updateField(field.id, { 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                          })}
                          placeholder="Option 1, Option 2, ..."
                        />
                      </div>
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
