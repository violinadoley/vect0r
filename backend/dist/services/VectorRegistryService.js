"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorRegistryService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
// VectorRegistry ABI - Essential functions only
const VECTOR_REGISTRY_ABI = [
    // Collection management
    "function createCollection(string calldata collectionId, string calldata name, string calldata description, uint256 dimension, bool isPublic) external",
    "function updateCollection(string calldata collectionId, string calldata storageRoot, uint256 vectorCount, bytes32 metadataHash) external",
    "function getCollection(string calldata collectionId) external view returns (tuple(string name, string description, uint256 dimension, uint256 vectorCount, address owner, bool isPublic, uint256 createdAt, uint256 updatedAt, string storageRoot, bytes32 metadataHash))",
    "function getAllCollections() external view returns (string[] memory)",
    // Vector metadata management
    "function addVectorMetadata(string calldata collectionId, string calldata vectorId, string calldata storageHash, bytes32 contentHash) external",
    "function getVectorMetadata(string calldata collectionId, string calldata vectorId) external view returns (string memory, string memory, uint256, bytes32)",
    "function setVectorAttribute(string calldata collectionId, string calldata vectorId, string calldata key, string calldata value) external",
    "function getVectorAttribute(string calldata collectionId, string calldata vectorId, string calldata key) external view returns (string memory)",
    // Access control
    "function grantAccess(string calldata collectionId, address user) external",
    "function revokeAccess(string calldata collectionId, address user) external",
    "function hasAccess(string calldata collectionId, address user) external view returns (bool)",
    // Statistics
    "function getStats() external view returns (uint256, uint256, uint256)",
    "function getUserCollections(address user) external view returns (string[] memory)",
    // Events
    "event CollectionCreated(string indexed collectionId, string name, address indexed owner, uint256 dimension)",
    "event CollectionUpdated(string indexed collectionId, string storageRoot, uint256 vectorCount)",
    "event VectorAdded(string indexed collectionId, string indexed vectorId, address indexed user, string storageHash)"
];
/**
 * Service for interacting with the VectorRegistry smart contract
 */
class VectorRegistryService {
    constructor() {
        this.wallet = null;
        this.contract = null;
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.zg.chainRpcUrl);
        this.contractAddress = config_1.config.contracts.vectorRegistry;
        if (config_1.config.zg.privateKey && this.contractAddress) {
            this.wallet = new ethers_1.ethers.Wallet(config_1.config.zg.privateKey, this.provider);
            this.contract = new ethers_1.ethers.Contract(this.contractAddress, VECTOR_REGISTRY_ABI, this.wallet);
            console.log(`VectorRegistryService initialized with wallet: ${this.wallet.address}`);
            console.log(`Contract address: ${this.contractAddress}`);
        }
        else {
            if (!this.contractAddress) {
                console.warn('VectorRegistry contract address not configured');
            }
            if (!config_1.config.zg.privateKey) {
                console.warn('Private key not configured - read-only mode');
            }
            // Read-only contract for queries
            if (this.contractAddress) {
                this.contract = new ethers_1.ethers.Contract(this.contractAddress, VECTOR_REGISTRY_ABI, this.provider);
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
     * Create a new collection on the blockchain
     */
    async createCollection(collectionId, name, description, dimension = 768, isPublic = true) {
        if (!this.contract || !this.wallet) {
            throw new Error('VectorRegistry contract or wallet not configured');
        }
        console.log(`📋 Creating collection ${collectionId} on blockchain...`);
        try {
            // Get current nonce and use higher gas price to avoid "replacement fee too low"
            const nonce = await this.wallet.getNonce();
            const tx = await this.contract.createCollection(collectionId, name, description, dimension, isPublic, {
                nonce: nonce,
                gasLimit: 500000,
                gasPrice: ethers_1.ethers.parseUnits('30', 'gwei') // Higher gas price
            });
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Collection created in block ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error creating collection:', error);
            throw new Error(`Failed to create collection: ${error}`);
        }
    }
    /**
     * Update collection metadata on the blockchain
     */
    async updateCollection(collectionId, storageRoot, vectorCount, metadataHash) {
        if (!this.contract || !this.wallet) {
            throw new Error('VectorRegistry contract or wallet not configured');
        }
        const hashToUse = metadataHash || ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify({
            collectionId,
            storageRoot,
            vectorCount,
            timestamp: Date.now()
        })));
        console.log(`📝 Updating collection ${collectionId} on blockchain...`);
        try {
            const tx = await this.contract.updateCollection(collectionId, storageRoot, vectorCount, hashToUse);
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Collection updated in block ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error updating collection:', error);
            throw new Error(`Failed to update collection: ${error}`);
        }
    }
    /**
     * Get collection information from the blockchain
     */
    async getCollection(collectionId, includeTxDetails = false) {
        if (!this.contract) {
            throw new Error('VectorRegistry contract not configured');
        }
        try {
            const result = await this.contract.getCollection(collectionId);
            // Check if collection exists (owner address is not zero)
            if (result.owner === ethers_1.ethers.ZeroAddress) {
                return null;
            }
            const collectionInfo = {
                name: result.name,
                description: result.description,
                dimension: Number(result.dimension),
                vectorCount: Number(result.vectorCount),
                owner: result.owner,
                isPublic: result.isPublic,
                createdAt: Number(result.createdAt),
                updatedAt: Number(result.updatedAt),
                storageRoot: result.storageRoot,
                metadataHash: result.metadataHash
            };
            // Optionally fetch transaction details
            if (includeTxDetails) {
                try {
                    const txDetails = await this.getCollectionTransactionDetails(collectionId);
                    if (txDetails) {
                        collectionInfo.txHash = txDetails.txHash;
                        collectionInfo.blockNumber = txDetails.blockNumber;
                        collectionInfo.blockHash = txDetails.blockHash;
                    }
                }
                catch (err) {
                    console.warn('Could not fetch transaction details:', err);
                }
            }
            return collectionInfo;
        }
        catch (error) {
            console.error('Error getting collection:', error);
            return null;
        }
    }
    /**
     * Get transaction details for a collection by listening to past events
     */
    async getCollectionTransactionDetails(collectionId) {
        if (!this.contract) {
            return null;
        }
        try {
            // Query for CollectionCreated events for this collection
            const filter = this.contract.filters.CollectionCreated(collectionId);
            const events = await this.contract.queryFilter(filter, -10000); // Last ~10k blocks
            if (events.length > 0) {
                const event = events[0]; // Get the first (creation) event
                const block = await event.getBlock();
                return {
                    txHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    blockHash: block.hash || ''
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error fetching transaction details:', error);
            return null;
        }
    }
    /**
     * Get all collection IDs
     */
    async getAllCollections() {
        if (!this.contract) {
            throw new Error('VectorRegistry contract not configured');
        }
        try {
            return await this.contract.getAllCollections();
        }
        catch (error) {
            console.error('Error getting all collections:', error);
            return [];
        }
    }
    /**
     * Add vector metadata to the blockchain
     */
    async addVectorMetadata(collectionId, vectorId, storageHash, contentHash) {
        if (!this.contract || !this.wallet) {
            throw new Error('VectorRegistry contract or wallet not configured');
        }
        const hashToUse = contentHash || ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify({
            collectionId,
            vectorId,
            storageHash,
            timestamp: Date.now()
        })));
        console.log(`📊 Adding vector metadata for ${vectorId} to blockchain...`);
        try {
            const tx = await this.contract.addVectorMetadata(collectionId, vectorId, storageHash, hashToUse);
            console.log(`⏳ Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Vector metadata added in block ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('Error adding vector metadata:', error);
            throw new Error(`Failed to add vector metadata: ${error}`);
        }
    }
    /**
     * Get vector metadata from the blockchain
     */
    async getVectorMetadata(collectionId, vectorId) {
        if (!this.contract) {
            throw new Error('VectorRegistry contract not configured');
        }
        try {
            const [storageHash, returnedCollectionId, timestamp, contentHash] = await this.contract.getVectorMetadata(collectionId, vectorId);
            if (!storageHash) {
                return null;
            }
            return {
                storageHash,
                collectionId: returnedCollectionId,
                timestamp: Number(timestamp),
                contentHash
            };
        }
        catch (error) {
            console.error('Error getting vector metadata:', error);
            return null;
        }
    }
    /**
     * Set vector attribute
     */
    async setVectorAttribute(collectionId, vectorId, key, value) {
        if (!this.contract || !this.wallet) {
            throw new Error('VectorRegistry contract or wallet not configured');
        }
        try {
            const tx = await this.contract.setVectorAttribute(collectionId, vectorId, key, value);
            const receipt = await tx.wait();
            return tx.hash;
        }
        catch (error) {
            console.error('Error setting vector attribute:', error);
            throw new Error(`Failed to set vector attribute: ${error}`);
        }
    }
    /**
     * Get contract statistics
     */
    async getStats() {
        if (!this.contract) {
            throw new Error('VectorRegistry contract not configured');
        }
        try {
            const [totalCollections, totalVectors, totalIds] = await this.contract.getStats();
            return {
                totalCollections: Number(totalCollections),
                totalVectors: Number(totalVectors),
                totalIds: Number(totalIds)
            };
        }
        catch (error) {
            console.error('Error getting contract stats:', error);
            return {
                totalCollections: 0,
                totalVectors: 0,
                totalIds: 0
            };
        }
    }
    /**
     * Check if user has access to collection
     */
    async hasAccess(collectionId, userAddress) {
        if (!this.contract) {
            return false;
        }
        const addressToCheck = userAddress || this.wallet?.address;
        if (!addressToCheck) {
            return false;
        }
        try {
            return await this.contract.hasAccess(collectionId, addressToCheck);
        }
        catch (error) {
            console.error('Error checking access:', error);
            return false;
        }
    }
    /**
     * Get user's collections
     */
    async getUserCollections(userAddress) {
        if (!this.contract) {
            return [];
        }
        const addressToCheck = userAddress || this.wallet?.address;
        if (!addressToCheck) {
            return [];
        }
        try {
            return await this.contract.getUserCollections(addressToCheck);
        }
        catch (error) {
            console.error('Error getting user collections:', error);
            return [];
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
exports.VectorRegistryService = VectorRegistryService;
//# sourceMappingURL=VectorRegistryService.js.map