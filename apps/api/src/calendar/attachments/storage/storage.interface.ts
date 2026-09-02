export const STORAGE_ADAPTER = Symbol("STORAGE_ADAPTER");

export interface StorageAdapter {
  save(key: string, buffer: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
