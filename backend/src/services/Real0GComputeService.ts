import axios from 'axios';
import { ethers } from 'ethers';
import { config } from '../config';

/**
 * Real 0G Compute Service - Integrates with actual 0G Compute Network
 * Handles distributed AI computation tasks
 */
export class Real0GComputeService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  
  // 0G Compute endpoints
  private readonly COMPUTE_RPC_URL = 'https://compute.0g.ai';
  private readonly COMPUTE_API_URL = 'https://api-compute.0g.ai';

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.zg.chainRpcUrl);
    
    if (config.zg.privateKey) {
      this.wallet = new ethers.Wallet(config.zg.privateKey, this.provider);
      console.log(`Real 0G Compute Service initialized with wallet: ${this.wallet.address}`);
    } else {
      console.log('Real 0G Compute Service initialized without wallet (read-only mode)');
    }
  }

  /**
   * Submit embedding generation task to 0G Compute Network
   */
  async generateEmbeddingOnNetwork(text: string, model: string = 'all-MiniLM-L6-v2'): Promise<number[]> {
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
      const requestHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(computeRequest)));
      const signature = await this.wallet.signMessage(ethers.getBytes(requestHash));

      const signedRequest = {
        ...computeRequest,
        signature,
        request_hash: requestHash
      };

      try {
        // Submit to 0G Compute Network
        const response = await axios.post(`${this.COMPUTE_API_URL}/tasks/submit`, signedRequest, {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          const taskId = response.data.task_id;
          console.log(`📋 Task submitted to 0G Compute: ${taskId}`);
          
          // Poll for result
          const result = await this.pollTaskResult(taskId);
          return result.embedding;
        } else {
          throw new Error(`0G Compute task failed: ${response.data.error}`);
        }

      } catch (networkError: any) {
        console.error('❌ 0G Compute Network unavailable:', networkError);
        throw new Error(`0G Compute Network unavailable: ${networkError.message || networkError}`);
      }

    } catch (error: any) {
      console.error('❌ Error with 0G Compute:', error);
      throw new Error(`Failed to generate embedding via 0G Compute: ${error.message || error}`);
    }
  }

  /**
   * Submit batch embedding task to 0G Compute Network
   */
  async generateBatchEmbeddingsOnNetwork(texts: string[], model: string = 'all-MiniLM-L6-v2'): Promise<number[][]> {
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

      const requestHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(computeRequest)));
      const signature = await this.wallet.signMessage(ethers.getBytes(requestHash));

      const signedRequest = {
        ...computeRequest,
        signature,
        request_hash: requestHash
      };

      try {
        const response = await axios.post(`${this.COMPUTE_API_URL}/tasks/submit`, signedRequest, {
          timeout: 60000,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          const taskId = response.data.task_id;
          console.log(`📋 Batch task submitted to 0G Compute: ${taskId}`);
          
          const result = await this.pollTaskResult(taskId, 60000);
          return result.embeddings;
        } else {
          throw new Error(`0G Compute batch task failed: ${response.data.error}`);
        }

      } catch (networkError: any) {
        console.error('❌ 0G Compute Network unavailable:', networkError);
        throw new Error(`0G Compute Network unavailable: ${networkError.message || networkError}`);
      }

    } catch (error: any) {
      console.error('❌ Error with 0G Compute batch:', error);
      throw new Error(`Failed to generate batch embeddings via 0G Compute: ${error.message || error}`);
    }
  }

  /**
   * Poll for task result from 0G Compute Network
   */
  private async pollTaskResult(taskId: string, timeout: number = 30000): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(`${this.COMPUTE_API_URL}/tasks/${taskId}/result`, {
          timeout: 5000
        });

        if (response.data.status === 'completed') {
          console.log(`✅ 0G Compute task ${taskId} completed`);
          return response.data.result;
        } else if (response.data.status === 'failed') {
          throw new Error(`0G Compute task failed: ${response.data.error}`);
        }

        // Task still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (pollError) {
        console.warn(`Polling error for task ${taskId}:`, pollError);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`0G Compute task ${taskId} timeout after ${timeout}ms`);
  }

  /**
   * Get 0G Compute Network statistics
   */
  async getComputeNetworkStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.COMPUTE_API_URL}/network/stats`, {
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

    } catch (error: any) {
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
  async checkNetworkAvailability(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.COMPUTE_API_URL}/health`, {
        timeout: 5000
      });
      
      return response.data.status === 'healthy';
    } catch (error) {
      console.warn('0G Compute Network health check failed:', error);
      return false;
    }
  }


  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      serviceType: 'Real0GComputeService',
      walletConnected: !!this.wallet,
      walletAddress: this.wallet?.address,
      computeEndpoint: this.COMPUTE_API_URL,
      fallbackEnabled: false
    };
  }
}
