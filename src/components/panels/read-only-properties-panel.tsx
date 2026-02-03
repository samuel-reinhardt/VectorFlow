import { cn, getTextColorForBackground, hexToRgba } from '@/lib/utils';
import { FieldDefinition, MetaConfig, FieldType, NumberConfig, ListDefinition } from '@/types';
import { getOptionByValue, getOptionsByValues, normalizeOptions } from '@/lib/metadata-utils';
import { DynamicIcon } from '@/components/common/dynamic-icon';
import { Tag } from 'lucide-react';
import { Node } from 'reactflow';

interface ReadOnlyPropertiesPanelProps {
  selectedNodes: any[];
  selectedEdge: any;
  selectedDeliverableId: string | null;
  nodes: Node[];
  metaConfig: MetaConfig;
}

// Format value based on field type
function formatValue(value: any, field: FieldDefinition, lists: ListDefinition[] = []): React.ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className="text-muted-foreground italic">Not set</span>;
  }

  const getOptions = () => {
     if (field.optionsSource === 'list' && field.listId) {
         const list = lists.find(l => l.id === field.listId);
         return list ? list.items : [];
     }
     return normalizeOptions(field.options);
  };

  switch (field.type) {
    case 'date':
      try {
        const date = new Date(value);
        return (
          <span className="font-medium">
            {date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        );
      } catch {
        return <span>{String(value)}</span>;
      }

    case 'number':
      return <span className="font-mono">{Number(value).toLocaleString()}</span>;

    case 'hours':
      return <span className="font-mono">{value} hrs</span>;

    case 'currency':
      return <span className="font-mono">${Number(value).toFixed(2)}</span>;

    case 'slider': {
      const numValue = Number(value);
      const min = field.numberConfig?.min ?? 0;
      const max = field.numberConfig?.max ?? 100;
      const percentage = ((numValue - min) / (max - min)) * 100;
      
      return (
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm">{numValue}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all" 
              style={{width: `${Math.max(0, Math.min(100, percentage))}%`}} 
            />
          </div>
        </div>
      );
    }

    case 'select': 
    case 'radio': {
      const options = getOptions();
      const option = options.find(o => o.value === String(value));
      
      if (!option) return <span>{String(value)}</span>;
      
      const color = option.color;
      const isDark = color ? getTextColorForBackground(color) === '#FFFFFF' : true;
      const textColor = isDark ? color : '#1f2937';

      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium border"
          style={color ? {
            backgroundColor: hexToRgba(color, 0.15),
            borderColor: hexToRgba(color, 0.3),
            color: textColor,
          } : {
             backgroundColor: 'hsl(var(--primary) / 0.1)',
             color: 'hsl(var(--primary))'
          }}
        >
          {option.icon && <DynamicIcon name={option.icon} fallback={Tag} className="w-3.5 h-3.5" />}
          {option.label}
        </span>
      );
    }

    case 'multi-select':
    case 'checkbox-group': {
      const values = Array.isArray(value) ? value : [value];
      const options = getOptions();
      const selectedOptions = values
        .map(v => options.find(o => o.value === v))
        .filter((o): o is NonNullable<typeof o> => !!o);
      
      if (selectedOptions.length === 0) return <span>{values.join(', ')}</span>;

      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option, i) => {
             const color = option.color;
             const isDark = color ? getTextColorForBackground(color) === '#FFFFFF' : true;
             const textColor = isDark ? color : '#1f2937';
             
             return (
                <span 
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                  style={color ? {
                    backgroundColor: hexToRgba(color, 0.15),
                    borderColor: hexToRgba(color, 0.3),
                    color: textColor,
                  } : {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))'
                  }}
                >
                  {option.icon && <DynamicIcon name={option.icon} fallback={Tag} className="w-3 h-3" />}
                  {option.label}
                </span>
             );
          })}
        </div>
      );
    }
    
    case 'toggle':
        return <span className="font-medium">{value ? 'Yes' : 'No'}</span>;

    case 'long-text':
      return (
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {String(value)}
        </p>
      );

    case 'text':
    default:
      return <span className="break-words">{String(value)}</span>;
  }
}

export function ReadOnlyPropertiesPanel({
  selectedNodes,
  selectedEdge,
  selectedDeliverableId,
  nodes,
  metaConfig,
}: ReadOnlyPropertiesPanelProps) {
  // Check if a deliverable is selected
  if (selectedDeliverableId) {
    // Find the parent step node that contains this deliverable
    const parentStep = nodes.find(n => 
      n.data?.deliverables?.some((d: any) => d.id === selectedDeliverableId)
    );
    
    if (parentStep) {
      const deliverable = parentStep.data.deliverables.find((d: any) => d.id === selectedDeliverableId);
      
      if (deliverable) {
        const metadata = deliverable.meta || {};
        const metaFields = metaConfig.deliverable || [];
        const displayName = deliverable.label || deliverable.name || 'Deliverable';
        const displayIcon = deliverable.icon || 'FileText';

        // Get all metadata keys that have values
        const metadataEntries = Object.entries(metadata).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        );

        // Filter fields that have values
        const fieldsWithValues = metaFields.filter((field: FieldDefinition) => {
          if (!field) return false;
          const value = metadata[field.id];
          return value !== undefined && value !== null && value !== '';
        });

        return (
          <div className="h-full flex flex-col bg-background border-l">
            <div className="p-4 border-b flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted shrink-0">
                <DynamicIcon name={displayIcon} fallback={Tag} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate" title={displayName}>{displayName}</h3>
                <p className="text-xs text-muted-foreground">Deliverable</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {fieldsWithValues.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No metadata values set</p>
                </div>
              ) : (
                <dl className="space-y-4">
                  {fieldsWithValues.map((field: FieldDefinition) => {
                    const value = metadata[field.id];
                    return (
                      <div key={field.id} className="space-y-1.5">
                        <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {field.label}
                        </dt>
                        <dd className="text-sm">
                          {formatValue(value, field, metaConfig.lists || [])}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </div>
          </div>
        );
      }
    }
  }

  // Single node selected (step or group)
  if (selectedNodes.length >= 1) {
    const node = selectedNodes[0];
    
    // Determine node type: step or group
    const nodeType = node.type === 'group' ? 'group' : 'step';
    const metadata = node.data?.meta || {};
    const metaFields = metaConfig[nodeType] || [];
    
    // Get the display name and icon for the title
    const displayName = node.data?.label || node.data?.name || 'Item';
    const displayIcon = node.data?.icon || (nodeType === 'group' ? 'Layers' : 'Square');

    // Get all metadata keys that have values
    const metadataEntries = Object.entries(metadata).filter(([_, value]) => 
      value !== undefined && value !== null && value !== ''
    );

    // Filter fields that have values
    const fieldsWithValues = metaFields.filter((field: FieldDefinition) => {
      if (!field) return false;
      const value = metadata[field.id];
      return value !== undefined && value !== null && value !== '';
    });

    return (
      <div className="h-full flex flex-col bg-background border-l">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted shrink-0">
            <DynamicIcon name={displayIcon} fallback={Tag} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" title={displayName}>{displayName}</h3>
            <p className="text-xs text-muted-foreground">{nodeType === 'group' ? 'Group' : 'Step'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {fieldsWithValues.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No metadata values set</p>
            </div>
          ) : metaFields.length === 0 && metadataEntries.length > 0 ? (
            // Show raw metadata if no field definitions
            <dl className="space-y-3">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="text-sm">
                    <span className="break-words">{String(value)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <dl className="space-y-4">
              {fieldsWithValues.map((field: FieldDefinition) => {
                const value = metadata[field.id];
                return (
                  <div key={field.id} className="space-y-1.5">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {field.label}
                    </dt>
                    <dd className="text-sm">
                      {formatValue(value, field, metaConfig.lists || [])}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>
      </div>
    );
  }

  // Edge selected - edges don't have metadata in current schema
  if (selectedEdge) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">No metadata to display</p>
      </div>
    );
  }

  // Nothing selected or multiple items
  return (
    <div className="p-6 text-center text-muted-foreground">
      <p className="text-sm">
        {selectedNodes.length > 1 
          ? 'Multiple items selected' 
          : 'Select an item to view metadata'}
      </p>
    </div>
  );
}
