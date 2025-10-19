import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { VectorEngine } from '../core/VectorEngine';
import { EmbeddingService } from '../services/EmbeddingService';
import { IStorageService } from '../services/StorageInterface';
import { DocumentProcessingService, ChunkingStrategy, UploadedFile } from '../services/DocumentProcessingService';

interface UploadRequest {
  collectionName?: string;
  collectionDescription?: string;
  chunkingStrategy: ChunkingStrategy;
  generateEmbeddings?: boolean;
  useZeroGCompute?: boolean;
  createNewCollection?: boolean;
  existingCollectionId?: string;
}

interface FileData {
  filename: string;
  mimetype: string;
  encoding: string;
  file: NodeJS.ReadableStream;
}

export async function uploadRoutes(
  fastify: FastifyInstance,
  vectorEngine: VectorEngine,
  embeddingService: EmbeddingService,
  storageService: IStorageService
) {
  const documentProcessor = new DocumentProcessingService(embeddingService, storageService);

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
  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if request is multipart
      if (!(request as any).isMultipart()) {
        return reply.status(400).send({
          error: 'Request must be multipart/form-data',
          message: 'Please upload files using multipart/form-data format'
        });
      }

      let fileData: UploadedFile | null = null;
      let uploadConfig: UploadRequest | null = null;

      // Process multipart data
      const parts = (request as any).parts();
      
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
        } else if (part.type === 'field' && part.fieldname === 'config') {
          // Handle configuration
          try {
            const configValue = part.value as string;
            uploadConfig = JSON.parse(configValue);
          } catch (error) {
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
      if (!DocumentProcessingService.validateChunkingStrategy(uploadConfig.chunkingStrategy)) {
        return reply.status(400).send({
          error: 'Invalid chunking strategy',
          message: 'Chunking strategy parameters are invalid'
        });
      }

      console.log(`📁 Processing upload: ${fileData.filename} (${fileData.size} bytes)`);

      // Process the document
      const processedDoc = await documentProcessor.processDocument(
        fileData,
        uploadConfig.chunkingStrategy,
        uploadConfig.generateEmbeddings !== false, // Default to true
        uploadConfig.useZeroGCompute || false
      );

      // Create or use existing collection
      let collectionId: string;

      if (uploadConfig.createNewCollection !== false) {
        // Create new collection
        const collectionName = uploadConfig.collectionName || 
          `${fileData.filename.replace(/\.[^/.]+$/, '')}_collection`;
        const collectionDescription = uploadConfig.collectionDescription || 
          `Collection created from ${fileData.filename}`;
        
        collectionId = await vectorEngine.createCollection(
          collectionName,
          768, // Default dimension
          collectionDescription,
          true // Public
        );
        
        console.log(`📋 Created new collection: ${collectionName} (${collectionId})`);
      } else {
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
      }

      // Insert chunks as vectors into the collection
      let insertedVectors = 0;
      const vectorIds: string[] = [];

      for (const chunk of processedDoc.chunks) {
        if (chunk.embedding) {
          try {
            const vectorId = await vectorEngine.insertVector(
              collectionId,
              chunk.embedding,
              {
                ...chunk.metadata,
                documentId: processedDoc.id,
                documentFilename: processedDoc.filename,
                chunkId: chunk.id,
                text: chunk.text,
                chunkIndex: chunk.chunkIndex,
                startIndex: chunk.startIndex,
                endIndex: chunk.endIndex,
                originalDocument: {
                  filename: processedDoc.filename,
                  size: processedDoc.originalSize,
                  timestamp: processedDoc.timestamp,
                  processingTime: processedDoc.processingTime
                }
              }
            );
            
            vectorIds.push(vectorId);
            insertedVectors++;
          } catch (error) {
            console.error(`Error inserting vector for chunk ${chunk.id}:`, error);
          }
        }
      }

      console.log(`✅ Uploaded and processed: ${insertedVectors}/${processedDoc.chunks.length} chunks inserted`);

      // Return comprehensive response
      reply.send({
        success: true,
        document: {
          id: processedDoc.id,
          filename: processedDoc.filename,
          originalSize: processedDoc.originalSize,
          textLength: processedDoc.textLength,
          processingTime: processedDoc.processingTime,
          storageMetadata: processedDoc.storageMetadata
        },
        collection: {
          id: collectionId,
          name: uploadConfig.collectionName || `${fileData.filename}_collection`,
          isNew: uploadConfig.createNewCollection !== false
        },
        processing: {
          chunkingStrategy: uploadConfig.chunkingStrategy,
          totalChunks: processedDoc.chunks.length,
          insertedVectors,
          generatedEmbeddings: processedDoc.chunks.filter(c => c.embedding).length,
          usedZeroGCompute: uploadConfig.useZeroGCompute || false
        },
        vectors: {
          ids: vectorIds,
          count: insertedVectors
        }
      });

    } catch (error: any) {
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
  fastify.get('/upload/info', async (request: FastifyRequest, reply: FastifyReply) => {
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
          examples: {
            basicUpload: {
              chunkingStrategy: {
                type: 'sentence',
                chunkSize: 1000,
                overlap: 100
              },
              generateEmbeddings: true,
              createNewCollection: true,
              collectionName: 'My Document Collection'
            },
            advancedUpload: {
              chunkingStrategy: {
                type: 'semantic',
                chunkSize: 1500,
                overlap: 200,
                metadata: {
                  custom: 'value'
                }
              },
              generateEmbeddings: true,
              useZeroGCompute: true,
              createNewCollection: false,
              existingCollectionId: 'existing-collection-id'
            }
          }
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        error: 'Failed to get upload info',
        message: error.message
      });
    }
  });

  /**
   * Get processing status for a document
   */
  fastify.get('/upload/status/:documentId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { documentId } = request.params as { documentId: string };
      
      // In a real implementation, you'd track processing status
      // For now, return a simple response
      reply.send({
        success: true,
        status: 'completed', // In reality: 'processing', 'completed', 'failed'
        documentId,
        message: 'Document processing status tracking not yet implemented'
      });
    } catch (error: any) {
      reply.status(500).send({
        error: 'Failed to get processing status',
        message: error.message
      });
    }
  });

  /**
   * Validate chunking strategy
   */
  fastify.post('/upload/validate-strategy', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { chunkingStrategy } = request.body as { chunkingStrategy: ChunkingStrategy };
      
      if (!chunkingStrategy) {
        return reply.status(400).send({
          error: 'Missing chunking strategy',
          message: 'Please provide a chunking strategy to validate'
        });
      }

      const isValid = DocumentProcessingService.validateChunkingStrategy(chunkingStrategy);
      
      reply.send({
        success: true,
        valid: isValid,
        strategy: chunkingStrategy,
        issues: isValid ? [] : [
          chunkingStrategy.chunkSize <= 0 && 'chunkSize must be greater than 0',
          chunkingStrategy.overlap < 0 && 'overlap must be non-negative',
          chunkingStrategy.overlap >= chunkingStrategy.chunkSize && 'overlap must be less than chunkSize'
        ].filter(Boolean)
      });
    } catch (error: any) {
      reply.status(500).send({
        error: 'Validation failed',
        message: error.message
      });
    }
  });
}
