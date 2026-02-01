import { ExportHandler, ExportData } from './types';

class ExportImportRegistry {
  private handlers = new Map<string, ExportHandler>();

  register(format: string, handler: ExportHandler) {
    this.handlers.set(format.toLowerCase(), handler);
  }

  getHandler(format: string): ExportHandler {
    const handler = this.handlers.get(format.toLowerCase());
    if (!handler) {
      throw new Error(`No export handler found for format: ${format}`);
    }
    return handler;
  }

  getAvailableFormats(): string[] {
    return Array.from(this.handlers.keys());
  }

  async export(format: string, data: ExportData): Promise<{ content: string | Blob, extension: string, mimeType: string }> {
    const handler = this.getHandler(format);
    const content = await handler.export(data);
    return {
      content,
      extension: handler.extension,
      mimeType: handler.mimeType
    };
  }

  async import(format: string, content: string | Blob): Promise<ExportData> {
    const handler = this.getHandler(format);
    return handler.import(content);
  }
}

export const ExportImportService = new ExportImportRegistry();
