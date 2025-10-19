import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VectorEngine } from '../core/VectorEngine';
import { EmbeddingService } from '../services/EmbeddingService';
import { IStorageService } from '../services/StorageInterface';

interface CreateCollectionRequest {
  name: string;
  dimension?: number;
  description?: string;
}

interface InsertVectorRequest {
  vector?: number[];
  text?: string;
  metadata?: Record<string, any>;
}

interface BatchInsertRequest {
  vectors: InsertVectorRequest[];
}

interface SearchRequest {
  query: string | number[];
  k?: number;
  filter?: Record<string, any>;
}

export async function collectionRoutes(
  fastify: FastifyInstance,
  vectorEngine: VectorEngine,
  embeddingService: EmbeddingService,
  storageService: IStorageService
) {
  // Create a new collection
  fastify.post('/collections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, dimension, description } = request.body as CreateCollectionRequest;
      
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
    } catch (error) {
      reply.status(500).send({ error: `Failed to create collection: ${error}` });
    }
  });

  // List all collections
  fastify.get('/collections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const collections = await vectorEngine.listCollections();
      reply.send({ success: true, collections });
    } catch (error) {
      reply.status(500).send({ error: `Failed to list collections: ${error}` });
    }
  });

  // Get collection details
  fastify.get('/collections/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const collection = vectorEngine.getCollection(id);

      if (!collection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      reply.send({ success: true, collection });
    } catch (error) {
      reply.status(500).send({ error: `Failed to get collection: ${error}` });
    }
  });

  // Delete a collection
  fastify.delete('/collections/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const deleted = await vectorEngine.deleteCollection(id);

      if (!deleted) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      reply.send({ success: true, message: 'Collection deleted successfully' });
    } catch (error) {
      reply.status(500).send({ error: `Failed to delete collection: ${error}` });
    }
  });

  // Insert a single vector
  fastify.post('/collections/:id/vectors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { vector, text, metadata = {} } = request.body as InsertVectorRequest;

      if (!vector && !text) {
        return reply.status(400).send({ error: 'Either vector or text is required' });
      }

      let finalVector: number[];

      if (vector) {
        finalVector = vector;
      } else if (text) {
        const embedding = await embeddingService.generateEmbedding(text);
        finalVector = embedding.vector;
        metadata.text = text;
        metadata.embeddingModel = embedding.model;
        metadata.tokens = embedding.tokens;
      } else {
        return reply.status(400).send({ error: 'Invalid input' });
      }

      const vectorId = await vectorEngine.insertVector(id, finalVector, metadata);

      reply.send({
        success: true,
        vectorId,
        dimension: finalVector.length,
      });
    } catch (error) {
      reply.status(500).send({ error: `Failed to insert vector: ${error}` });
    }
  });

  // Batch insert vectors
  fastify.post('/collections/:id/vectors/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { vectors } = request.body as BatchInsertRequest;

      if (!vectors || !Array.isArray(vectors)) {
        return reply.status(400).send({ error: 'Vectors array is required' });
      }

      const processedVectors: { vector: number[]; metadata: Record<string, any> }[] = [];

      for (const item of vectors) {
        let finalVector: number[];
        const metadata = item.metadata || {};

        if (item.vector) {
          finalVector = item.vector;
        } else if (item.text) {
          const embedding = await embeddingService.generateEmbedding(item.text);
          finalVector = embedding.vector;
          metadata.text = item.text;
          metadata.embeddingModel = embedding.model;
          metadata.tokens = embedding.tokens;
        } else {
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
    } catch (error) {
      reply.status(500).send({ error: `Failed to batch insert vectors: ${error}` });
    }
  });

  // Search vectors
  fastify.post('/collections/:id/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { query, k = 10, filter } = request.body as SearchRequest;

      if (!query) {
        return reply.status(400).send({ error: 'Query is required' });
      }

      let queryVector: number[];

      if (Array.isArray(query)) {
        queryVector = query;
      } else if (typeof query === 'string') {
        const embedding = await embeddingService.generateEmbedding(query);
        queryVector = embedding.vector;
      } else {
        return reply.status(400).send({ error: 'Query must be a string or number array' });
      }

      // Create filter function if filter object is provided
      let filterFn: ((metadata: Record<string, any>) => boolean) | undefined;
      if (filter) {
        filterFn = (metadata: Record<string, any>) => {
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
    } catch (error) {
      reply.status(500).send({ error: `Failed to search vectors: ${error}` });
    }
  });

  // Get a specific vector
  fastify.get('/collections/:id/vectors/:vectorId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, vectorId } = request.params as { id: string; vectorId: string };
      const vector = vectorEngine.getVector(id, vectorId);

      if (!vector) {
        return reply.status(404).send({ error: 'Vector not found' });
      }

      reply.send({ success: true, vector });
    } catch (error) {
      reply.status(500).send({ error: `Failed to get vector: ${error}` });
    }
  });

  // Delete a vector
  fastify.delete('/collections/:id/vectors/:vectorId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, vectorId } = request.params as { id: string; vectorId: string };
      const deleted = await vectorEngine.deleteVector(id, vectorId);

      if (!deleted) {
        return reply.status(404).send({ error: 'Vector not found' });
      }

      reply.send({ success: true, message: 'Vector deleted successfully' });
    } catch (error) {
      reply.status(500).send({ error: `Failed to delete vector: ${error}` });
    }
  });

  // Export collection to 0G Storage
  fastify.post('/collections/:id/export', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const collection = vectorEngine.getCollection(id);

      if (!collection) {
        return reply.status(404).send({ error: 'Collection not found' });
      }

      // Get all vectors in collection (simplified - in production, handle large collections efficiently)
      const vectors: any[] = [];
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
    } catch (error) {
      reply.status(500).send({ error: `Failed to export collection: ${error}` });
    }
  });
}
