export interface CollectionInfo {
    name: string;
    description: string;
    dimension: number;
    vectorCount: number;
    owner: string;
    isPublic: boolean;
    createdAt: number;
    updatedAt: number;
    storageRoot: string;
    metadataHash: string;
    txHash?: string;
    blockNumber?: number;
    blockHash?: string;
}
export interface VectorMetadataInfo {
    storageHash: string;
    collectionId: string;
    timestamp: number;
    contentHash: string;
}
export interface ContractStats {
    totalCollections: number;
    totalVectors: number;
    totalIds: number;
}
/**
 * Service for interacting with the VectorRegistry smart contract
 */
export declare class VectorRegistryService {
    private provider;
    private wallet;
    private contract;
    private contractAddress;
    constructor();
    /**
     * Check if the service is properly configured
     */
    isConfigured(): boolean;
    /**
     * Create a new collection on the blockchain
     */
    createCollection(collectionId: string, name: string, description: string, dimension?: number, isPublic?: boolean): Promise<string>;
    /**
     * Update collection metadata on the blockchain
     */
    updateCollection(collectionId: string, storageRoot: string, vectorCount: number, metadataHash?: string): Promise<string>;
    /**
     * Get collection information from the blockchain
     */
    getCollection(collectionId: string, includeTxDetails?: boolean): Promise<CollectionInfo | null>;
    /**
     * Get transaction details for a collection by listening to past events
     */
    getCollectionTransactionDetails(collectionId: string): Promise<{
        txHash: string;
        blockNumber: number;
        blockHash: string;
    } | null>;
    /**
     * Get all collection IDs
     */
    getAllCollections(): Promise<string[]>;
    /**
     * Add vector metadata to the blockchain
     */
    addVectorMetadata(collectionId: string, vectorId: string, storageHash: string, contentHash?: string): Promise<string>;
    /**
     * Get vector metadata from the blockchain
     */
    getVectorMetadata(collectionId: string, vectorId: string): Promise<VectorMetadataInfo | null>;
    /**
     * Set vector attribute
     */
    setVectorAttribute(collectionId: string, vectorId: string, key: string, value: string): Promise<string>;
    /**
     * Get contract statistics
     */
    getStats(): Promise<ContractStats>;
    /**
     * Check if user has access to collection
     */
    hasAccess(collectionId: string, userAddress?: string): Promise<boolean>;
    /**
     * Get user's collections
     */
    getUserCollections(userAddress?: string): Promise<string[]>;
    /**
     * Get service status information
     */
    getServiceInfo(): {
        configured: boolean;
        contractAddress: string;
        walletAddress: string | undefined;
        network: string;
        chainId: number;
    };
}
//# sourceMappingURL=VectorRegistryService.d.ts.map