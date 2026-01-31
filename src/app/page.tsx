'use client';
import { ReactFlowProvider } from 'reactflow';
import { VectorFlow } from '@/components/vector-flow';

export default function Home() {
  return (
    <ReactFlowProvider>
      <VectorFlow />
    </ReactFlowProvider>
  );
}
