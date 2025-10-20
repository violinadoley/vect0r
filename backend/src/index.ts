import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { VectorEngine } from './core/VectorEngine';
import { EmbeddingService } from './services/EmbeddingService';
import { Real0GStorageSDK } from './services/Real0GStorageSDK';
import { IStorageService } from './services/StorageInterface';
import { collectionRoutes } from './routes/collections';
import { systemRoutes } from './routes/system';
import { uploadRoutes } from './routes/upload';

/**
 * VectorZero - Decentralized Vector Database Server
 * Integrates 0G Storage and Chain for decentralized vector operations
 */
class VectorZeroServer {
  private fastify: any;
  private vectorEngine: VectorEngine;
  private embeddingService: EmbeddingService;
  private storageService: IStorageService;

  constructor() {
    this.fastify = Fastify({
      logger: {
        level: config.nodeEnv === 'development' ? 'info' : 'warn',
        transport: config.nodeEnv === 'development' ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        } : undefined,
      },
    });

    // Initialize services
    this.vectorEngine = new VectorEngine();
    this.embeddingService = new EmbeddingService();
    this.storageService = new Real0GStorageSDK();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  private setupMiddleware(): void {
    // CORS configuration
    this.fastify.register(cors, {
      origin: config.corsOrigin,
      credentials: true,
    });

    // Add request logging
    this.fastify.addHook('preHandler', async (request: any, reply: any) => {
      request.log.info(`${request.method} ${request.url}`);
    });

    // Add response time header
    this.fastify.addHook('onSend', async (request: any, reply: any, payload: any) => {
      const responseTime = Date.now() - request.startTime;
      reply.header('X-Response-Time', `${responseTime}ms`);
      return payload;
    });

    // Track request start time
    this.fastify.addHook('onRequest', async (request: any, reply: any) => {
      request.startTime = Date.now();
    });
  }

  private setupRoutes(): void {
    // Root endpoint
    this.fastify.get('/', async (request: any, reply: any) => {
      reply.send({
        name: 'VectorZero',
        description: 'Decentralized Vector Database with 0G Integration',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          collections: '/api/v1/collections',
          system: '/api/v1/health',
          docs: '/api/v1/config',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // API v1 routes
    this.fastify.register(async (fastify: any) => {
      await collectionRoutes(fastify, this.vectorEngine, this.embeddingService, this.storageService);
    }, { prefix: '/api/v1' });

    this.fastify.register(async (fastify: any) => {
      await systemRoutes(fastify, this.vectorEngine, this.embeddingService, this.storageService);
    }, { prefix: '/api/v1' });

    this.fastify.register(async (fastify: any) => {
      await uploadRoutes(fastify, this.vectorEngine, this.embeddingService, this.storageService);
    }, { prefix: '/api/v1' });

    // 404 handler
    this.fastify.setNotFoundHandler((request: any, reply: any) => {
      reply.status(404).send({
        error: 'Route not found',
        message: `Cannot ${request.method} ${request.url}`,
        available_endpoints: [
          'GET /',
          'GET /api/v1/health',
          'GET /api/v1/stats',
          'GET /api/v1/collections',
          'POST /api/v1/collections',
          'POST /api/v1/collections/:id/search',
          'POST /api/v1/upload',
          'GET /api/v1/upload/info',
        ],
      });
    });
  }

  private setupErrorHandlers(): void {
    // Global error handler
    this.fastify.setErrorHandler((error: any, request: any, reply: any) => {
      request.log.error(error);

      const isDevelopment = config.nodeEnv === 'development';

      reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString(),
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\\nReceived ${signal}, starting graceful shutdown...`);
      
      try {
        await this.fastify.close();
        console.log('✅ Server closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    try {
      console.log('🚀 Starting VectorZero Server...');
      console.log(`📊 Vector dimension: ${config.vector.dimension}`);
      console.log(`🔗 0G Chain: ${config.zg.chainRpcUrl}`);
      console.log(`💾 0G Storage: ${config.zg.storageUrl}`);
      
      // Skip creating default collection - users will create their own through uploads
      console.log(`📁 Ready to accept collection creation through uploads`);

      const address = await this.fastify.listen({
        port: config.port,
        host: '0.0.0.0',
      });

      console.log('✅ VectorZero Server running at:', address);
      console.log('🔍 API Documentation available at:', `${address}/api/v1/config`);
      console.log('📈 Health check available at:', `${address}/api/v1/health`);
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

}

// Start the server
const server = new VectorZeroServer();
server.start().catch((error) => {
  console.error('💥 Server startup failed:', error);
  process.exit(1);
});
