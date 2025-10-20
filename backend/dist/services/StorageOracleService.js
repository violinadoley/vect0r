"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageOracleService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
// StorageOracle ABI - Essential functions only
const STORAGE_ORACLE_ABI = [
    // Data storage management
    "function registerDataStorage(string calldata root, string[] calldata nodeAddresses, uint256 size, bytes32 integrityHash) external",
    "function removeDataStorage(string calldata root) external",
    "function getStorageEntry(string calldata root) external view returns (tuple(string root, string[] nodeAddresses, uint256 size, uint256 replicationFactor, uint256 timestamp, bool isActive, bytes32 integrityHash))",
    // Node management
    "function registerNode(string calldata nodeAddress, uint256 totalStorage) external",
    "function updateNodeStatus(string calldata nodeAddress, uint256 usedStorage, uint256 reliability) external",
    "function getStorageNode(string calldata nodeAddress) external view returns (tuple(string nodeAddress, uint256 totalStorage, uint256 usedStorage, uint256 reliability, uint256 lastSeen, bool isActive))",
    // Network information
    "function getActiveRoots() external view returns (string[] memory)",
    "function getActiveNodes() external view returns (string[] memory)",
    "function getStorageStats() external view returns (uint256, uint256, uint256, uint256)",
    "function hasSufficientReplication(string calldata root) external view returns (bool)",
    // Integrity and replication
    "function verifyIntegrity(string calldata root, string calldata nodeAddress, bytes32 actualHash) external",
    "function requestReplication(string calldata root, uint256 targetReplicas) external",
    // Events
    "event DataStored(string indexed root, string[] nodeAddresses, uint256 size, uint256 replicationFactor)",
    "event DataRemoved(string indexed root, uint256 size)",
    "event NodeRegistered(string indexed nodeAddress, uint256 totalStorage)",
    "event NodeUpdated(string indexed nodeAddress, uint256 usedStorage, uint256 reliability)",
    "event IntegrityViolation(string indexed root, string indexed nodeAddress, bytes32 expectedHash, bytes32 actualHash)"
];
/**
 * Service for interacting with the StorageOracle smart contract
 */
class StorageOracleService {
    constructor() {
        this.wallet = null;
        this.contract = null;
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.zg.chainRpcUrl);
        this.contractAddress = config_1.config.contracts.storageOracle;
        if (config_1.config.zg.privateKey && this.contractAddress) {
            this.wallet = new ethers_1.ethers.Wallet(config_1.config.zg.privateKey, this.provider);
            this.contract = new ethers_1.ethers.Contract(this.contractAddress, STORAGE_ORACLE_ABI, this.wallet);
            console.log(`StorageOracleService initialized with wallet: ${this.wallet.address}`);
            console.log(`Contract address: ${this.contractAddress}`);
        }
        else {
            if (!this.contractAddress) {
                console.warn('StorageOracle contract address not configured');
            }
            if (!config_1.config.zg.privateKey) {
                console.warn('Private key not configured - read-only mode');
            }
            // Read-only contract for queries
            if (this.contractAddress) {
                this.contract = new ethers_1.ethers.Contract(this.contractAddress, STORAGE_ORACLE_ABI, this.provider);
            }
        }
    }
    /**
     * Check if the service is properly configured
     */
    isConfigured() {
        return !!this.contract && !!this.contractAddress;
    }
    /**
     * Register data storage on the blockchain
     */
    async registerDataStorage(root, nodeAddresses, size, integrityHash) {
        if (!this.contract || !this.wallet) {
            throw new Error('StorageOracle contract or wallet not configured');
        }
        const hashToUse = integrityHash || ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify({
            root,
            nodeAddresses,
            size,
            timestamp: Date.now()
        })));
        console.log(`💾 Registering data storage for ${root} on blockchain...`);
        try {
            const tx = await this.contract.registerDataStorage(root, nodeAddresses, size, hashToUse);
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Data storage registered in block ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error registering data storage:', error);
            throw new Error(`Failed to register data storage: ${error}`);
        }
    }
    /**
     * Remove data storage registration
     */
    async removeDataStorage(root) {
        if (!this.contract || !this.wallet) {
            throw new Error('StorageOracle contract or wallet not configured');
        }
        console.log(`🗑️ Removing data storage for ${root} from blockchain...`);
        try {
            const tx = await this.contract.removeDataStorage(root);
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Data storage removed in block ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error removing data storage:', error);
            throw new Error(`Failed to remove data storage: ${error}`);
        }
    }
    /**
     * Get storage entry information
     */
    async getStorageEntry(root) {
        if (!this.contract) {
            throw new Error('StorageOracle contract not configured');
        }
        try {
            const result = await this.contract.getStorageEntry(root);
            if (!result.isActive) {
                return null;
            }
            return {
                root: result.root,
                nodeAddresses: result.nodeAddresses,
                size: Number(result.size),
                replicationFactor: Number(result.replicationFactor),
                timestamp: Number(result.timestamp),
                isActive: result.isActive,
                integrityHash: result.integrityHash
            };
        }
        catch (error) {
            console.error('Error getting storage entry:', error);
            return null;
        }
    }
    /**
     * Register a storage node
     */
    async registerNode(nodeAddress, totalStorage) {
        if (!this.contract || !this.wallet) {
            throw new Error('StorageOracle contract or wallet not configured');
        }
        console.log(`🔧 Registering storage node ${nodeAddress} on blockchain...`);
        try {
            const tx = await this.contract.registerNode(nodeAddress, totalStorage);
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Node registered in block ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error registering node:', error);
            throw new Error(`Failed to register node: ${error}`);
        }
    }
    /**
     * Update node status
     */
    async updateNodeStatus(nodeAddress, usedStorage, reliability) {
        if (!this.contract || !this.wallet) {
            throw new Error('StorageOracle contract or wallet not configured');
        }
        try {
            const tx = await this.contract.updateNodeStatus(nodeAddress, usedStorage, reliability);
            const receipt = await tx.wait();
            return tx.hash;
        }
        catch (error) {
            console.error('Error updating node status:', error);
            throw new Error(`Failed to update node status: ${error}`);
        }
    }
    /**
     * Get storage node information
     */
    async getStorageNode(nodeAddress) {
        if (!this.contract) {
            throw new Error('StorageOracle contract not configured');
        }
        try {
            const result = await this.contract.getStorageNode(nodeAddress);
            if (!result.isActive) {
                return null;
            }
            return {
                nodeAddress: result.nodeAddress,
                totalStorage: Number(result.totalStorage),
                usedStorage: Number(result.usedStorage),
                reliability: Number(result.reliability),
                lastSeen: Number(result.lastSeen),
                isActive: result.isActive
            };
        }
        catch (error) {
            console.error('Error getting storage node:', error);
            return null;
        }
    }
    /**
     * Get all active storage roots
     */
    async getActiveRoots() {
        if (!this.contract) {
            throw new Error('StorageOracle contract not configured');
        }
        try {
            return await this.contract.getActiveRoots();
        }
        catch (error) {
            console.error('Error getting active roots:', error);
            return [];
        }
    }
    /**
     * Get all active storage nodes
     */
    async getActiveNodes() {
        if (!this.contract) {
            throw new Error('StorageOracle contract not configured');
        }
        try {
            return await this.contract.getActiveNodes();
        }
        catch (error) {
            console.error('Error getting active nodes:', error);
            return [];
        }
    }
    /**
     * Get storage network statistics
     */
    async getStorageStats() {
        if (!this.contract) {
            throw new Error('StorageOracle contract not configured');
        }
        try {
            const [totalStoredData, totalActiveNodes, totalActiveRoots, minReplicationFactor] = await this.contract.getStorageStats();
            return {
                totalStoredData: Number(totalStoredData),
                totalActiveNodes: Number(totalActiveNodes),
                totalActiveRoots: Number(totalActiveRoots),
                minReplicationFactor: Number(minReplicationFactor)
            };
        }
        catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                totalStoredData: 0,
                totalActiveNodes: 0,
                totalActiveRoots: 0,
                minReplicationFactor: 3
            };
        }
    }
    /**
     * Check if data has sufficient replication
     */
    async hasSufficientReplication(root) {
        if (!this.contract) {
            return false;
        }
        try {
            return await this.contract.hasSufficientReplication(root);
        }
        catch (error) {
            console.error('Error checking replication:', error);
            return false;
        }
    }
    /**
     * Verify data integrity
     */
    async verifyIntegrity(root, nodeAddress, actualHash) {
        if (!this.contract || !this.wallet) {
            throw new Error('StorageOracle contract or wallet not configured');
        }
        try {
            const tx = await this.contract.verifyIntegrity(root, nodeAddress, actualHash);
            const receipt = await tx.wait();
            return tx.hash;
        }
        catch (error) {
            console.error('Error verifying integrity:', error);
            throw new Error(`Failed to verify integrity: ${error}`);
        }
    }
    /**
     * Request data replication
     */
    async requestReplication(root, targetReplicas) {
        if (!this.contract || !this.wallet) {
            throw new Error('StorageOracle contract or wallet not configured');
        }
        try {
            const tx = await this.contract.requestReplication(root, targetReplicas);
            const receipt = await tx.wait();
            return tx.hash;
        }
        catch (error) {
            console.error('Error requesting replication:', error);
            throw new Error(`Failed to request replication: ${error}`);
        }
    }
    /**
     * Get comprehensive network health information
     */
    async getNetworkHealth() {
        try {
            const [stats, activeNodes, activeRoots] = await Promise.all([
                this.getStorageStats(),
                this.getActiveNodes(),
                this.getActiveRoots()
            ]);
            // Check replication health for recent roots (limit to avoid too many calls)
            const recentRoots = activeRoots.slice(-10);
            const replicationHealth = await Promise.all(recentRoots.map(async (root) => ({
                root,
                sufficient: await this.hasSufficientReplication(root)
            })));
            return {
                stats,
                activeNodes,
                activeRoots,
                replicationHealth
            };
        }
        catch (error) {
            console.error('Error getting network health:', error);
            return {
                stats: {
                    totalStoredData: 0,
                    totalActiveNodes: 0,
                    totalActiveRoots: 0,
                    minReplicationFactor: 3
                },
                activeNodes: [],
                activeRoots: [],
                replicationHealth: []
            };
        }
    }
    /**
     * Get service status information
     */
    getServiceInfo() {
        return {
            configured: this.isConfigured(),
            contractAddress: this.contractAddress,
            walletAddress: this.wallet?.address,
            network: config_1.config.zg.chainRpcUrl,
            chainId: config_1.config.zg.chainId
        };
    }
}
exports.StorageOracleService = StorageOracleService;
//# sourceMappingURL=StorageOracleService.js.map