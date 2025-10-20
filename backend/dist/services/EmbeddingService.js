"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
/**
 * Service for generating vector embeddings from text
 * Supports various embedding models and chunking strategies
 */
class EmbeddingService {
    constructor() {
        this.defaultModel = 'all-MiniLM-L6-v2';
        this.maxTokens = 512;
        this.chunkOverlap = 50;
        console.log('Embedding Service initialized');
        console.log(`Default model: ${this.defaultModel}`);
    }
    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text, model) {
        try {
            const modelName = model || this.defaultModel;
            // For demo purposes, we'll create a simple deterministic embedding
            // In production, this would call an actual embedding API like OpenAI, Hugging Face, or local model
            const vector = this.createDeterministicEmbedding(text);
            return {
                vector,
                dimension: vector.length,
                model: modelName,
                tokens: this.estimateTokens(text),
            };
        }
        catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error(`Failed to generate embedding: ${error}`);
        }
    }
    /**
     * Generate embeddings for multiple texts in batch
     */
    async generateBatchEmbeddings(texts, model) {
        const embeddings = [];
        for (const text of texts) {
            const embedding = await this.generateEmbedding(text, model);
            embeddings.push(embedding);
        }
        return embeddings;
    }
    /**
     * Process document into chunks with embeddings
     */
    async processDocument(content, metadata = {}, chunkSize = 1000) {
        const chunks = this.chunkDocument(content, chunkSize);
        const processedChunks = [];
        for (const chunk of chunks) {
            const embeddingResponse = await this.generateEmbedding(chunk.text);
            processedChunks.push({
                ...chunk,
                embedding: embeddingResponse.vector,
                metadata: {
                    ...metadata,
                    ...chunk.metadata,
                    tokens: embeddingResponse.tokens,
                    model: embeddingResponse.model,
                },
            });
        }
        console.log(`Processed document into ${processedChunks.length} chunks`);
        return processedChunks;
    }
    /**
     * Chunk a document into smaller pieces
     */
    chunkDocument(content, chunkSize) {
        const chunks = [];
        const sentences = this.splitIntoSentences(content);
        let currentChunk = '';
        let currentIndex = 0;
        let chunkStartIndex = 0;
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
            if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
                // Create chunk
                chunks.push({
                    id: crypto_js_1.default.lib.WordArray.random(16).toString(),
                    text: currentChunk.trim(),
                    metadata: {
                        chunkIndex: chunks.length,
                        sentenceStart: chunkStartIndex,
                        sentenceEnd: i - 1,
                    },
                    startIndex: chunkStartIndex,
                    endIndex: currentIndex,
                });
                // Start new chunk with overlap
                const overlapText = this.getOverlapText(currentChunk, this.chunkOverlap);
                currentChunk = overlapText + sentence;
                chunkStartIndex = Math.max(0, i - 1);
                currentIndex = chunkStartIndex;
            }
            else {
                currentChunk = potentialChunk;
                currentIndex = i;
            }
        }
        // Add final chunk if there's remaining content
        if (currentChunk.trim()) {
            chunks.push({
                id: crypto_js_1.default.lib.WordArray.random(16).toString(),
                text: currentChunk.trim(),
                metadata: {
                    chunkIndex: chunks.length,
                    sentenceStart: chunkStartIndex,
                    sentenceEnd: sentences.length - 1,
                },
                startIndex: chunkStartIndex,
                endIndex: sentences.length - 1,
            });
        }
        return chunks;
    }
    splitIntoSentences(text) {
        // Simple sentence splitting - in production, use a proper NLP library
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    getOverlapText(text, overlapChars) {
        if (text.length <= overlapChars)
            return text;
        const overlap = text.slice(-overlapChars);
        const lastSpaceIndex = overlap.lastIndexOf(' ');
        return lastSpaceIndex > 0 ? overlap.slice(lastSpaceIndex + 1) : overlap;
    }
    /**
     * Create a deterministic embedding from text
     * This is a simplified approach for demo purposes
     */
    createDeterministicEmbedding(text) {
        const dimension = 768; // Standard dimension for many models
        const vector = new Array(dimension);
        // Create a hash of the text
        const hash = crypto_js_1.default.SHA256(text).toString();
        // Use the hash to generate deterministic values
        for (let i = 0; i < dimension; i++) {
            const seedValue = parseInt(hash.slice(i * 2 % hash.length, (i * 2 + 2) % hash.length), 16) || 0;
            // Convert to normalized value between -1 and 1
            vector[i] = (seedValue / 255) * 2 - 1;
        }
        // Normalize the vector
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        for (let i = 0; i < dimension; i++) {
            vector[i] /= magnitude;
        }
        return vector;
    }
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token for English text
        return Math.ceil(text.length / 4);
    }
    /**
     * Search for similar embeddings using cosine similarity
     */
    calculateSimilarity(vector1, vector2) {
        if (vector1.length !== vector2.length) {
            throw new Error('Vectors must have the same dimension');
        }
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            magnitude1 += vector1[i] * vector1[i];
            magnitude2 += vector2[i] * vector2[i];
        }
        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);
        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }
        return dotProduct / (magnitude1 * magnitude2);
    }
    /**
     * Get service statistics
     */
    getStats() {
        return {
            defaultModel: this.defaultModel,
            maxTokens: this.maxTokens,
            chunkOverlap: this.chunkOverlap,
        };
    }
}
exports.EmbeddingService = EmbeddingService;
//# sourceMappingURL=EmbeddingService.js.map