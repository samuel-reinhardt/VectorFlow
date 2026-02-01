import { ExportImportService } from './registry';
import { JsonHandler } from './handlers/json-handler';

// Register built-in handlers
ExportImportService.register('json', new JsonHandler());

export * from './types';
export * from './registry';
