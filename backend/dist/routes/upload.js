"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = uploadRoutes;
const DocumentProcessingService_1 = require("../services/DocumentProcessingService");
async function uploadRoutes(fastify, vectorEngine, embeddingService, storageService) {
    const documentProcessor = new DocumentProcessingService_1.DocumentProcessingService(embeddingService, storageService);
    // Register multipart support for file uploads
    await fastify.register(require('@fastify/multipart'), {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
            files: 1, // Only one file at a time
        },
    });
    /**
     * Upload and process a document
     */
    fastify.post('/upload', async (request, reply) => {
        try {
            console.log('📋 Upload request received');
            // Check if request is multipart
            if (!request.isMultipart()) {
                return reply.status(400).send({
                    error: 'Request must be multipart/form-data',
                    message: 'Please upload files using multipart/form-data format'
                });
            }
            let fileData = null;
            let uploadConfig = null;
            // Process multipart data
            const parts = request.parts();
            for await (const part of parts) {
                if (part.type === 'file') {
                    // Handle file upload
                    const buffer = await part.toBuffer();
                    fileData = {
                        filename: part.filename || 'unknown.txt',
                        mimetype: part.mimetype || 'text/plain',
                        encoding: part.encoding,
                        size: buffer.length,
                        buffer
                    };
                }
                else if (part.type === 'field' && part.fieldname === 'config') {
                    // Handle configuration
                    try {
                        const configValue = part.value;
                        uploadConfig = JSON.parse(configValue);
                    }
                    catch (error) {
                        return reply.status(400).send({
                            error: 'Invalid configuration format',
                            message: 'Configuration must be valid JSON'
                        });
                    }
                }
            }
            // Validate inputs
            if (!fileData) {
                return reply.status(400).send({
                    error: 'No file uploaded',
                    message: 'Please upload a file'
                });
            }
            if (!uploadConfig) {
                return reply.status(400).send({
                    error: 'No configuration provided',
                    message: 'Please provide processing configuration'
                });
            }
            // Validate chunking strategy
            if (!DocumentProcessingService_1.DocumentProcessingService.validateChunkingStrategy(uploadConfig.chunkingStrategy)) {
                return reply.status(400).send({
                    error: 'Invalid chunking strategy',
                    message: 'Chunking strategy parameters are invalid'
                });
            }
            console.log(`📁 Processing upload: ${fileData.filename} (${fileData.size} bytes)`);
            // Process the document
            console.log('🔄 Starting document processing...');
            const processedDoc = await documentProcessor.processDocument(fileData, uploadConfig.chunkingStrategy, uploadConfig.generateEmbeddings !== false, // Default to true
            uploadConfig.useZeroGCompute || false);
            console.log(`✅ Document processing completed: ${processedDoc.chunks.length} chunks`);
            // Create or use existing collection
            let collectionId;
            if (uploadConfig.createNewCollection !== false) {
                // Create new collection
                const collectionName = uploadConfig.collectionName ||
                    `${fileData.filename.replace(/\.[^/.]+$/, '')}_collection`;
                const collectionDescription = uploadConfig.collectionDescription ||
                    `Collection created from ${fileData.filename}`;
                collectionId = await vectorEngine.createCollection(collectionName, processedDoc.chunks[0]?.embedding?.length || 768, collectionDescription);
                console.log(`📋 Created new collection: ${collectionName} (${collectionId})`);
            }
            else {
                // Use existing collection
                if (!uploadConfig.existingCollectionId) {
                    return reply.status(400).send({
                        error: 'Missing collection ID',
                        message: 'existingCollectionId is required when createNewCollection is false'
                    });
                }
                collectionId = uploadConfig.existingCollectionId;
                const collection = vectorEngine.getCollection(collectionId);
                if (!collection) {
                    return reply.status(404).send({
                        error: 'Collection not found',
                        message: `Collection ${collectionId} does not exist`
                    });
                }
                console.log(`📋 Using existing collection: ${collectionId}`);
            }
            // Store vectors in collection
            const vectorIds = [];
            for (const chunk of processedDoc.chunks) {
                if (chunk.embedding) {
                    const vectorId = await vectorEngine.insertVector(collectionId, chunk.embedding, {
                        text: chunk.text,
                        chunkId: chunk.id,
                        documentId: processedDoc.id,
                        filename: processedDoc.filename,
                        ...chunk.metadata
                    });
                    vectorIds.push(vectorId);
                }
            }
            // Prepare response
            const response = {
                success: true,
                message: `Document processed successfully`,
                document: {
                    id: processedDoc.id,
                    filename: processedDoc.filename,
                    originalSize: processedDoc.originalSize,
                    processingTime: processedDoc.processingTime,
                    chunks: processedDoc.chunks.length,
                    textLength: processedDoc.textLength,
                    storageMetadata: processedDoc.storageMetadata
                },
                collection: {
                    id: collectionId,
                    name: uploadConfig.collectionName || fileData.filename.replace(/\.[^/.]+$/, '') + '_collection',
                    isNew: uploadConfig.createNewCollection !== false
                },
                processing: {
                    chunkingStrategy: uploadConfig.chunkingStrategy,
                    totalChunks: processedDoc.chunks.length,
                    insertedVectors: vectorIds.length,
                    generatedEmbeddings: processedDoc.chunks.filter(c => c.embedding).length,
                    usedZeroGCompute: uploadConfig.useZeroGCompute || false
                },
                vectors: {
                    ids: vectorIds,
                    count: vectorIds.length
                }
            };
            console.log(`✅ Upload completed: ${vectorIds.length} vectors stored in collection ${collectionId}`);
            reply.send(response);
        }
        catch (error) {
            console.error('Error processing upload:', error);
            reply.status(500).send({
                error: 'Upload processing failed',
                message: error.message || 'An unexpected error occurred',
                details: error.stack
            });
        }
    });
    /**
     * Get supported file formats and chunking strategies
     */
    fastify.get('/upload/info', async (request, reply) => {
        try {
            const processingStats = documentProcessor.getStats();
            reply.send({
                success: true,
                info: {
                    ...processingStats,
                    chunkingStrategies: {
                        fixed: {
                            description: 'Split text into fixed-size chunks with overlap',
                            parameters: ['chunkSize', 'overlap']
                        },
                        sentence: {
                            description: 'Split text at sentence boundaries with size limits',
                            parameters: ['chunkSize', 'overlap']
                        },
                        paragraph: {
                            description: 'Split text at paragraph boundaries',
                            parameters: ['chunkSize']
                        },
                        semantic: {
                            description: 'Group semantically similar content (experimental)',
                            parameters: ['chunkSize', 'overlap']
                        }
                    },
                    limits: {
                        maxFileSize: '50MB',
                        maxFiles: 1,
                        supportedFormats: ['txt', 'pdf', 'docx', 'md', 'html', 'csv', 'json', 'xml']
                    }
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                error: 'Failed to get upload info',
                message: error.message
            });
        }
    });
}
//# sourceMappingURL=upload.js.map