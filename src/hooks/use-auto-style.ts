'use client';

import { useMemo } from 'react';
import { useFlowContext } from '@/components/flow/flow-context';
import { AutoStyleRule } from '@/types';

type EntityType = 'step' | 'edge' | 'group' | 'deliverable';

interface AutoStyleOptions {
  id?: string;
  type: EntityType;
  data: any; // The whole data object containing metadata
  explicitColor?: string;
  explicitIcon?: string;
}

export function useAutoStyle({ type, data, explicitColor, explicitIcon }: AutoStyleOptions) {
  const { metaConfig } = useFlowContext();

  return useMemo(() => {
    // 1. Explicit style always wins
    const effectiveColor = explicitColor; // If undefined/null/empty, we fall back
    const effectiveIcon = explicitIcon;

    // If both are set, no need to check rules (unless we want to support partial overrides)
    // We treat empty string as "not set"
    if (effectiveColor && effectiveIcon) {
        return { color: effectiveColor, icon: effectiveIcon };
    }

    const rules = metaConfig?.visualRules?.autoStyle || [];
    const entityRules = rules.filter(r => r.target === type);

    let derivedColor = effectiveColor;
    let derivedIcon = effectiveIcon;

    for (const rule of entityRules) {
        // Stop if we have both
        if (derivedColor && derivedIcon) break;

        const fieldId = rule.fieldId;
        const fieldValue = data?.meta?.[fieldId];

        let matches = false;

        switch (rule.condition) {
            case 'equals':
                matches = fieldValue == rule.value;
                break;
            case 'not_equals':
                matches = fieldValue != rule.value;
                break;
            case 'contains':
                 if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
                     matches = fieldValue.includes(rule.value);
                 } else if (Array.isArray(fieldValue)) {
                     matches = fieldValue.includes(rule.value);
                 }
                break;
            case 'greater_than':
                matches = Number(fieldValue) > Number(rule.value);
                break;
            case 'less_than':
                matches = Number(fieldValue) < Number(rule.value);
                break;
            case 'is_set':
                matches = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
                break;
            case 'is_not_set':
                matches = fieldValue === undefined || fieldValue === null || fieldValue === '';
                break;
        }

        if (matches) {
            if (!derivedColor && rule.apply.color) derivedColor = rule.apply.color;
            if (!derivedIcon && rule.apply.icon) derivedIcon = rule.apply.icon;
        }
    }

    return {
        color: derivedColor,
        icon: derivedIcon
    };

  }, [metaConfig, type, data, explicitColor, explicitIcon]);
}
