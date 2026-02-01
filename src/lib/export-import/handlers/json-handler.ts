import { ExportHandler, ExportData } from '../types';

export class JsonHandler implements ExportHandler {
  extension = 'json';
  mimeType = 'application/json';

  async export(data: ExportData): Promise<string> {
    return JSON.stringify(data, null, 2);
  }

  async import(content: string | Blob): Promise<ExportData> {
    const text = typeof content === 'string' ? content : await (content as Blob).text();
    const data = JSON.parse(text) as ExportData;
    
    // Basic validation
    if (!data.flows || !Array.isArray(data.flows)) {
      throw new Error('Invalid export file: missing flows array');
    }
    
    return data;
  }
}
