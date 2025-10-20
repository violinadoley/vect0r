export interface VectorDocument {
    id: string;
    vector: number[];
    metadata: Record<string, any>;
    timestamp: number;
}
export interface SearchResult {
    id: string;
    score: number;
    metadata: Record<string, any>;
}
export interface Collection {
    id: string;
    name: string;
    dimension: number;
    count: number;
    created: number;
    updated: number;
}
export declare class VectorEngine {
    private indices;
    private documents;
    private collections;
    private vectorRegistryService;
    private storageOracleService;
    constructor();
    private initializeEngine;
    /**
     * Create a new vector collection
     */
    createCollection(name: string, dimension?: number, description?: string, isPublic?: boolean, allowDefaultName?: boolean): Promise<string>;
    /**
     * Get collection information
     */
    getCollection(collectionId: string): Collection | null;
    /**
     * List all collections (local and blockchain)
     */
    listCollections(): Promise<Collection[]>;
    /**
     * Insert a vector document into a collection
     */
    insertVector(collectionId: string, vector: number[], metadata?: Record<string, any>): Promise<string>;
    /**
     * Batch insert vectors
     */
    insertVectors(collectionId: string, vectors: {
        vector: number[];
        metadata?: Record<string, any>;
    }[]): Promise<string[]>;
    /**
     * Search for similar vectors
     */
    searchVectors(collectionId: string, queryVector: number[], k?: number, filter?: (metadata: Record<string, any>) => boolean): Promise<SearchResult[]>;
    /**
     * Get a specific vector document
     */
    getVector(collectionId: string, docId: string): VectorDocument | null;
    /**
     * Delete a vector document
     */
    deleteVector(collectionId: string, docId: string): Promise<boolean>;
    /**
     * Delete an entire collection
     */
    deleteCollection(collectionId: string): Promise<boolean>;
    /**
     * Get all vectors in a collection with pagination
     */
    getCollectionVectors(collectionId: string, limit?: number, offset?: number): VectorDocument[];
    /**
     * Get total count of vectors in a collection
     */
    getCollectionVectorCount(collectionId: string): number;
    /**
     * Get engine statistics
     */
    getStats(): {
        collections: number;
        totalVectors: number;
        memoryUsage: NodeJS.MemoryUsage;
    };
    /**
     * Get blockchain integration status
     */
    getBlockchainStatus(): {
        vectorRegistry: {
            configured: boolean;
            contractAddress: string;
            walletAddress: string | undefined;
            network: string;
            chainId: number;
        };
        storageOracle: {
            configured: boolean;
            contractAddress: string;
            walletAddress: string | undefined;
            network: string;
            chainId: number;
        };
    };
    /**
     * Get comprehensive stats including blockchain data
     */
    getComprehensiveStats(): Promise<{
        local: {
            collections: number;
            totalVectors: number;
            memoryUsage: NodeJS.MemoryUsage;
        };
        blockchain: {
            status: {
                vectorRegistry: {
                    configured: boolean;
                    contractAddress: string;
                    walletAddress: string | undefined;
                    network: string;
                    chainId: number;
                };
                storageOracle: {
                    configured: boolean;
                    contractAddress: string;
                    walletAddress: string | undefined;
                    network: string;
                    chainId: number;
                };
            };
            vectorRegistry: import("../services/VectorRegistryService").ContractStats | null;
            storageOracle: import("../services/StorageOracleService").StorageStats | null;
        };
    }>;
}
//# sourceMappingURL=VectorEngine.d.ts.map