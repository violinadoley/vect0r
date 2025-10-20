import { IStorageService } from './StorageInterface';
/**
 * Real 0G Storage Service using Official SDK
 * Based on: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
 */
export declare class Real0GStorageSDK implements IStorageService {
    private provider;
    private signer;
    private indexer;
    private readonly RPC_URL;
    private readonly INDEXER_RPC;
    constructor();
    /**
     * Upload data to real 0G Storage Network using official SDK
     */
    uploadData(data: Buffer | string, filename: string): Promise<any>;
    /**
     * Upload vector collection data to 0G Storage Network
     */
    uploadVectorCollection(collectionId: string, vectors: any[], metadata: Record<string, any>): Promise<any>;
    /**
     * Download data from real 0G Storage Network using official SDK
     */
    downloadData(rootHash: string, outputPath?: string): Promise<Buffer>;
    /**
     * Upload file directly using file path (most efficient method)
     */
    uploadFile(filePath: string): Promise<any>;
    /**
     * Test 0G Storage connectivity
     */
    testConnection(): Promise<boolean>;
    /**
     * Get storage network status
     */
    getNetworkStatus(): Promise<any>;
    /**
     * Get Real 0G Statistics (lightweight version)
     */
    getReal0GStats(): Promise<any>;
    private localStorageUpload;
    private localStorageDownload;
}
//# sourceMappingURL=Real0GStorageSDK.d.ts.map