import { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { Plus, X, Palette, Image as ImageIcon, Wand2, Info } from 'lucide-react';
import { VisualRules, AutoStyleRule, MetaConfig } from '@/types';
import { IconPicker } from '@/components/common/icon-picker';
import { IconBrowserDialog } from '@/components/common/icon-browser-dialog';
import { ColorPickerDialog } from '@/components/common/color-picker-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';


interface VisualRulesEditorProps {
    rules: VisualRules;
    metaConfig: MetaConfig; // Needed for field references in auto-style
    onChange: (newRules: VisualRules) => void;
}

export function VisualRulesEditor({ rules, metaConfig, onChange }: VisualRulesEditorProps) {
    const [activeTab, setActiveTab] = useState<'palette' | 'icons' | 'autostyle'>('palette');
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        context: 'add_project' | 'autostyle_icon' | 'autostyle_color';
        ruleId?: string;
    }>({ open: false, context: 'add_project' });

    // Palette Handlers
    const addColor = () => {
        onChange({ ...rules, palette: [...rules.palette, '#000000'] });
    };
    const updateColor = (index: number, color: string) => {
        const newPalette = [...rules.palette];
        newPalette[index] = color;
        onChange({ ...rules, palette: newPalette });
    };
    const removeColor = (index: number) => {
        onChange({ ...rules, palette: rules.palette.filter((_, i) => i !== index) });
    };

    // Icon Handlers
    const addIcon = (icon: string) => {
        if (!rules.icons.includes(icon)) {
            onChange({ ...rules, icons: [...rules.icons, icon] });
        }
    };
    const removeIcon = (icon: string) => {
        onChange({ ...rules, icons: rules.icons.filter(i => i !== icon) });
    };

    const handleIconSelect = (icon: string) => {
        if (dialogState.context === 'add_project') {
            addIcon(icon);
        } else if (dialogState.context === 'autostyle_icon' && dialogState.ruleId) {
            updateRuleApply(dialogState.ruleId, { icon });
        }
        setDialogState(prev => ({ ...prev, open: false }));
    };

    const handleColorDialogChange = (color: string) => {
        if (dialogState.context === 'autostyle_color' && dialogState.ruleId) {
             updateRuleApply(dialogState.ruleId, { color });
        }
    };

    // Auto-Style Handlers
    const addRule = () => {
        const newRule: AutoStyleRule = {
            id: crypto.randomUUID(),
            target: ['step'],
            fieldId: '',
            condition: 'equals',
            value: '',
            apply: {}
        };
        onChange({ ...rules, autoStyle: [...rules.autoStyle, newRule] });
    };

    const updateRule = (id: string, updates: Partial<AutoStyleRule>) => {
        onChange({
            ...rules,
            autoStyle: rules.autoStyle.map(r => r.id === id ? { ...r, ...updates } : r)
        });
    };

    const updateRuleApply = (id: string, updates: Partial<AutoStyleRule['apply']>) => {
         onChange({
            ...rules,
            autoStyle: rules.autoStyle.map(r => r.id === id ? { ...r, apply: { ...r.apply, ...updates } } : r)
        });
    };

    const removeRule = (id: string) => {
        onChange({ ...rules, autoStyle: rules.autoStyle.filter(r => r.id !== id) });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b mb-4 pb-2">
                <Button 
                    variant={activeTab === 'palette' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setActiveTab('palette')}
                    className="gap-2"
                >
                    <Palette className="w-4 h-4" /> Palette
                </Button>
                <Button 
                    variant={activeTab === 'icons' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setActiveTab('icons')}
                    className="gap-2"
                >
                    <ImageIcon className="w-4 h-4" /> Icons
                </Button>
                <Button 
                    variant={activeTab === 'autostyle' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setActiveTab('autostyle')}
                    className="gap-2"
                >
                    <Wand2 className="w-4 h-4" /> Auto-Style
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
                {activeTab === 'palette' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Project Palette</Label>
                            <Button size="sm" variant="outline" onClick={addColor} className="gap-1">
                                <Plus className="w-3 h-3" /> Add Color
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Define colors for quick access in the color picker.</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {rules.palette.map((color, index) => (
                                <div key={index} className="flex items-center gap-2 border p-2 rounded bg-card">
                                    <input 
                                        type="color" 
                                        value={color} 
                                        onChange={(e) => updateColor(index, e.target.value)}
                                        className="w-8 h-8 cursor-pointer rounded border"
                                    />
                                    <Input 
                                        value={color} 
                                        onChange={(e) => updateColor(index, e.target.value)}
                                        className="h-8 text-xs font-mono"
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeColor(index)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {rules.palette.length === 0 && (
                            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded">
                                 No colors in palette. Add one to get started.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'icons' && (
                    <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <Label>Project Icons</Label>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1"
                                onClick={() => setDialogState({ open: true, context: 'add_project' })}
                            >
                                <Plus className="w-3 h-3" /> Add Icon
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Select icons that appear at the top of the icon picker.</p>

                        <div className="grid grid-cols-4 gap-2">
                            {rules.icons.map((icon) => (
                                <div key={icon} className="relative group border p-2 rounded flex flex-col items-center justify-center gap-1 hover:bg-muted/50">
                                    <Button 
                                        size="icon" 
                                        variant="destructive" 
                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeIcon(icon)}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                    <IconPicker value={icon} onChange={() => {}} readOnly />
                                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{icon}</span>
                                </div>
                            ))}
                        </div>
                         {rules.icons.length === 0 && (
                            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded">
                                No project icons. Add common icons for quick access.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'autostyle' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Auto-Styling Rules</Label>
                            <Button size="sm" variant="outline" onClick={addRule} className="gap-1">
                                <Plus className="w-3 h-3" /> Add Rule
                            </Button>
                        </div>
                         <div className="p-2 bg-blue-50 text-blue-700 rounded text-[10px] flex gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            <p>Rules apply automatically if no explicit color/icon is set on the element. Rules are evaluated in order.</p>
                        </div>

                        <div className="space-y-3">
                            {rules.autoStyle.map((rule, index) => {
                                // Compute available fields based on selected targets
                                const availableFields = new Map<string, string>();
                                rule.target.forEach(t => {
                                    (metaConfig[t] || []).forEach(f => {
                                        if (f) availableFields.set(f.id, f.label);
                                    });
                                });
                                
                                return (
                                <div key={rule.id} className="border rounded-md p-3 space-y-3 bg-card relative">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeRule(rule.id)}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Target & Field */}
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">If Target Is</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {(['step', 'deliverable', 'group', 'edge'] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => {
                                                            const current = rule.target;
                                                            const newTargets = current.includes(t) 
                                                                ? current.filter(x => x !== t)
                                                                : [...current, t];
                                                            if (newTargets.length === 0) return; 
                                                            updateRule(rule.id, { target: newTargets });
                                                        }}
                                                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${rule.target.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                    >
                                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                         <div className="space-y-1">
                                            <Label className="text-[10px]">And Field</Label>
                                             <Select value={rule.fieldId} onValueChange={(v) => updateRule(rule.id, { fieldId: v })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select Field" /></SelectTrigger>
                                                <SelectContent>
                                                    {Array.from(availableFields.entries()).map(([id, label]) => (
                                                        <SelectItem key={id} value={id}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[1fr_1fr] gap-2 items-end">
                                        <div className="space-y-1">
                                             <Label className="text-[10px]">Condition</Label>
                                             <Select value={rule.condition} onValueChange={(v: any) => updateRule(rule.id, { condition: v })}>
                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="equals">Equals</SelectItem>
                                                    <SelectItem value="not_equals">Does not equal</SelectItem>
                                                    <SelectItem value="contains">Contains</SelectItem>
                                                    <SelectItem value="is_set">Is Set</SelectItem>
                                                    <SelectItem value="is_not_set">Is Not Set</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-1">
                                            {['equals', 'not_equals', 'contains'].includes(rule.condition) && (
                                                <Input 
                                                    className="h-7 text-xs" 
                                                    placeholder="Value..." 
                                                    value={rule.value} 
                                                    onChange={e => updateRule(rule.id, { value: e.target.value })} 
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-2 mt-2">
                                        <Label className="text-[10px] mb-2 block">Then Apply Style</Label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => setDialogState({ open: true, context: 'autostyle_color', ruleId: rule.id })}
                                                    className="w-6 h-6 rounded border p-0 overflow-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:ring-2"
                                                    style={{ backgroundColor: rule.apply.color || '#000000' }}
                                                    aria-label="Pick color"
                                                    title="Pick color"
                                                />
                                                <span className="text-[10px] text-muted-foreground">Color</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-8 w-[140px] justify-between px-2"
                                                      onClick={() => setDialogState({ open: true, context: 'autostyle_icon', ruleId: rule.id })}
                                                  >
                                                      <span className="truncate text-[10px]">
                                                          {rule.apply.icon || "Select Icon..."}
                                                      </span>
                                                      <ImageIcon className="h-3 w-3 opacity-50 ml-1" />
                                                  </Button>
                                                 <span className="text-[10px] text-muted-foreground">Icon</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                )}
            </div>

            <IconBrowserDialog 
                open={dialogState.open && (dialogState.context === 'add_project' || dialogState.context === 'autostyle_icon')} 
                onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}
                onSelect={handleIconSelect}
                title={dialogState.context === 'add_project' ? "Add Project Icon" : "Select Icon for Rule"}
            />
            
            <ColorPickerDialog
                open={dialogState.open && dialogState.context === 'autostyle_color'}
                onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}
                color={(rules.autoStyle.find(r => r.id === dialogState.ruleId)?.apply.color) || '#000000'}
                onChange={handleColorDialogChange}
                palette={rules.palette}
                title="Select Color"
            />
        </div>
    );
}
