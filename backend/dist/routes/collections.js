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
exports.collectionRoutes = collectionRoutes;
async function collectionRoutes(fastify, vectorEngine, embeddingService, storageService) {
    // Cleanup redundant default collections (admin endpoint)
    fastify.delete('/collections/cleanup-defaults', async (request, reply) => {
        try {
            const allCollections = await vectorEngine.listCollections();
            // More aggressive cleanup: remove all "default" collections regardless of count
            const defaultCollections = allCollections.filter((c) => c.name.toLowerCase() === 'default');
            console.log(`🧹 Found ${defaultCollections.length} default collections to cleanup`);
            let deleted = 0;
            for (const collection of defaultCollections) {
                const success = await vectorEngine.deleteCollection(collection.id);
                if (success) {
                    deleted++;
                    console.log(`🗑️ Deleted default collection: ${collection.id}`);
                }
            }
            reply.send({
                success: true,
                message: `Cleaned up ${deleted} default collections`,
                deletedCount: deleted,
                remainingCollections: allCollections.length - deleted
            });
        }
        catch (error) {
            reply.status(500).send({
                error: 'Cleanup failed',
                message: error.message
            });
        }
    });
    // Create a new collection
    fastify.post('/collections', async (request, reply) => {
        try {
            const { name, dimension, description } = request.body;
            if (!name) {
                return reply.status(400).send({ error: 'Collection name is required' });
            }
            const collectionId = await vectorEngine.createCollection(name, dimension);
            const collection = vectorEngine.getCollection(collectionId);
            reply.send({
                success: true,
                collection: {
                    ...collection,
                    description,
                },
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to create collection: ${error}` });
        }
    });
    // List all collections (filtered to exclude default test collections)
    fastify.get('/collections', async (request, reply) => {
        try {
            const allCollections = await vectorEngine.listCollections();
            // Filter out default test collections
            const collections = allCollections.filter((c) => c.name.toLowerCase() !== 'default');
            reply.send({ success: true, collections });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to list collections: ${error}` });
        }
    });
    // Get collection details with blockchain metadata
    fastify.get('/collections/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const collection = vectorEngine.getCollection(id);
            if (!collection) {
                return reply.status(404).send({ error: 'Collection not found' });
            }
            // Try to get blockchain metadata
            let blockchainData = null;
            try {
                const vectorRegistryService = new (await Promise.resolve().then(() => __importStar(require('../services/VectorRegistryService')))).VectorRegistryService();
                if (vectorRegistryService.isConfigured()) {
                    blockchainData = await vectorRegistryService.getCollection(id, true);
                }
            }
            catch (error) {
                console.warn('Could not fetch blockchain data:', error);
            }
            const enrichedCollection = {
                ...collection,
                owner: blockchainData?.owner,
                txHash: blockchainData?.txHash,
                blockNumber: blockchainData?.blockNumber,
                blockHash: blockchainData?.blockHash,
                storageRoot: blockchainData?.storageRoot,
                isPublic: blockchainData?.isPublic
            };
            reply.send({ success: true, collection: enrichedCollection });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to get collection: ${error}` });
        }
    });
    // Delete a collection
    fastify.delete('/collections/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const deleted = await vectorEngine.deleteCollection(id);
            if (!deleted) {
                return reply.status(404).send({ error: 'Collection not found' });
            }
            reply.send({ success: true, message: 'Collection deleted successfully' });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to delete collection: ${error}` });
        }
    });
    // Insert a single vector
    fastify.post('/collections/:id/vectors', async (request, reply) => {
        try {
            const { id } = request.params;
            const { vector, text, metadata = {} } = request.body;
            if (!vector && !text) {
                return reply.status(400).send({ error: 'Either vector or text is required' });
            }
            let finalVector;
            if (vector) {
                finalVector = vector;
            }
            else if (text) {
                const embedding = await embeddingService.generateEmbedding(text);
                finalVector = embedding.vector;
                metadata.text = text;
                metadata.embeddingModel = embedding.model;
                metadata.tokens = embedding.tokens;
            }
            else {
                return reply.status(400).send({ error: 'Invalid input' });
            }
            const vectorId = await vectorEngine.insertVector(id, finalVector, metadata);
            reply.send({
                success: true,
                vectorId,
                dimension: finalVector.length,
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to insert vector: ${error}` });
        }
    });
    // Batch insert vectors
    fastify.post('/collections/:id/vectors/batch', async (request, reply) => {
        try {
            const { id } = request.params;
            const { vectors } = request.body;
            if (!vectors || !Array.isArray(vectors)) {
                return reply.status(400).send({ error: 'Vectors array is required' });
            }
            const processedVectors = [];
            for (const item of vectors) {
                let finalVector;
                const metadata = item.metadata || {};
                if (item.vector) {
                    finalVector = item.vector;
                }
                else if (item.text) {
                    const embedding = await embeddingService.generateEmbedding(item.text);
                    finalVector = embedding.vector;
                    metadata.text = item.text;
                    metadata.embeddingModel = embedding.model;
                    metadata.tokens = embedding.tokens;
                }
                else {
                    continue; // Skip invalid items
                }
                processedVectors.push({ vector: finalVector, metadata });
            }
            const vectorIds = await vectorEngine.insertVectors(id, processedVectors);
            reply.send({
                success: true,
                insertedCount: vectorIds.length,
                vectorIds,
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to batch insert vectors: ${error}` });
        }
    });
    // Search vectors
    fastify.post('/collections/:id/search', async (request, reply) => {
        try {
            const { id } = request.params;
            const { query, k = 10, filter } = request.body;
            if (!query) {
                return reply.status(400).send({ error: 'Query is required' });
            }
            let queryVector;
            if (Array.isArray(query)) {
                queryVector = query;
            }
            else if (typeof query === 'string') {
                const embedding = await embeddingService.generateEmbedding(query);
                queryVector = embedding.vector;
            }
            else {
                return reply.status(400).send({ error: 'Query must be a string or number array' });
            }
            // Create filter function if filter object is provided
            let filterFn;
            if (filter) {
                filterFn = (metadata) => {
                    return Object.entries(filter).every(([key, value]) => {
                        return metadata[key] === value;
                    });
                };
            }
            const results = await vectorEngine.searchVectors(id, queryVector, k, filterFn);
            reply.send({
                success: true,
                results,
                query: typeof query === 'string' ? query : '[vector]',
                k: results.length,
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to search vectors: ${error}` });
        }
    });
    // Get a specific vector
    fastify.get('/collections/:id/vectors/:vectorId', async (request, reply) => {
        try {
            const { id, vectorId } = request.params;
            const vector = vectorEngine.getVector(id, vectorId);
            if (!vector) {
                return reply.status(404).send({ error: 'Vector not found' });
            }
            reply.send({ success: true, vector });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to get vector: ${error}` });
        }
    });
    // Delete a vector
    fastify.delete('/collections/:id/vectors/:vectorId', async (request, reply) => {
        try {
            const { id, vectorId } = request.params;
            const deleted = await vectorEngine.deleteVector(id, vectorId);
            if (!deleted) {
                return reply.status(404).send({ error: 'Vector not found' });
            }
            reply.send({ success: true, message: 'Vector deleted successfully' });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to delete vector: ${error}` });
        }
    });
    // Export collection to 0G Storage
    fastify.post('/collections/:id/export', async (request, reply) => {
        try {
            const { id } = request.params;
            const collection = vectorEngine.getCollection(id);
            if (!collection) {
                return reply.status(404).send({ error: 'Collection not found' });
            }
            // Get all vectors in collection (simplified - in production, handle large collections efficiently)
            const vectors = [];
            // This is a simplified export - in production, you'd implement proper pagination
            const metadata = await storageService.uploadVectorCollection(id, vectors, {
                name: collection.name,
                dimension: collection.dimension,
                count: collection.count,
                exportedAt: Date.now(),
            });
            reply.send({
                success: true,
                message: 'Collection exported to 0G Storage',
                storageRoot: metadata.root,
                size: metadata.size,
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to export collection: ${error}` });
        }
    });
    // Get collections by owner address
    fastify.get('/collections/by-owner/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const allCollections = await vectorEngine.listCollections();
            // Get blockchain data for all collections and filter by owner
            const vectorRegistryService = new (await Promise.resolve().then(() => __importStar(require('../services/VectorRegistryService')))).VectorRegistryService();
            if (!vectorRegistryService.isConfigured()) {
                return reply.status(503).send({
                    error: 'VectorRegistry not configured',
                    message: 'Cannot filter by owner without blockchain connection'
                });
            }
            const ownerCollections = [];
            for (const collection of allCollections) {
                try {
                    const blockchainData = await vectorRegistryService.getCollection(collection.id, true);
                    if (blockchainData && blockchainData.owner.toLowerCase() === address.toLowerCase()) {
                        ownerCollections.push({
                            ...collection,
                            owner: blockchainData.owner,
                            txHash: blockchainData.txHash,
                            blockNumber: blockchainData.blockNumber,
                            blockHash: blockchainData.blockHash,
                            storageRoot: blockchainData.storageRoot,
                            isPublic: blockchainData.isPublic
                        });
                    }
                }
                catch (error) {
                    console.warn(`Could not fetch blockchain data for collection ${collection.id}:`, error);
                }
            }
            reply.send({
                success: true,
                collections: ownerCollections,
                owner: address,
                count: ownerCollections.length
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to get collections by owner: ${error}` });
        }
    });
    // Get all vectors in a collection
    fastify.get('/collections/:id/vectors', async (request, reply) => {
        try {
            const { id } = request.params;
            const { limit = 100, offset = 0 } = request.query;
            const collection = vectorEngine.getCollection(id);
            if (!collection) {
                return reply.status(404).send({ error: 'Collection not found' });
            }
            const vectors = vectorEngine.getCollectionVectors(id, Number(limit), Number(offset));
            const totalCount = vectorEngine.getCollectionVectorCount(id);
            reply.send({
                success: true,
                collectionId: id,
                vectors,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    total: totalCount,
                    hasMore: Number(offset) + vectors.length < totalCount
                }
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to get vectors: ${error}` });
        }
    });
    // Get full details of a specific vector
    fastify.get('/collections/:id/vectors/:vectorId/full', async (request, reply) => {
        try {
            const { id, vectorId } = request.params;
            const vector = vectorEngine.getVector(id, vectorId);
            if (!vector) {
                return reply.status(404).send({ error: 'Vector not found' });
            }
            reply.send({
                success: true,
                vector: {
                    id: vector.id,
                    metadata: vector.metadata,
                    timestamp: vector.timestamp,
                    embedding: vector.vector,
                    dimension: vector.vector.length
                }
            });
        }
        catch (error) {
            reply.status(500).send({ error: `Failed to get vector details: ${error}` });
        }
    });
}
//# sourceMappingURL=collections.js.map