import { Edge } from 'reactflow';

/**
 * Demo edges for the initial VectorFlow canvas.
 * Connects the demo nodes to show relationships.
 */
export const demoEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: 'node-1', 
    target: 'node-2', 
    animated: true, 
    label: 'Insights', 
    data: { icon: 'Lightbulb' }, 
    type: 'custom',
    style: { stroke: '#6B7280' } 
  },
  { 
    id: 'e2-3', 
    source: 'node-2', 
    target: 'node-3', 
    animated: true, 
    label: 'Implementation', 
    data: { icon: 'Zap' }, 
    type: 'custom',
    style: { stroke: '#6B7280' } 
  },
];
