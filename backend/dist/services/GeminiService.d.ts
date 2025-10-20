export interface GenerateAnswerResponse {
    answer: string;
    tokensUsed?: number;
}
/**
 * Service for interacting with Google's Gemini API
 */
export declare class GeminiService {
    private apiKey;
    private model;
    private apiUrl;
    constructor(apiKey: string);
    /**
     * Check if service is properly configured
     */
    isConfigured(): boolean;
    /**
     * Generate answer using Gemini based on context and query
     */
    generateAnswer(query: string, context: string[], temperature?: number): Promise<GenerateAnswerResponse>;
    /**
     * Build prompt with context and query
     */
    private buildPrompt;
    /**
     * Get service status
     */
    getServiceInfo(): {
        configured: boolean;
        model: string;
        apiUrl: string;
    };
}
//# sourceMappingURL=GeminiService.d.ts.map