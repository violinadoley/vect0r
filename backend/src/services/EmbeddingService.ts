import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

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
export class EmbeddingService {
  private defaultModel: string = 'text-embedding-004'; // Google's embedding model
  private maxTokens: number = 512;
  private chunkOverlap: number = 50;
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.apiKey = config.gemini.apiKey;
    if (!this.apiKey) {
      console.warn('⚠️ EmbeddingService initialized without API key - embedding generation will fail');
    } else {
      console.log('Embedding Service initialized');
      console.log(`Default model: ${this.defaultModel}`);
    }
  }

  /**
   * Generate embedding for a single text using Google's Embedding API
   */
  async generateEmbedding(text: string, model?: string): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }

    try {
      const modelName = model || this.defaultModel;
      
      console.log(`🧮 Generating embedding using ${modelName}...`);
      
      // Call Google's Embedding API
      const response = await axios.post(
        `${this.apiUrl}/${modelName}:embedContent?key=${this.apiKey}`,
        {
          content: {
            parts: [{ text }]
          }
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.embedding || !response.data.embedding.values) {
        throw new Error('Invalid response from embedding API');
      }

      const vector = response.data.embedding.values;
      const tokens = response.data.usageMetadata?.totalTokenCount || this.estimateTokens(text);
      
      console.log(`✅ Generated embedding (${vector.length} dimensions, ${tokens} tokens)`);
      
      return {
        vector,
        dimension: vector.length,
        model: modelName,
        tokens,
      };

    } catch (error: any) {
      console.error('❌ Error generating embedding:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request to embedding API. Check your text length.');
      } else if (error.response?.status === 403) {
        throw new Error('Invalid API key or embedding API not enabled.');
      }
      
      throw new Error(`Failed to generate embedding: ${error.message || error}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(
    texts: string[],
    model?: string
  ): Promise<EmbeddingResponse[]> {
    const embeddings: EmbeddingResponse[] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text, model);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Process document into chunks with embeddings
   */
  async processDocument(
    content: string,
    metadata: Record<string, any> = {},
    chunkSize: number = 1000
  ): Promise<Array<DocumentChunk & { embedding: number[] }>> {
    const chunks = this.chunkDocument(content, chunkSize);
    const processedChunks: Array<DocumentChunk & { embedding: number[] }> = [];

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
  private chunkDocument(content: string, chunkSize: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
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
          id: uuidv4(),
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
      } else {
        currentChunk = potentialChunk;
        currentIndex = i;
      }
    }

    // Add final chunk if there's remaining content
    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
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

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - in production, use a proper NLP library
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private getOverlapText(text: string, overlapChars: number): string {
    if (text.length <= overlapChars) return text;
    
    const overlap = text.slice(-overlapChars);
    const lastSpaceIndex = overlap.lastIndexOf(' ');
    
    return lastSpaceIndex > 0 ? overlap.slice(lastSpaceIndex + 1) : overlap;
  }


  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Search for similar embeddings using cosine similarity
   */
  calculateSimilarity(vector1: number[], vector2: number[]): number {
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
  getStats(): {
    defaultModel: string;
    maxTokens: number;
    chunkOverlap: number;
  } {
    return {
      defaultModel: this.defaultModel,
      maxTokens: this.maxTokens,
      chunkOverlap: this.chunkOverlap,
    };
  }
}
