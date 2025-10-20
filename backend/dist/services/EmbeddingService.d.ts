export interface EmbeddingRequest {
    text: string;
    model?: string;
}
export interface EmbeddingResponse {
    vector: number[];
    dimension: number;
    model: string;
    tokens: number;
}
export interface DocumentChunk {
    id: string;
    text: string;
    metadata: Record<string, any>;
    startIndex: number;
    endIndex: number;
}
/**
 * Service for generating vector embeddings from text
 * Supports various embedding models and chunking strategies
 */
export declare class EmbeddingService {
    private defaultModel;
    private maxTokens;
    private chunkOverlap;
    constructor();
    /**
     * Generate embedding for a single text
     */
    generateEmbedding(text: string, model?: string): Promise<EmbeddingResponse>;
    /**
     * Generate embeddings for multiple texts in batch
     */
    generateBatchEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]>;
    /**
     * Process document into chunks with embeddings
     */
    processDocument(content: string, metadata?: Record<string, any>, chunkSize?: number): Promise<Array<DocumentChunk & {
        embedding: number[];
    }>>;
    /**
     * Chunk a document into smaller pieces
     */
    private chunkDocument;
    private splitIntoSentences;
    private getOverlapText;
    /**
     * Create a deterministic embedding from text
     * This is a simplified approach for demo purposes
     */
    private createDeterministicEmbedding;
    private estimateTokens;
    /**
     * Search for similar embeddings using cosine similarity
     */
    calculateSimilarity(vector1: number[], vector2: number[]): number;
    /**
     * Get service statistics
     */
    getStats(): {
        defaultModel: string;
        maxTokens: number;
        chunkOverlap: number;
    };
}
//# sourceMappingURL=EmbeddingService.d.ts.map