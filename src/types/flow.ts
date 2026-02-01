import { Node, Edge } from 'reactflow';
import { MetaConfig } from './metadata';

export type Flow = {
  id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  metaConfig: MetaConfig;
};
