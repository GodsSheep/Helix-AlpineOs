import { SystemLogger } from './Logger';

export type FileOperation = 'create' | 'modify' | 'rename' | 'delete';

export interface JournalEntry {
  id: string;
  timestamp: number;
  operation: FileOperation;
  path: string;
  newPath?: string;
  origin: string;
  checksum?: string;
}

export class ChangeJournal {
  private entries: JournalEntry[] = [];
  
  constructor(private logger: SystemLogger) {}

  record(operation: FileOperation, path: string, origin: string = 'vfs', details?: Partial<JournalEntry>) {
    const entry: JournalEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      operation,
      path,
      origin,
      ...details
    };
    this.entries.push(entry);
    this.logger.log('VFS', 'debug', `Journal entry: ${operation} ${path}`);
    
    // In a real implementation we would persist this to IndexedDB directly
  }

  getEntries() {
    return this.entries;
  }
}
