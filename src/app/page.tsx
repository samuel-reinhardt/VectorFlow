'use client';
import { ReactFlowProvider } from 'reactflow';
import dynamic from 'next/dynamic';

const VectorFlow = dynamic(() => import('@/components/flow/vector-flow').then(m => m.VectorFlow), { ssr: false });

export default function Home() {
  return (
    <ReactFlowProvider>
      <VectorFlow />
    </ReactFlowProvider>
  );
}
