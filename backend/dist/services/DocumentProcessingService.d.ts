import { EmbeddingService } from './EmbeddingService';
import { IStorageService } from './StorageInterface';
export interface ChunkingStrategy {
    type: 'fixed' | 'sentence' | 'paragraph' | 'semantic';
    chunkSize: number;
    overlap: number;
    metadata?: Record<string, any>;
}
export interface DocumentChunk {
    id: string;
    text: string;
    startIndex: number;
    endIndex: number;
    chunkIndex: number;
    metadata: Record<string, any>;
    embedding?: number[];
}
export interface ProcessedDocument {
    id: string;
    filename: string;
    originalSize: number;
    extractedText: string;
    textLength: number;
    chunks: DocumentChunk[];
    chunkingStrategy: ChunkingStrategy;
    storageMetadata?: any;
    processingTime: number;
    timestamp: number;
}
export interface UploadedFile {
    filename: string;
    mimetype: string;
    encoding: string;
    size: number;
    buffer: Buffer;
}
/**
 * Service for processing documents with various chunking strategies
 */
export declare class DocumentProcessingService {
    private embeddingService;
    private storageService;
    constructor(embeddingService: EmbeddingService, storageService: IStorageService);
    private ensureUploadDirectory;
    /**
     * Process an uploaded document with specified chunking strategy
     */
    processDocument(file: UploadedFile, chunkingStrategy: ChunkingStrategy, generateEmbeddings?: boolean, useZeroGCompute?: boolean): Promise<ProcessedDocument>;
    /**
     * Extract text from various document types
     */
    private extractText;
    /**
     * Extract text from PDF buffer
     */
    private extractTextFromPDF;
    /**
     * Check if extracted content is valid text
     */
    private isValidText;
    /**
     * Chunk document using specified strategy
     */
    private chunkDocument;
    /**
     * Fixed size chunking with overlap
     */
    private fixedSizeChunking;
    /**
     * Sentence-based chunking
     */
    private sentenceBasedChunking;
    /**
     * Paragraph-based chunking
     */
    private paragraphBasedChunking;
    /**
     * Semantic chunking (simplified implementation)
     */
    private semanticChunking;
    /**
     * Generate embeddings for chunks
     */
    private generateEmbeddingsForChunks;
    /**
     * Store processed document in 0G Storage
     */
    private storeInZeroG;
    private splitIntoSentences;
    private getOverlapFromSentences;
    /**
     * Get processing statistics
     */
    getStats(): {
        supportedFormats: string[];
        chunkingStrategies: string[];
        uploadPath: string;
        maxFileSize: string;
    };
    /**
     * Validate chunking strategy
     */
    static validateChunkingStrategy(strategy: ChunkingStrategy): boolean;
}
//# sourceMappingURL=DocumentProcessingService.d.ts.map