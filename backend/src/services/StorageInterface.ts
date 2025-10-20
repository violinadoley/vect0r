/**
 * Storage Service Interface
 * Provides a unified interface for 0G Storage implementations
 */

export interface IStorageService {
  uploadData(data: Buffer | string, filename: string): Promise<any>;
  downloadData(rootHash: string): Promise<Buffer>;
  uploadVectorCollection(collectionId: string, vectors: any[], metadata: Record<string, any>): Promise<any>;
  getReal0GStats(): Promise<any>;
  testConnection?(): Promise<boolean>;
  getNetworkStatus?(): Promise<any>;
}
