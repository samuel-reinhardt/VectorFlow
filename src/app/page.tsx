'use client';
import { ReactFlowProvider } from 'reactflow';
import { VectorFlow } from '@/components/flow/vector-flow';

export default function Home() {
  return (
    <ReactFlowProvider>
      <VectorFlow />
    </ReactFlowProvider>
  );
}
