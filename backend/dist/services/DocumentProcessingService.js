"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessingService = void 0;
const fs = __importStar(require("fs-extra"));
const uuid_1 = require("uuid");
// @ts-ignore - pdf-parse doesn't have proper type definitions
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const config_1 = require("../config");
/**
 * Service for processing documents with various chunking strategies
 */
class DocumentProcessingService {
    constructor(embeddingService, storageService) {
        this.embeddingService = embeddingService;
        this.storageService = storageService;
        this.ensureUploadDirectory();
    }
    async ensureUploadDirectory() {
        try {
            await fs.ensureDir(config_1.config.storage.uploadPath);
            console.log(`📁 Upload directory ensured: ${config_1.config.storage.uploadPath}`);
        }
        catch (error) {
            console.error('Error creating upload directory:', error);
        }
    }
    /**
     * Process an uploaded document with specified chunking strategy
     */
    async processDocument(file, chunkingStrategy, generateEmbeddings = true, useZeroGCompute = false) {
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
            const processedDoc = {
                id: (0, uuid_1.v4)(),
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
            }
            catch (storageError) {
                console.warn('Failed to store in 0G Storage:', storageError);
            }
            console.log(`✅ Document processed in ${processedDoc.processingTime}ms: ${chunks.length} chunks created`);
            return processedDoc;
        }
        catch (error) {
            console.error('Error processing document:', error);
            throw new Error(`Failed to process document ${file.filename}: ${error}`);
        }
    }
    /**
     * Extract text from various document types
     */
    async extractText(file) {
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
        }
        catch (error) {
            console.error(`Error extracting text from ${mimeType}:`, error);
            throw error;
        }
    }
    /**
     * Extract text from PDF buffer
     */
    async extractTextFromPDF(buffer) {
        try {
            const data = await (0, pdf_parse_1.default)(buffer);
            const text = data.text;
            if (!text || text.length === 0) {
                throw new Error('No text content found in PDF');
            }
            console.log(`📖 Extracted ${text.length} characters from PDF`);
            return text;
        }
        catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error(`Failed to extract text from PDF: ${error}`);
        }
    }
    /**
     * Check if extracted content is valid text
     */
    isValidText(text) {
        // Basic validation for text content
        const printableChars = text.replace(/[\r\n\t\s]/g, '').length;
        const totalChars = text.length;
        // If more than 80% are printable characters, consider it valid text
        return totalChars > 0 && (printableChars / totalChars) > 0.8;
    }
    /**
     * Chunk document using specified strategy
     */
    async chunkDocument(text, strategy) {
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
    fixedSizeChunking(text, strategy) {
        const chunks = [];
        const chunkSize = strategy.chunkSize;
        const overlap = strategy.overlap;
        let startIndex = 0;
        let chunkIndex = 0;
        while (startIndex < text.length) {
            const endIndex = Math.min(startIndex + chunkSize, text.length);
            const chunkText = text.slice(startIndex, endIndex);
            chunks.push({
                id: (0, uuid_1.v4)(),
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
            if (startIndex >= endIndex)
                break;
        }
        return chunks;
    }
    /**
     * Sentence-based chunking
     */
    sentenceBasedChunking(text, strategy) {
        const sentences = this.splitIntoSentences(text);
        const chunks = [];
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
                    id: (0, uuid_1.v4)(),
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
            }
            else {
                currentChunk = potentialChunk;
            }
        }
        // Add final chunk
        if (currentChunk.trim()) {
            chunks.push({
                id: (0, uuid_1.v4)(),
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
    paragraphBasedChunking(text, strategy) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const chunks = [];
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
                    id: (0, uuid_1.v4)(),
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
            }
            else {
                currentChunk = potentialChunk;
            }
        }
        // Add final chunk
        if (currentChunk.trim()) {
            chunks.push({
                id: (0, uuid_1.v4)(),
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
    async semanticChunking(text, strategy) {
        // For now, use sentence-based chunking as a base
        // In a full implementation, this would use semantic similarity to group related sentences
        console.log('📊 Using semantic chunking (simplified as sentence-based for now)');
        return this.sentenceBasedChunking(text, strategy);
    }
    /**
     * Generate embeddings for chunks
     */
    async generateEmbeddingsForChunks(chunks, useZeroGCompute) {
        console.log(`🧮 Generating embeddings for ${chunks.length} chunks...`);
        for (const chunk of chunks) {
            try {
                const embeddingResponse = await this.embeddingService.generateEmbedding(chunk.text);
                chunk.embedding = embeddingResponse.vector;
                chunk.metadata.embeddingModel = embeddingResponse.model;
                chunk.metadata.tokens = embeddingResponse.tokens;
            }
            catch (error) {
                console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
                chunk.metadata.embeddingError = error.message;
            }
        }
        console.log(`✅ Generated embeddings for ${chunks.filter(c => c.embedding).length}/${chunks.length} chunks`);
    }
    /**
     * Store processed document in 0G Storage
     */
    async storeInZeroG(document) {
        const documentData = JSON.stringify(document, null, 2);
        const filename = `processed_${document.id}.json`;
        return await this.storageService.uploadData(documentData, filename);
    }
    // Utility methods
    splitIntoSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    getOverlapFromSentences(sentences, overlapChars) {
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
            uploadPath: config_1.config.storage.uploadPath,
            maxFileSize: config_1.config.storage.maxFileSize
        };
    }
    /**
     * Validate chunking strategy
     */
    static validateChunkingStrategy(strategy) {
        const validTypes = ['fixed', 'sentence', 'paragraph', 'semantic'];
        return validTypes.includes(strategy.type) &&
            strategy.chunkSize > 0 &&
            strategy.overlap >= 0 &&
            strategy.overlap < strategy.chunkSize;
    }
}
exports.DocumentProcessingService = DocumentProcessingService;
//# sourceMappingURL=DocumentProcessingService.js.map