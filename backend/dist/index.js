"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const config_1 = require("./config");
const VectorEngine_1 = require("./core/VectorEngine");
const EmbeddingService_1 = require("./services/EmbeddingService");
const GeminiService_1 = require("./services/GeminiService");
const Real0GStorageSDK_1 = require("./services/Real0GStorageSDK");
const collections_1 = require("./routes/collections");
const system_1 = require("./routes/system");
const upload_1 = require("./routes/upload");
const rag_1 = require("./routes/rag");
/**
 * VectorZero - Decentralized Vector Database Server
 * Integrates 0G Storage and Chain for decentralized vector operations
 */
class VectorZeroServer {
    constructor() {
        this.fastify = (0, fastify_1.default)({
            logger: {
                level: config_1.config.nodeEnv === 'development' ? 'info' : 'warn',
                transport: config_1.config.nodeEnv === 'development' ? {
                    target: 'pino-pretty',
                    options: {
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                    },
                } : undefined,
            },
        });
        // Initialize services
        this.vectorEngine = new VectorEngine_1.VectorEngine();
        this.embeddingService = new EmbeddingService_1.EmbeddingService();
        this.geminiService = new GeminiService_1.GeminiService(config_1.config.gemini.apiKey);
        this.storageService = new Real0GStorageSDK_1.Real0GStorageSDK();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandlers();
    }
    setupMiddleware() {
        // CORS configuration
        this.fastify.register(cors_1.default, {
            origin: config_1.config.corsOrigin,
            credentials: true,
        });
        // Add request logging
        this.fastify.addHook('preHandler', async (request, reply) => {
            request.log.info(`${request.method} ${request.url}`);
        });
        // Add response time header
        this.fastify.addHook('onSend', async (request, reply, payload) => {
            const responseTime = Date.now() - request.startTime;
            reply.header('X-Response-Time', `${responseTime}ms`);
            return payload;
        });
        // Track request start time
        this.fastify.addHook('onRequest', async (request, reply) => {
            request.startTime = Date.now();
        });
    }
    setupRoutes() {
        // Root endpoint
        this.fastify.get('/', async (request, reply) => {
            reply.send({
                name: 'VectorZero',
                description: 'Decentralized Vector Database with 0G Integration',
                version: '1.0.0',
                status: 'running',
                endpoints: {
                    collections: '/api/v1/collections',
                    system: '/api/v1/health',
                    docs: '/api/v1/config',
                    rag: '/api/v1/rag/query',
                },
                timestamp: new Date().toISOString(),
            });
        });
        // API v1 routes
        this.fastify.register(async (fastify) => {
            await (0, collections_1.collectionRoutes)(fastify, this.vectorEngine, this.embeddingService, this.storageService);
        }, { prefix: '/api/v1' });
        this.fastify.register(async (fastify) => {
            await (0, system_1.systemRoutes)(fastify, this.vectorEngine, this.embeddingService, this.storageService);
        }, { prefix: '/api/v1' });
        this.fastify.register(async (fastify) => {
            await (0, upload_1.uploadRoutes)(fastify, this.vectorEngine, this.embeddingService, this.storageService);
        }, { prefix: '/api/v1' });
        this.fastify.register(async (fastify) => {
            await (0, rag_1.ragRoutes)(fastify, this.vectorEngine, this.embeddingService, this.geminiService);
        }, { prefix: '/api/v1' });
        // 404 handler
        this.fastify.setNotFoundHandler((request, reply) => {
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
                    'POST /api/v1/rag/query',
                    'GET /api/v1/rag/status',
                ],
            });
        });
    }
    setupErrorHandlers() {
        // Global error handler
        this.fastify.setErrorHandler((error, request, reply) => {
            request.log.error(error);
            const isDevelopment = config_1.config.nodeEnv === 'development';
            reply.status(error.statusCode || 500).send({
                error: error.message || 'Internal Server Error',
                code: error.code || 'INTERNAL_ERROR',
                statusCode: error.statusCode || 500,
                ...(isDevelopment && { stack: error.stack }),
                timestamp: new Date().toISOString(),
            });
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\\nReceived ${signal}, starting graceful shutdown...`);
            try {
                await this.fastify.close();
                console.log('✅ Server closed successfully');
                process.exit(0);
            }
            catch (error) {
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
    async start() {
        try {
            console.log('🚀 Starting VectorZero Server...');
            console.log(`📊 Vector dimension: ${config_1.config.vector.dimension}`);
            console.log(`🔗 0G Chain: ${config_1.config.zg.chainRpcUrl}`);
            console.log(`💾 0G Storage: ${config_1.config.zg.storageUrl}`);
            // Skip creating default collection - users will create their own through uploads
            console.log(`📁 Ready to accept collection creation through uploads`);
            const address = await this.fastify.listen({
                port: config_1.config.port,
                host: '0.0.0.0',
            });
            console.log('✅ VectorZero Server running at:', address);
            console.log('🔍 API Documentation available at:', `${address}/api/v1/config`);
            console.log('📈 Health check available at:', `${address}/api/v1/health`);
        }
        catch (error) {
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
//# sourceMappingURL=index.js.map