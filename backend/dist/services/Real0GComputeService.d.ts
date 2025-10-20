/**
 * Real 0G Compute Service - Integrates with actual 0G Compute Network
 * Handles distributed AI computation tasks
 */
export declare class Real0GComputeService {
    private provider;
    private wallet;
    private readonly COMPUTE_RPC_URL;
    private readonly COMPUTE_API_URL;
    constructor();
    /**
     * Submit embedding generation task to 0G Compute Network
     */
    generateEmbeddingOnNetwork(text: string, model?: string): Promise<number[]>;
    /**
     * Submit batch embedding task to 0G Compute Network
     */
    generateBatchEmbeddingsOnNetwork(texts: string[], model?: string): Promise<number[][]>;
    /**
     * Poll for task result from 0G Compute Network
     */
    private pollTaskResult;
    /**
     * Get 0G Compute Network statistics
     */
    getComputeNetworkStats(): Promise<any>;
    /**
     * Check 0G Compute Network availability
     */
    checkNetworkAvailability(): Promise<boolean>;
    /**
     * Fallback local embedding generation
     */
    private fallbackLocalEmbedding;
    /**
     * Get service statistics
     */
    getStats(): any;
}
//# sourceMappingURL=Real0GComputeService.d.ts.map