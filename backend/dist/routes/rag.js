"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragRoutes = ragRoutes;
async function ragRoutes(fastify, vectorEngine, embeddingService, geminiService) {
    /**
     * RAG Query Endpoint
     * Performs retrieval-augmented generation using vector search + Gemini
     */
    fastify.post('/rag/query', async (request, reply) => {
        const startTime = Date.now();
        try {
            const { collectionId, query, topK = 5, includeMetadata = true } = request.body;
            // Validate inputs
            if (!collectionId || !query) {
                return reply.status(400).send({
                    success: false,
                    error: 'collectionId and query are required'
                });
            }
            if (!query.trim()) {
                return reply.status(400).send({
                    success: false,
                    error: 'Query cannot be empty'
                });
            }
            // Check if collection exists
            const collection = vectorEngine.getCollection(collectionId);
            if (!collection) {
                return reply.status(404).send({
                    success: false,
                    error: 'Collection not found'
                });
            }
            if (collection.count === 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'Collection is empty. Please upload documents first.'
                });
            }
            // Check if Gemini is configured
            if (!geminiService.isConfigured()) {
                return reply.status(503).send({
                    success: false,
                    error: 'Gemini AI service not configured. Please add GEMINI_API_KEY to environment.'
                });
            }
            console.log(`🔍 RAG Query: "${query}" in collection: ${collection.name}`);
            // Step 1: Generate embedding for query
            console.log(`📊 Step 1: Generating query embedding...`);
            const queryEmbedding = await embeddingService.generateEmbedding(query);
            // Step 2: Search for similar vectors
            console.log(`🔎 Step 2: Searching for top ${topK} similar vectors...`);
            const searchResults = await vectorEngine.searchVectors(collectionId, queryEmbedding.vector, topK);
            if (searchResults.length === 0) {
                return reply.send({
                    success: true,
                    answer: 'I could not find any relevant information in the collection to answer your question.',
                    sources: [],
                    processingTime: Date.now() - startTime,
                    queryEmbedding: includeMetadata ? queryEmbedding.vector : undefined
                });
            }
            console.log(`✅ Found ${searchResults.length} relevant chunks`);
            // Step 3: Extract context from results
            console.log(`📄 Step 3: Extracting context from results...`);
            const sources = [];
            const contextChunks = [];
            for (const result of searchResults) {
                const text = result.metadata.text || '';
                if (text) {
                    contextChunks.push(text);
                    sources.push({
                        vectorId: result.id,
                        text,
                        score: result.score,
                        metadata: includeMetadata ? result.metadata : {}
                    });
                }
            }
            if (contextChunks.length === 0) {
                return reply.send({
                    success: true,
                    answer: 'The relevant documents do not contain readable text to answer your question.',
                    sources: [],
                    processingTime: Date.now() - startTime
                });
            }
            // Step 4: Generate answer using Gemini
            console.log(`🤖 Step 4: Generating answer with Gemini AI...`);
            const geminiResponse = await geminiService.generateAnswer(query, contextChunks, 0.7 // temperature
            );
            const processingTime = Date.now() - startTime;
            console.log(`✅ RAG query completed in ${processingTime}ms`);
            // Return response
            reply.send({
                success: true,
                answer: geminiResponse.answer,
                sources,
                processingTime,
                tokensUsed: geminiResponse.tokensUsed,
                queryEmbedding: includeMetadata ? queryEmbedding.vector : undefined,
                collectionName: collection.name
            });
        }
        catch (error) {
            console.error('❌ Error processing RAG query:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to process RAG query',
                message: error.message,
                processingTime: Date.now() - startTime
            });
        }
    });
    /**
     * Get RAG service status
     */
    fastify.get('/rag/status', async (request, reply) => {
        try {
            const geminiInfo = geminiService.getServiceInfo();
            const collections = await vectorEngine.listCollections();
            const availableCollections = collections.filter(c => c.count > 0);
            reply.send({
                success: true,
                status: {
                    gemini: geminiInfo,
                    availableCollections: availableCollections.length,
                    collections: availableCollections.map(c => ({
                        id: c.id,
                        name: c.name,
                        vectorCount: c.count
                    }))
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: 'Failed to get RAG status',
                message: error.message
            });
        }
    });
}
//# sourceMappingURL=rag.js.map