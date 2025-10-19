import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VectorEngine } from '../core/VectorEngine';
import { EmbeddingService } from '../services/EmbeddingService';
import { IStorageService } from '../services/StorageInterface';
import { config } from '../config';

export async function systemRoutes(
  fastify: FastifyInstance,
  vectorEngine: VectorEngine,
  embeddingService: EmbeddingService,
  storageService: IStorageService
) {
  // Health check endpoint
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // System statistics
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const comprehensiveStats = await vectorEngine.getComprehensiveStats();
      const embeddingStats = embeddingService.getStats();
      const storageStats = await storageService.getReal0GStats();

      reply.send({
        success: true,
        stats: {
          system: {
            nodeEnv: config.nodeEnv,
            uptime: process.uptime(),
            memory: comprehensiveStats.local.memoryUsage,
            timestamp: Date.now(),
          },
          vectors: {
            local: {
              collections: comprehensiveStats.local.collections,
              totalVectors: comprehensiveStats.local.totalVectors,
            },
            blockchain: comprehensiveStats.blockchain.vectorRegistry,
          },
          embedding: embeddingStats,
          storage: {
            real0g: storageStats,
            oracle: comprehensiveStats.blockchain.storageOracle,
          },
          blockchain: {
            status: comprehensiveStats.blockchain.status,
            chainId: config.zg.chainId,
            hasWallet: !!config.zg.privateKey,
            contracts: {
              vectorRegistry: config.contracts.vectorRegistry,
              storageOracle: config.contracts.storageOracle,
            },
          },
        },
      });
    } catch (error) {
      reply.status(500).send({ error: `Failed to get stats: ${error}` });
    }
  });

  // Configuration endpoint
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      success: true,
      config: {
        vector: {
          dimension: config.vector.dimension,
          hnsw: config.vector.hnsw,
        },
        zg: {
          chainId: config.zg.chainId,
          storageUrl: config.zg.storageUrl,
          indexerUrl: config.zg.indexerUrl,
        },
        server: {
          port: config.port,
          nodeEnv: config.nodeEnv,
          corsOrigin: config.corsOrigin,
        },
      },
    });
  });

  // Test embedding generation
  fastify.post('/test/embedding', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { text, model } = request.body as { text: string; model?: string };

      if (!text) {
        return reply.status(400).send({ error: 'Text is required' });
      }

      const embedding = await embeddingService.generateEmbedding(text, model);

      reply.send({
        success: true,
        embedding: {
          ...embedding,
          vector: embedding.vector.slice(0, 10), // Only show first 10 dimensions for brevity
          vectorLength: embedding.vector.length,
        },
        input: {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          originalLength: text.length,
        },
      });
    } catch (error) {
      reply.status(500).send({ error: `Failed to generate test embedding: ${error}` });
    }
  });

  // Test 0G Storage
  fastify.post('/test/storage', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { data } = request.body as { data: string };

      if (!data) {
        return reply.status(400).send({ error: 'Data is required' });
      }

      const testData = `Test data: ${data} - ${new Date().toISOString()}`;
      const metadata = await storageService.uploadData(testData, 'test.txt');

      // Test retrieval
      const retrievedData = await storageService.downloadData(metadata.root);
      const retrievedText = retrievedData.toString();

      reply.send({
        success: true,
        test: {
          uploaded: {
            root: metadata.root,
            size: metadata.size,
            checksum: metadata.checksum,
          },
          retrieved: {
            data: retrievedText,
            matches: retrievedText === testData,
          },
        },
      });
    } catch (error) {
      reply.status(500).send({ error: `Failed to test storage: ${error}` });
    }
  });

  // Semantic similarity test
  fastify.post('/test/similarity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { text1, text2 } = request.body as { text1: string; text2: string };

      if (!text1 || !text2) {
        return reply.status(400).send({ error: 'Both text1 and text2 are required' });
      }

      const [embedding1, embedding2] = await Promise.all([
        embeddingService.generateEmbedding(text1),
        embeddingService.generateEmbedding(text2),
      ]);

      const similarity = embeddingService.calculateSimilarity(
        embedding1.vector,
        embedding2.vector
      );

      reply.send({
        success: true,
        similarity: {
          score: similarity,
          percentage: Math.round(similarity * 100),
          texts: {
            text1: text1.substring(0, 100) + (text1.length > 100 ? '...' : ''),
            text2: text2.substring(0, 100) + (text2.length > 100 ? '...' : ''),
          },
        },
      });
    } catch (error) {
      reply.status(500).send({ error: `Failed to calculate similarity: ${error}` });
    }
  });

  // Document processing test
  fastify.post('/test/document', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { content, chunkSize, metadata } = request.body as {
        content: string;
        chunkSize?: number;
        metadata?: Record<string, any>;
      };

      if (!content) {
        return reply.status(400).send({ error: 'Content is required' });
      }

      const chunks = await embeddingService.processDocument(
        content,
        metadata || {},
        chunkSize || 1000
      );

      reply.send({
        success: true,
        document: {
          originalLength: content.length,
          chunkCount: chunks.length,
          chunks: chunks.map(chunk => ({
            id: chunk.id,
            text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
            textLength: chunk.text.length,
            embeddingDimension: chunk.embedding.length,
            metadata: chunk.metadata,
          })),
        },
      });
    } catch (error) {
      reply.status(500).send({ error: `Failed to process document: ${error}` });
    }
  });

  // System shutdown (for development)
  if (config.nodeEnv === 'development') {
    fastify.post('/shutdown', async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Shutting down server...' });
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });
  }
}
