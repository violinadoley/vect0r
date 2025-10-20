import * as hnswlib from 'hnswlib-node';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { VectorRegistryService, CollectionInfo } from '../services/VectorRegistryService';
import { StorageOracleService } from '../services/StorageOracleService';

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

export class VectorEngine {
  private indices: Map<string, any> = new Map();
  private documents: Map<string, Map<string, VectorDocument>> = new Map();
  private collections: Map<string, Collection> = new Map();
  private vectorRegistryService: VectorRegistryService;
  private storageOracleService: StorageOracleService;

  constructor() {
    this.vectorRegistryService = new VectorRegistryService();
    this.storageOracleService = new StorageOracleService();
    this.initializeEngine();
  }

  private initializeEngine(): void {
    console.log('Initializing VectorEngine with HNSW indexing...');
    console.log(`Vector dimension: ${config.vector.dimension}`);
    console.log(`HNSW parameters: M=${config.vector.hnsw.m}, efConstruction=${config.vector.hnsw.efConstruction}`);
  }

  /**
   * Create a new vector collection
   */
  async createCollection(
    name: string, 
    dimension: number = config.vector.dimension,
    description: string = '',
    isPublic: boolean = true,
    allowDefaultName: boolean = false
  ): Promise<string> {
    // Prevent creating collections named "default" unless explicitly allowed
    if (name.toLowerCase() === 'default' && !allowDefaultName) {
      throw new Error('Cannot create collections named "default". Please choose a different name.');
    }
    
    const collectionId = uuidv4();
    
    // Initialize HNSW index
    const index = new hnswlib.HierarchicalNSW('cosine', dimension);
    index.initIndex(10000, config.vector.hnsw.m, config.vector.hnsw.efConstruction);
    
    // Store collection metadata locally
    const collection: Collection = {
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
        await this.vectorRegistryService.createCollection(
          collectionId,
          name,
          description,
          dimension,
          isPublic
        );
        console.log(`✅ Collection created on blockchain: ${collectionId}`);
      } else {
        console.log(`⚠️ VectorRegistry not configured, collection created locally only`);
      }
    } catch (error) {
      console.error('Error creating collection on blockchain:', error);
      console.log('📝 Collection created locally, blockchain sync failed');
    }

    console.log(`Created collection: ${name} (${collectionId})`);
    return collectionId;
  }

  /**
   * Get collection information
   */
  getCollection(collectionId: string): Collection | null {
    return this.collections.get(collectionId) || null;
  }

  /**
   * List all collections (local and blockchain)
   */
  async listCollections(): Promise<Collection[]> {
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
              const localCollection: Collection = {
                id: collectionId,
                name: blockchainCollection.name,
                dimension: blockchainCollection.dimension,
                count: blockchainCollection.vectorCount,
                created: blockchainCollection.createdAt * 1000, // Convert to milliseconds
                updated: blockchainCollection.updatedAt * 1000,
              };
              
              // Initialize HNSW index for this collection
              const index = new hnswlib.HierarchicalNSW('cosine', blockchainCollection.dimension);
              index.initIndex(10000, config.vector.hnsw.m, config.vector.hnsw.efConstruction);
              
              this.indices.set(collectionId, index);
              this.documents.set(collectionId, new Map());
              this.collections.set(collectionId, localCollection);
              
              console.log(`📥 Synced collection from blockchain: ${blockchainCollection.name} (${collectionId})`);
            }
          }
        }
        
        return Array.from(this.collections.values());
      }
    } catch (error) {
      console.error('Error syncing collections from blockchain:', error);
    }
    
    return localCollections;
  }

  /**
   * Insert a vector document into a collection
   */
  async insertVector(
    collectionId: string,
    vector: number[],
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const index = this.indices.get(collectionId);
    const docs = this.documents.get(collectionId);
    const collection = this.collections.get(collectionId);

    if (!index || !docs || !collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    if (vector.length !== collection.dimension) {
      throw new Error(`Vector dimension ${vector.length} does not match collection dimension ${collection.dimension}`);
    }

    const docId = uuidv4();
    const document: VectorDocument = {
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
  async insertVectors(
    collectionId: string,
    vectors: { vector: number[]; metadata?: Record<string, any> }[]
  ): Promise<string[]> {
    const ids: string[] = [];
    
    for (const { vector, metadata = {} } of vectors) {
      const id = await this.insertVector(collectionId, vector, metadata);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Search for similar vectors
   */
  async searchVectors(
    collectionId: string,
    queryVector: number[],
    k: number = 10,
    filter?: (metadata: Record<string, any>) => boolean
  ): Promise<SearchResult[]> {
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
      index.setEf(Math.max(config.vector.hnsw.efSearch, k));
    } catch (e) {
      // Method might not exist in this version
    }

    // Perform HNSW search
    const result = index.searchKnn(queryVector, k * 2); // Get more results for filtering

    const searchResults: SearchResult[] = [];
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
  getVector(collectionId: string, docId: string): VectorDocument | null {
    const docs = this.documents.get(collectionId);
    if (!docs) return null;
    return docs.get(docId) || null;
  }

  /**
   * Delete a vector document
   */
  async deleteVector(collectionId: string, docId: string): Promise<boolean> {
    const docs = this.documents.get(collectionId);
    const collection = this.collections.get(collectionId);

    if (!docs || !collection) return false;

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
  async deleteCollection(collectionId: string): Promise<boolean> {
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
  getCollectionVectors(
    collectionId: string, 
    limit: number = 100, 
    offset: number = 0
  ): VectorDocument[] {
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
  getCollectionVectorCount(collectionId: string): number {
    const docs = this.documents.get(collectionId);
    if (!docs) return 0;
    return docs.size;
  }

  /**
   * Get engine statistics
   */
  getStats(): {
    collections: number;
    totalVectors: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
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
    } catch (error) {
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
