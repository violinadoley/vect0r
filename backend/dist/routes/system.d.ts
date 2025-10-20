import { FastifyInstance } from 'fastify';
import { VectorEngine } from '../core/VectorEngine';
import { EmbeddingService } from '../services/EmbeddingService';
import { IStorageService } from '../services/StorageInterface';
export declare function systemRoutes(fastify: FastifyInstance, vectorEngine: VectorEngine, embeddingService: EmbeddingService, storageService: IStorageService): Promise<void>;
//# sourceMappingURL=system.d.ts.map