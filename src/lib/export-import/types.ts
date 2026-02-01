import { Flow } from '@/types';

export interface ExportData {
  version: string;
  timestamp: string;
  projectName?: string;
  projectId: string;
  flows: Flow[];
  activeFlowId: string;
  googleDriveFileId?: string;
  metadata?: Record<string, any>;
}

export interface ExportHandler {
  extension: string;
  mimeType: string;
  export(data: ExportData): Promise<string | Blob>;
  import(content: string | Blob): Promise<ExportData>;
}
