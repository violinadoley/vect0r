"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorEngine = void 0;
const hnswlib = __importStar(require("hnswlib-node"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const VectorRegistryService_1 = require("../services/VectorRegistryService");
const StorageOracleService_1 = require("../services/StorageOracleService");
class VectorEngine {
    constructor() {
        this.indices = new Map();
        this.documents = new Map();
        this.collections = new Map();
        this.vectorRegistryService = new VectorRegistryService_1.VectorRegistryService();
        this.storageOracleService = new StorageOracleService_1.StorageOracleService();
        this.initializeEngine();
    }
    initializeEngine() {
        console.log('Initializing VectorEngine with HNSW indexing...');
        console.log(`Vector dimension: ${config_1.config.vector.dimension}`);
        console.log(`HNSW parameters: M=${config_1.config.vector.hnsw.m}, efConstruction=${config_1.config.vector.hnsw.efConstruction}`);
    }
    /**
     * Create a new vector collection
     */
    async createCollection(name, dimension = config_1.config.vector.dimension, description = '', isPublic = true, allowDefaultName = false) {
        // Prevent creating collections named "default" unless explicitly allowed
        if (name.toLowerCase() === 'default' && !allowDefaultName) {
            throw new Error('Cannot create collections named "default". Please choose a different name.');
        }
        const collectionId = (0, uuid_1.v4)();
        // Initialize HNSW index
        const index = new hnswlib.HierarchicalNSW('cosine', dimension);
        index.initIndex(10000, config_1.config.vector.hnsw.m, config_1.config.vector.hnsw.efConstruction);
        // Store collection metadata locally
        const collection = {
            id: collectionId,
            name,
            dimension,
            count: 0,
            created: Date.now(),
            updated: Date.now(),
        };
        this.indices.set(collectionId, index);
        this.documents.set(collectionId, new Map());
        this.collections.set(collectionId, collection);
        // Create collection on blockchain if contract service is configured
        try {
            if (this.vectorRegistryService.isConfigured()) {
                console.log(`📋 Creating collection on blockchain: ${name} (${collectionId})`);
                await this.vectorRegistryService.createCollection(collectionId, name, description, dimension, isPublic);
                console.log(`✅ Collection created on blockchain: ${collectionId}`);
            }
            else {
                console.log(`⚠️ VectorRegistry not configured, collection created locally only`);
            }
        }
        catch (error) {
            console.error('Error creating collection on blockchain:', error);
            console.log('📝 Collection created locally, blockchain sync failed');
        }
        console.log(`Created collection: ${name} (${collectionId})`);
        return collectionId;
    }
    /**
     * Get collection information
     */
    getCollection(collectionId) {
        return this.collections.get(collectionId) || null;
    }
    /**
     * List all collections (local and blockchain)
     */
    async listCollections() {
        const localCollections = Array.from(this.collections.values());
        // Try to get collections from blockchain as well
        try {
            if (this.vectorRegistryService.isConfigured()) {
                const blockchainCollectionIds = await this.vectorRegistryService.getAllCollections();
                // Sync any missing collections from blockchain
                for (const collectionId of blockchainCollectionIds) {
                    if (!this.collections.has(collectionId)) {
                        const blockchainCollection = await this.vectorRegistryService.getCollection(collectionId);
                        if (blockchainCollection) {
                            // Create local representation of blockchain collection
                            const localCollection = {
                                id: collectionId,
                                name: blockchainCollection.name,
                                dimension: blockchainCollection.dimension,
                                count: blockchainCollection.vectorCount,
                                created: blockchainCollection.createdAt * 1000, // Convert to milliseconds
                                updated: blockchainCollection.updatedAt * 1000,
                            };
                            // Initialize HNSW index for this collection
                            const index = new hnswlib.HierarchicalNSW('cosine', blockchainCollection.dimension);
                            index.initIndex(10000, config_1.config.vector.hnsw.m, config_1.config.vector.hnsw.efConstruction);
                            this.indices.set(collectionId, index);
                            this.documents.set(collectionId, new Map());
                            this.collections.set(collectionId, localCollection);
                            console.log(`📥 Synced collection from blockchain: ${blockchainCollection.name} (${collectionId})`);
                        }
                    }
                }
                return Array.from(this.collections.values());
            }
        }
        catch (error) {
            console.error('Error syncing collections from blockchain:', error);
        }
        return localCollections;
    }
    /**
     * Insert a vector document into a collection
     */
    async insertVector(collectionId, vector, metadata = {}) {
        const index = this.indices.get(collectionId);
        const docs = this.documents.get(collectionId);
        const collection = this.collections.get(collectionId);
        if (!index || !docs || !collection) {
            throw new Error(`Collection ${collectionId} not found`);
        }
        if (vector.length !== collection.dimension) {
            throw new Error(`Vector dimension ${vector.length} does not match collection dimension ${collection.dimension}`);
        }
        const docId = (0, uuid_1.v4)();
        const document = {
            id: docId,
            vector,
            metadata,
            timestamp: Date.now(),
        };
        // Add to HNSW index
        index.addPoint(vector, collection.count);
        // Store document
        docs.set(docId, document);
        // Update collection stats
        collection.count++;
        collection.updated = Date.now();
        console.log(`Inserted vector ${docId} into collection ${collectionId}`);
        return docId;
    }
    /**
     * Batch insert vectors
     */
    async insertVectors(collectionId, vectors) {
        const ids = [];
        for (const { vector, metadata = {} } of vectors) {
            const id = await this.insertVector(collectionId, vector, metadata);
            ids.push(id);
        }
        return ids;
    }
    /**
     * Search for similar vectors
     */
    async searchVectors(collectionId, queryVector, k = 10, filter) {
        const index = this.indices.get(collectionId);
        const docs = this.documents.get(collectionId);
        const collection = this.collections.get(collectionId);
        if (!index || !docs || !collection) {
            throw new Error(`Collection ${collectionId} not found`);
        }
        if (queryVector.length !== collection.dimension) {
            throw new Error(`Query vector dimension ${queryVector.length} does not match collection dimension ${collection.dimension}`);
        }
        if (collection.count === 0) {
            return [];
        }
        // Set search parameters (if method exists)
        try {
            index.setEf(Math.max(config_1.config.vector.hnsw.efSearch, k));
        }
        catch (e) {
            // Method might not exist in this version
        }
        // Perform HNSW search
        const result = index.searchKnn(queryVector, k * 2); // Get more results for filtering
        const searchResults = [];
        const docsArray = Array.from(docs.values());
        for (let i = 0; i < result.neighbors.length && searchResults.length < k; i++) {
            const neighborIndex = result.neighbors[i];
            const score = 1 - result.distances[i]; // Convert distance to similarity score
            if (neighborIndex < docsArray.length) {
                const doc = docsArray[neighborIndex];
                // Apply metadata filter if provided
                if (!filter || filter(doc.metadata)) {
                    searchResults.push({
                        id: doc.id,
                        score,
                        metadata: doc.metadata,
                    });
                }
            }
        }
        return searchResults;
    }
    /**
     * Get a specific vector document
     */
    getVector(collectionId, docId) {
        const docs = this.documents.get(collectionId);
        if (!docs)
            return null;
        return docs.get(docId) || null;
    }
    /**
     * Delete a vector document
     */
    async deleteVector(collectionId, docId) {
        const docs = this.documents.get(collectionId);
        const collection = this.collections.get(collectionId);
        if (!docs || !collection)
            return false;
        const deleted = docs.delete(docId);
        if (deleted) {
            collection.count--;
            collection.updated = Date.now();
            console.log(`Deleted vector ${docId} from collection ${collectionId}`);
        }
        return deleted;
    }
    /**
     * Delete an entire collection
     */
    async deleteCollection(collectionId) {
        const deleted = this.collections.delete(collectionId) &&
            this.indices.delete(collectionId) &&
            this.documents.delete(collectionId);
        if (deleted) {
            console.log(`Deleted collection ${collectionId}`);
        }
        return deleted;
    }
    /**
     * Get all vectors in a collection with pagination
     */
    getCollectionVectors(collectionId, limit = 100, offset = 0) {
        const docs = this.documents.get(collectionId);
        if (!docs) {
            throw new Error(`Collection ${collectionId} not found`);
        }
        const allVectors = Array.from(docs.values());
        return allVectors.slice(offset, offset + limit);
    }
    /**
     * Get total count of vectors in a collection
     */
    getCollectionVectorCount(collectionId) {
        const docs = this.documents.get(collectionId);
        if (!docs)
            return 0;
        return docs.size;
    }
    /**
     * Get engine statistics
     */
    getStats() {
        const totalVectors = Array.from(this.collections.values())
            .reduce((sum, collection) => sum + collection.count, 0);
        return {
            collections: this.collections.size,
            totalVectors,
            memoryUsage: process.memoryUsage(),
        };
    }
    /**
     * Get blockchain integration status
     */
    getBlockchainStatus() {
        return {
            vectorRegistry: this.vectorRegistryService.getServiceInfo(),
            storageOracle: this.storageOracleService.getServiceInfo(),
        };
    }
    /**
     * Get comprehensive stats including blockchain data
     */
    async getComprehensiveStats() {
        const localStats = this.getStats();
        const blockchainStatus = this.getBlockchainStatus();
        let contractStats = null;
        let storageStats = null;
        try {
            if (this.vectorRegistryService.isConfigured()) {
                contractStats = await this.vectorRegistryService.getStats();
            }
            if (this.storageOracleService.isConfigured()) {
                storageStats = await this.storageOracleService.getStorageStats();
            }
        }
        catch (error) {
            console.error('Error fetching blockchain stats:', error);
        }
        return {
            local: localStats,
            blockchain: {
                status: blockchainStatus,
                vectorRegistry: contractStats,
                storageOracle: storageStats,
            }
        };
    }
}
exports.VectorEngine = VectorEngine;
//# sourceMappingURL=VectorEngine.js.map