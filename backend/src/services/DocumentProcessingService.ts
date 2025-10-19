import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto-js';
// @ts-ignore - pdf-parse doesn't have proper type definitions
import pdf from 'pdf-parse';
import { EmbeddingService } from './EmbeddingService';
import { IStorageService } from './StorageInterface';
import { config } from '../config';

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
export class DocumentProcessingService {
  private embeddingService: EmbeddingService;
  private storageService: IStorageService;

  constructor(embeddingService: EmbeddingService, storageService: IStorageService) {
    this.embeddingService = embeddingService;
    this.storageService = storageService;
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.ensureDir(config.storage.uploadPath);
      console.log(`📁 Upload directory ensured: ${config.storage.uploadPath}`);
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Process an uploaded document with specified chunking strategy
   */
  async processDocument(
    file: UploadedFile,
    chunkingStrategy: ChunkingStrategy,
    generateEmbeddings: boolean = true,
    useZeroGCompute: boolean = false
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    console.log(`📄 Processing document: ${file.filename} (${file.size} bytes)`);

    try {
      // Extract text from document
      const extractedText = await this.extractText(file);
      
      // Generate document chunks
      const chunks = await this.chunkDocument(extractedText, chunkingStrategy);
      
      // Generate embeddings if requested
      if (generateEmbeddings) {
        await this.generateEmbeddingsForChunks(chunks, useZeroGCompute);
      }

      // Create processed document result
      const processedDoc: ProcessedDocument = {
        id: uuidv4(),
        filename: file.filename,
        originalSize: file.size,
        extractedText,
        textLength: extractedText.length,
        chunks,
        chunkingStrategy,
        processingTime: Date.now() - startTime,
        timestamp: Date.now(),
      };

      // Optionally store in 0G Storage
      try {
        if (this.storageService) {
          const storageMetadata = await this.storeInZeroG(processedDoc);
          processedDoc.storageMetadata = storageMetadata;
          console.log(`💾 Document stored in 0G Storage with root: ${storageMetadata.root}`);
        }
      } catch (storageError) {
        console.warn('Failed to store in 0G Storage:', storageError);
      }

      console.log(`✅ Document processed in ${processedDoc.processingTime}ms: ${chunks.length} chunks created`);
      return processedDoc;

    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document ${file.filename}: ${error}`);
    }
  }

  /**
   * Extract text from various document types
   */
  private async extractText(file: UploadedFile): Promise<string> {
    const mimeType = file.mimetype.toLowerCase();
    
    console.log(`🔍 Extracting text from ${mimeType} file...`);

    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractTextFromPDF(file.buffer);
        
        case 'text/plain':
        case 'text/markdown':
          return file.buffer.toString('utf-8');
        
        case 'application/json':
          const jsonData = JSON.parse(file.buffer.toString('utf-8'));
          return JSON.stringify(jsonData, null, 2);
        
        default:
          // Try to read as text for unknown types
          const text = file.buffer.toString('utf-8');
          if (text.length > 0 && this.isValidText(text)) {
            console.warn(`Unknown file type ${mimeType}, treating as text`);
            return text;
          }
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${mimeType}:`, error);
      throw error;
    }
  }

  /**
   * Extract text from PDF buffer
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      const text = data.text;
      
      if (!text || text.length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      console.log(`📖 Extracted ${text.length} characters from PDF`);
      return text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  }

  /**
   * Check if extracted content is valid text
   */
  private isValidText(text: string): boolean {
    // Basic validation for text content
    const printableChars = text.replace(/[\r\n\t\s]/g, '').length;
    const totalChars = text.length;
    
    // If more than 80% are printable characters, consider it valid text
    return totalChars > 0 && (printableChars / totalChars) > 0.8;
  }

  /**
   * Chunk document using specified strategy
   */
  private async chunkDocument(text: string, strategy: ChunkingStrategy): Promise<DocumentChunk[]> {
    console.log(`✂️ Chunking document using ${strategy.type} strategy...`);

    switch (strategy.type) {
      case 'fixed':
        return this.fixedSizeChunking(text, strategy);
      
      case 'sentence':
        return this.sentenceBasedChunking(text, strategy);
      
      case 'paragraph':
        return this.paragraphBasedChunking(text, strategy);
      
      case 'semantic':
        return this.semanticChunking(text, strategy);
      
      default:
        console.warn(`Unknown chunking strategy: ${strategy.type}, using fixed size`);
        return this.fixedSizeChunking(text, strategy);
    }
  }

  /**
   * Fixed size chunking with overlap
   */
  private fixedSizeChunking(text: string, strategy: ChunkingStrategy): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const chunkSize = strategy.chunkSize;
    const overlap = strategy.overlap;
    
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunkText = text.slice(startIndex, endIndex);
      
      chunks.push({
        id: uuidv4(),
        text: chunkText,
        startIndex,
        endIndex,
        chunkIndex,
        metadata: {
          chunkingStrategy: strategy.type,
          chunkSize,
          overlap,
          ...strategy.metadata
        }
      });

      chunkIndex++;
      startIndex += chunkSize - overlap;
      
      if (startIndex >= endIndex) break;
    }

    return chunks;
  }

  /**
   * Sentence-based chunking
   */
  private sentenceBasedChunking(text: string, strategy: ChunkingStrategy): DocumentChunk[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: DocumentChunk[] = [];
    const targetSize = strategy.chunkSize;
    const overlap = strategy.overlap;
    
    let currentChunk = '';
    let currentStartIndex = 0;
    let chunkIndex = 0;
    let sentenceIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (potentialChunk.length > targetSize && currentChunk.length > 0) {
        // Create current chunk
        const endIndex = text.indexOf(currentChunk, currentStartIndex) + currentChunk.length;
        chunks.push({
          id: uuidv4(),
          text: currentChunk.trim(),
          startIndex: currentStartIndex,
          endIndex,
          chunkIndex,
          metadata: {
            chunkingStrategy: strategy.type,
            sentenceCount: i - sentenceIndex,
            ...strategy.metadata
          }
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapFromSentences(sentences.slice(Math.max(0, i - 2), i), overlap);
        currentChunk = overlapText + sentence;
        currentStartIndex = text.indexOf(overlapText, Math.max(0, endIndex - overlap));
        chunkIndex++;
        sentenceIndex = Math.max(0, i - 2);
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
        text: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: text.length,
        chunkIndex,
        metadata: {
          chunkingStrategy: strategy.type,
          sentenceCount: sentences.length - sentenceIndex,
          ...strategy.metadata
        }
      });
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking
   */
  private paragraphBasedChunking(text: string, strategy: ChunkingStrategy): DocumentChunk[] {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: DocumentChunk[] = [];
    const targetSize = strategy.chunkSize;
    
    let currentChunk = '';
    let currentStartIndex = 0;
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
      
      if (potentialChunk.length > targetSize && currentChunk.length > 0) {
        // Create current chunk
        const endIndex = text.indexOf(currentChunk, currentStartIndex) + currentChunk.length;
        chunks.push({
          id: uuidv4(),
          text: currentChunk.trim(),
          startIndex: currentStartIndex,
          endIndex,
          chunkIndex,
          metadata: {
            chunkingStrategy: strategy.type,
            paragraphCount: i,
            ...strategy.metadata
          }
        });

        // Start new chunk
        currentChunk = paragraph;
        currentStartIndex = text.indexOf(paragraph, endIndex);
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
        text: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: text.length,
        chunkIndex,
        metadata: {
          chunkingStrategy: strategy.type,
          paragraphCount: paragraphs.length,
          ...strategy.metadata
        }
      });
    }

    return chunks;
  }

  /**
   * Semantic chunking (simplified implementation)
   */
  private async semanticChunking(text: string, strategy: ChunkingStrategy): Promise<DocumentChunk[]> {
    // For now, use sentence-based chunking as a base
    // In a full implementation, this would use semantic similarity to group related sentences
    console.log('📊 Using semantic chunking (simplified as sentence-based for now)');
    return this.sentenceBasedChunking(text, strategy);
  }

  /**
   * Generate embeddings for chunks
   */
  private async generateEmbeddingsForChunks(chunks: DocumentChunk[], useZeroGCompute: boolean): Promise<void> {
    console.log(`🧮 Generating embeddings for ${chunks.length} chunks...`);
    
    for (const chunk of chunks) {
      try {
        const embeddingResponse = await this.embeddingService.generateEmbedding(chunk.text);
        chunk.embedding = embeddingResponse.vector;
        chunk.metadata.embeddingModel = embeddingResponse.model;
        chunk.metadata.tokens = embeddingResponse.tokens;
      } catch (error: any) {
        console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
        chunk.metadata.embeddingError = error.message;
      }
    }
    
    console.log(`✅ Generated embeddings for ${chunks.filter(c => c.embedding).length}/${chunks.length} chunks`);
  }

  /**
   * Store processed document in 0G Storage
   */
  private async storeInZeroG(document: ProcessedDocument): Promise<any> {
    const documentData = JSON.stringify(document, null, 2);
    const filename = `processed_${document.id}.json`;
    
    return await this.storageService.uploadData(documentData, filename);
  }

  // Utility methods

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private getOverlapFromSentences(sentences: string[], overlapChars: number): string {
    let overlap = '';
    for (let i = sentences.length - 1; i >= 0 && overlap.length < overlapChars; i--) {
      overlap = sentences[i] + ' ' + overlap;
    }
    return overlap.trim();
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      supportedFormats: ['application/pdf', 'text/plain', 'text/markdown', 'application/json'],
      chunkingStrategies: ['fixed', 'sentence', 'paragraph', 'semantic'],
      uploadPath: config.storage.uploadPath,
      maxFileSize: config.storage.maxFileSize
    };
  }

  /**
   * Validate chunking strategy
   */
  static validateChunkingStrategy(strategy: ChunkingStrategy): boolean {
    const validTypes = ['fixed', 'sentence', 'paragraph', 'semantic'];
    return validTypes.includes(strategy.type) && 
           strategy.chunkSize > 0 && 
           strategy.overlap >= 0 && 
           strategy.overlap < strategy.chunkSize;
  }
}
