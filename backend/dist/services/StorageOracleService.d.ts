export interface StorageEntryInfo {
    root: string;
    nodeAddresses: string[];
    size: number;
    replicationFactor: number;
    timestamp: number;
    isActive: boolean;
    integrityHash: string;
}
export interface StorageNodeInfo {
    nodeAddress: string;
    totalStorage: number;
    usedStorage: number;
    reliability: number;
    lastSeen: number;
    isActive: boolean;
}
export interface StorageStats {
    totalStoredData: number;
    totalActiveNodes: number;
    totalActiveRoots: number;
    minReplicationFactor: number;
}
/**
 * Service for interacting with the StorageOracle smart contract
 */
export declare class StorageOracleService {
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
     * Register data storage on the blockchain
     */
    registerDataStorage(root: string, nodeAddresses: string[], size: number, integrityHash?: string): Promise<string>;
    /**
     * Remove data storage registration
     */
    removeDataStorage(root: string): Promise<string>;
    /**
     * Get storage entry information
     */
    getStorageEntry(root: string): Promise<StorageEntryInfo | null>;
    /**
     * Register a storage node
     */
    registerNode(nodeAddress: string, totalStorage: number): Promise<string>;
    /**
     * Update node status
     */
    updateNodeStatus(nodeAddress: string, usedStorage: number, reliability: number): Promise<string>;
    /**
     * Get storage node information
     */
    getStorageNode(nodeAddress: string): Promise<StorageNodeInfo | null>;
    /**
     * Get all active storage roots
     */
    getActiveRoots(): Promise<string[]>;
    /**
     * Get all active storage nodes
     */
    getActiveNodes(): Promise<string[]>;
    /**
     * Get storage network statistics
     */
    getStorageStats(): Promise<StorageStats>;
    /**
     * Check if data has sufficient replication
     */
    hasSufficientReplication(root: string): Promise<boolean>;
    /**
     * Verify data integrity
     */
    verifyIntegrity(root: string, nodeAddress: string, actualHash: string): Promise<string>;
    /**
     * Request data replication
     */
    requestReplication(root: string, targetReplicas: number): Promise<string>;
    /**
     * Get comprehensive network health information
     */
    getNetworkHealth(): Promise<{
        stats: StorageStats;
        activeNodes: string[];
        activeRoots: string[];
        replicationHealth: {
            root: string;
            sufficient: boolean;
        }[];
    }>;
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
//# sourceMappingURL=StorageOracleService.d.ts.map