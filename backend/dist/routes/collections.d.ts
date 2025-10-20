import { FastifyInstance } from 'fastify';
import { VectorEngine } from '../core/VectorEngine';
import { EmbeddingService } from '../services/EmbeddingService';
import { IStorageService } from '../services/StorageInterface';
export declare function collectionRoutes(fastify: FastifyInstance, vectorEngine: VectorEngine, embeddingService: EmbeddingService, storageService: IStorageService): Promise<void>;
//# sourceMappingURL=collections.d.ts.map