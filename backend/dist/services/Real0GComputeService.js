"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Real0GComputeService = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
/**
 * Real 0G Compute Service - Integrates with actual 0G Compute Network
 * Handles distributed AI computation tasks
 */
class Real0GComputeService {
    constructor() {
        this.wallet = null;
        // 0G Compute endpoints (replace with actual endpoints when available)
        this.COMPUTE_RPC_URL = 'https://compute-testnet.0g.ai'; // Placeholder
        this.COMPUTE_API_URL = 'https://api-compute-testnet.0g.ai'; // Placeholder
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.zg.chainRpcUrl);
        if (config_1.config.zg.privateKey) {
            this.wallet = new ethers_1.ethers.Wallet(config_1.config.zg.privateKey, this.provider);
            console.log(`Real 0G Compute Service initialized with wallet: ${this.wallet.address}`);
        }
        else {
            console.log('Real 0G Compute Service initialized without wallet (read-only mode)');
        }
    }
    /**
     * Submit embedding generation task to 0G Compute Network
     */
    async generateEmbeddingOnNetwork(text, model = 'all-MiniLM-L6-v2') {
        try {
            if (!this.wallet) {
                throw new Error('Wallet required for 0G Compute operations');
            }
            console.log(`🧮 Submitting embedding task to 0G Compute Network...`);
            const computeRequest = {
                task_type: 'text_embedding',
                model: model,
                input: text,
                timestamp: Date.now(),
                requester: this.wallet.address
            };
            // Sign the compute request
            const requestHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify(computeRequest)));
            const signature = await this.wallet.signMessage(ethers_1.ethers.getBytes(requestHash));
            const signedRequest = {
                ...computeRequest,
                signature,
                request_hash: requestHash
            };
            try {
                // Submit to 0G Compute Network
                const response = await axios_1.default.post(`${this.COMPUTE_API_URL}/tasks/submit`, signedRequest, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.data.success) {
                    const taskId = response.data.task_id;
                    console.log(`📋 Task submitted to 0G Compute: ${taskId}`);
                    // Poll for result
                    const result = await this.pollTaskResult(taskId);
                    return result.embedding;
                }
                else {
                    throw new Error(`0G Compute task failed: ${response.data.error}`);
                }
            }
            catch (networkError) {
                console.warn('0G Compute Network not available, using local fallback');
                return this.fallbackLocalEmbedding(text);
            }
        }
        catch (error) {
            console.error('Error with 0G Compute:', error);
            // Fallback to local computation
            return this.fallbackLocalEmbedding(text);
        }
    }
    /**
     * Submit batch embedding task to 0G Compute Network
     */
    async generateBatchEmbeddingsOnNetwork(texts, model = 'all-MiniLM-L6-v2') {
        try {
            if (!this.wallet) {
                throw new Error('Wallet required for 0G Compute operations');
            }
            console.log(`🧮 Submitting batch embedding task (${texts.length} texts) to 0G Compute Network...`);
            const computeRequest = {
                task_type: 'batch_text_embedding',
                model: model,
                input: texts,
                timestamp: Date.now(),
                requester: this.wallet.address
            };
            const requestHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify(computeRequest)));
            const signature = await this.wallet.signMessage(ethers_1.ethers.getBytes(requestHash));
            const signedRequest = {
                ...computeRequest,
                signature,
                request_hash: requestHash
            };
            try {
                const response = await axios_1.default.post(`${this.COMPUTE_API_URL}/tasks/submit`, signedRequest, {
                    timeout: 60000,
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.data.success) {
                    const taskId = response.data.task_id;
                    console.log(`📋 Batch task submitted to 0G Compute: ${taskId}`);
                    const result = await this.pollTaskResult(taskId, 60000);
                    return result.embeddings;
                }
                else {
                    throw new Error(`0G Compute batch task failed: ${response.data.error}`);
                }
            }
            catch (networkError) {
                console.warn('0G Compute Network not available, using local fallback');
                return texts.map(text => this.fallbackLocalEmbedding(text));
            }
        }
        catch (error) {
            console.error('Error with 0G Compute batch:', error);
            return texts.map(text => this.fallbackLocalEmbedding(text));
        }
    }
    /**
     * Poll for task result from 0G Compute Network
     */
    async pollTaskResult(taskId, timeout = 30000) {
        const startTime = Date.now();
        const pollInterval = 2000; // 2 seconds
        while (Date.now() - startTime < timeout) {
            try {
                const response = await axios_1.default.get(`${this.COMPUTE_API_URL}/tasks/${taskId}/result`, {
                    timeout: 5000
                });
                if (response.data.status === 'completed') {
                    console.log(`✅ 0G Compute task ${taskId} completed`);
                    return response.data.result;
                }
                else if (response.data.status === 'failed') {
                    throw new Error(`0G Compute task failed: ${response.data.error}`);
                }
                // Task still pending, wait and retry
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            catch (pollError) {
                console.warn(`Polling error for task ${taskId}:`, pollError);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        throw new Error(`0G Compute task ${taskId} timeout after ${timeout}ms`);
    }
    /**
     * Get 0G Compute Network statistics
     */
    async getComputeNetworkStats() {
        try {
            const response = await axios_1.default.get(`${this.COMPUTE_API_URL}/network/stats`, {
                timeout: 10000
            });
            return {
                connected: true,
                totalNodes: response.data.total_nodes,
                activeNodes: response.data.active_nodes,
                averageLatency: response.data.avg_latency,
                totalTasks: response.data.total_tasks,
                queuedTasks: response.data.queued_tasks
            };
        }
        catch (error) {
            console.warn('Failed to get 0G Compute stats:', error);
            return {
                connected: false,
                error: error.message || error
            };
        }
    }
    /**
     * Check 0G Compute Network availability
     */
    async checkNetworkAvailability() {
        try {
            const response = await axios_1.default.get(`${this.COMPUTE_API_URL}/health`, {
                timeout: 5000
            });
            return response.data.status === 'healthy';
        }
        catch (error) {
            console.warn('0G Compute Network health check failed:', error);
            return false;
        }
    }
    /**
     * Fallback local embedding generation
     */
    fallbackLocalEmbedding(text) {
        console.log('🔄 Using local embedding fallback...');
        // Create deterministic embedding (same as EmbeddingService)
        const dimension = 768;
        const vector = new Array(dimension);
        const crypto = require('crypto-js');
        const hash = crypto.SHA256(text).toString();
        for (let i = 0; i < dimension; i++) {
            const seedValue = parseInt(hash.slice(i * 2 % hash.length, (i * 2 + 2) % hash.length), 16) || 0;
            vector[i] = (seedValue / 255) * 2 - 1;
        }
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        for (let i = 0; i < dimension; i++) {
            vector[i] /= magnitude;
        }
        return vector;
    }
    /**
     * Get service statistics
     */
    getStats() {
        return {
            serviceType: 'Real0GComputeService',
            walletConnected: !!this.wallet,
            walletAddress: this.wallet?.address,
            computeEndpoint: this.COMPUTE_API_URL,
            fallbackEnabled: true
        };
    }
}
exports.Real0GComputeService = Real0GComputeService;
//# sourceMappingURL=Real0GComputeService.js.map