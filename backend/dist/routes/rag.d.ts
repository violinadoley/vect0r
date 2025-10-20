import { FastifyInstance } from 'fastify';
import { VectorEngine } from '../core/VectorEngine';
import { EmbeddingService } from '../services/EmbeddingService';
import { GeminiService } from '../services/GeminiService';
export declare function ragRoutes(fastify: FastifyInstance, vectorEngine: VectorEngine, embeddingService: EmbeddingService, geminiService: GeminiService): Promise<void>;
//# sourceMappingURL=rag.d.ts.map