'use client';

import { createContext, useContext } from 'react';
import { MetaConfig, EMPTY_META_CONFIG } from '@/types';

interface FlowContextType {
  metaConfig: MetaConfig;
}

const FlowContext = createContext<FlowContextType>({
  metaConfig: EMPTY_META_CONFIG
});

export function useFlowContext() {
  return useContext(FlowContext);
}

export const FlowProvider = FlowContext.Provider;
