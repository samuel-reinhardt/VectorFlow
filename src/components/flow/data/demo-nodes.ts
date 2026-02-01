import { Node } from 'reactflow';

/**
 * Demo nodes for the initial VectorFlow canvas.
 * Includes a group node with nested step nodes containing deliverables.
 */
export const demoNodes: Node[] = [
  { 
    id: 'group-1', 
    type: 'group', 
    position: { x: 50, y: 50 }, 
    data: { label: 'Strategic Planning', icon: 'Target', color: '#3B82F6' }, 
    style: { 
      width: 720, 
      height: 420,
      border: 'none',
      background: 'transparent',
      boxShadow: 'none',
      borderRadius: '12px',
      padding: 0,
    },
    className: '!border-0 !bg-transparent !p-0 !shadow-none !outline-none !ring-0',
    zIndex: 0,
  },
  { 
    id: 'node-1', 
    type: 'custom', 
    parentNode: 'group-1', 
    position: { x: 40, y: 80 }, 
    data: { 
      label: 'Market Research', 
      icon: 'Search', 
      color: '#60A5FA', 
      deliverables: [
        { id: 'd1', label: 'Survey Results', icon: 'BarChart', color: '#edf2f7' },
        { id: 'd2', label: 'Competitor PDF', icon: 'FileText', color: '#edf2f7' }
      ] 
    }, 
    style: { width: 220, height: 'auto' },
    zIndex: 30,
  },
  { 
    id: 'node-2', 
    type: 'custom', 
    parentNode: 'group-1', 
    position: { x: 460, y: 180 }, 
    data: { 
      label: 'Product Roadmap', 
      icon: 'Map', 
      color: '#60A5FA', 
      deliverables: [
        { id: 'd3', label: 'Feature Backlog', icon: 'ListTodo', color: '#edf2f7' }
      ] 
    }, 
    style: { width: 220, height: 'auto' },
    zIndex: 30,
  },
  { 
    id: 'node-3', 
    type: 'custom', 
    position: { x: 970, y: 150 }, 
    data: { 
      label: 'System Architecture', 
      icon: 'Cpu', 
      color: '#10B981', 
      deliverables: [
        { id: 'd4', label: 'Database Schema', icon: 'Database', color: '#edf2f7' },
        { id: 'd5', label: 'API Endpoints', icon: 'Cloud', color: '#edf2f7' }
      ] 
    }, 
    style: { width: 220, height: 'auto' },
    zIndex: 30,
  },
];
