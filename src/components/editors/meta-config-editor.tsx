import * as React from 'react';
import { Plus, Trash2, Settings2, X, Grip, LayoutTemplate, Palette } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/layout/tabs';
import type { FieldDefinition, MetaConfig, FieldType } from '@/types';
import { SelectOptionEditor } from '@/components/editors/select-option-editor';
import { NumberConfigEditor } from '@/components/editors/number-config-editor';
import { normalizeOptions } from '@/lib/metadata-utils';
import { VisualRulesEditor } from './visual-rules-editor';

interface MetaConfigEditorProps {
  config: MetaConfig;
  onUpdate: (type: keyof MetaConfig, value: any) => void;
}

export function MetaConfigEditor({ config, onUpdate }: MetaConfigEditorProps) {
  const [activeSection, setActiveSection] = React.useState<'structure' | 'visuals'>('structure');
  const [activeTab, setActiveTab] = React.useState<'step' | 'deliverable' | 'group'>('step');

  const addField = () => {
    const newField: FieldDefinition = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
    };
    onUpdate(activeTab, [...(config[activeTab] as FieldDefinition[]), newField]);
  };

  const updateField = (id: string, updates: Partial<FieldDefinition>) => {
    const nextFields = (config[activeTab] as FieldDefinition[]).map(f => 
      f.id === id ? { ...f, ...updates } : f
    );
    onUpdate(activeTab, nextFields);
  };

  const deleteField = (id: string) => {
    onUpdate(activeTab, (config[activeTab] as FieldDefinition[]).filter(f => f.id !== id));
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
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
                {activeSection === 'structure' ? (
                     <Tabs 
                        value={activeTab} 
                        onValueChange={(v) => setActiveTab(v as any)} 
                        className="flex-1 flex flex-col h-full"
                    >
                        <div className="px-6 py-4 border-b">
                          <TabsList className="w-full grid grid-cols-3">
                            <TabsTrigger value="step">Steps</TabsTrigger>
                            <TabsTrigger value="deliverable">Deliverables</TabsTrigger>
                            <TabsTrigger value="group">Groups</TabsTrigger>
                          </TabsList>
                        </div>
              
                        <TabsContent value={activeTab} className="flex-1 overflow-y-auto p-6 m-0 space-y-6">
                            <div className="space-y-4">
                              {(config[activeTab] as FieldDefinition[]).map((field) => (
                                <div key={field.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Label</Label>
                                        <Input 
                                          value={field.label} 
                                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Type</Label>
                                        <Select 
                                          value={field.type} 
                                          onValueChange={(val: FieldType) => {
                                            const updates: Partial<FieldDefinition> = { type: val };
                                            if (!isNumberType(val)) updates.numberConfig = undefined;
                                            if (!isSelectType(val)) updates.options = undefined;
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
                                      className="text-muted-foreground hover:text-destructive mt-6 h-8 w-8"
                                      onClick={() => deleteField(field.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
              
                                  {isNumberType(field.type) && (
                                    <div className="bg-muted/30 p-3 rounded-md">
                                        <NumberConfigEditor
                                          config={field.numberConfig}
                                          onChange={(config) => updateField(field.id, { numberConfig: config })}
                                          fieldType={field.type as any}
                                        />
                                    </div>
                                  )}
              
                                  {isSelectType(field.type) && (
                                    <div className="bg-muted/30 p-3 rounded-md">
                                        <SelectOptionEditor
                                          options={normalizeOptions(field.options)}
                                          onChange={(options) => updateField(field.id, { options })}
                                        />
                                    </div>
                                  )}
                                </div>
                              ))}
              
                              {(config[activeTab] as FieldDefinition[]).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                  <p className="text-sm">No fields defined for {activeTab}s.</p>
                                </div>
                              )}
                            </div>
                            
                            <Button onClick={addField} variant="outline" className="w-full border-dashed">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Field
                            </Button>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex-1 p-6 overflow-hidden">
                        <VisualRulesEditor 
                            rules={config.visualRules || { palette: [], icons: [], autoStyle: [] }} 
                            metaConfig={config}
                            onChange={(newRules) => onUpdate('visualRules', newRules)} 
                        />
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
