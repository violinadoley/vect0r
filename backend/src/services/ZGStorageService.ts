import axios from 'axios';
import crypto from 'crypto-js';
import { ethers } from 'ethers';
import { config } from '../config';

export interface StorageMetadata {
  root: string;
  size: number;
  timestamp: number;
  checksum: string;
}

export interface StorageFile {
  id: string;
  name: string;
  data: Buffer | string;
  metadata: StorageMetadata;
}

/**
 * Service for interacting with 0G Storage Network
 * Handles vector data persistence and retrieval
 */
export class ZGStorageService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.zg.chainRpcUrl);
    
    if (config.zg.privateKey) {
      this.wallet = new ethers.Wallet(config.zg.privateKey, this.provider);
      console.log(`0G Storage Service initialized with wallet: ${this.wallet.address}`);
    } else {
      console.log('0G Storage Service initialized without wallet (read-only mode)');
    }
  }

  /**
   * Upload data to 0G Storage Network
   */
  async uploadData(data: Buffer | string, filename: string): Promise<StorageMetadata> {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const checksum = crypto.SHA256(dataBuffer.toString('hex')).toString();
      
      console.log(`Uploading ${filename} to 0G Storage (${dataBuffer.length} bytes)...`);

      // For now, we'll simulate 0G Storage upload
      // In production, this would use the actual 0G Storage SDK
      const metadata: StorageMetadata = {
        root: this.generateMerkleRoot(dataBuffer),
        size: dataBuffer.length,
        timestamp: Date.now(),
        checksum,
      };

      // Store data reference in our local cache for demo
      await this.storeDataLocally(metadata.root, dataBuffer, filename);

      console.log(`Successfully uploaded ${filename} with root: ${metadata.root}`);
      return metadata;

    } catch (error) {
      console.error('Error uploading to 0G Storage:', error);
      throw new Error(`Failed to upload ${filename}: ${error}`);
    }
  }

  /**
   * Download data from 0G Storage Network
   */
  async downloadData(root: string): Promise<Buffer> {
    try {
      console.log(`Downloading data with root: ${root}`);

      // For now, retrieve from local cache
      // In production, this would query 0G Storage nodes
      const data = await this.retrieveDataLocally(root);
      
      if (!data) {
        throw new Error(`Data not found for root: ${root}`);
      }

      console.log(`Successfully downloaded data (${data.length} bytes)`);
      return data;

    } catch (error) {
      console.error('Error downloading from 0G Storage:', error);
      throw new Error(`Failed to download data with root ${root}: ${error}`);
    }
  }

  /**
   * Upload vector collection data
   */
  async uploadVectorCollection(
    collectionId: string,
    vectors: any[],
    metadata: Record<string, any>
  ): Promise<StorageMetadata> {
    const collectionData = {
      collectionId,
      vectors,
      metadata,
      timestamp: Date.now(),
    };

    const dataString = JSON.stringify(collectionData, null, 2);
    const filename = `collection_${collectionId}.json`;

    return this.uploadData(dataString, filename);
  }

  /**
   * Download vector collection data
   */
  async downloadVectorCollection(root: string): Promise<{
    collectionId: string;
    vectors: any[];
    metadata: Record<string, any>;
    timestamp: number;
  }> {
    const data = await this.downloadData(root);
    return JSON.parse(data.toString());
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ 
    totalFiles: number; 
    totalSize: number; 
    walletAddress?: string;
    balance?: string;
  }> {
    const stats = {
      totalFiles: await this.getLocalFileCount(),
      totalSize: await this.getLocalStorageSize(),
      walletAddress: this.wallet?.address,
      balance: undefined as string | undefined,
    };

    if (this.wallet) {
      try {
        const balance = await this.provider.getBalance(this.wallet.address);
        stats.balance = ethers.formatEther(balance);
      } catch (error) {
        console.error('Error getting wallet balance:', error);
      }
    }

    return stats;
  }

  /**
   * Verify data integrity using checksum
   */
  async verifyData(root: string, expectedChecksum: string): Promise<boolean> {
    try {
      const data = await this.downloadData(root);
      const actualChecksum = crypto.SHA256(data.toString('hex')).toString();
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Error verifying data:', error);
      return false;
    }
  }

  // Private utility methods

  private generateMerkleRoot(data: Buffer): string {
    // Simplified Merkle root generation
    // In production, this would use proper Merkle tree implementation
    const hash = crypto.SHA256(data.toString('hex')).toString();
    return `0x${hash.substring(0, 64)}`;
  }

  private async storeDataLocally(root: string, data: Buffer, filename: string): Promise<void> {
    // This is a simplified local storage implementation
    // In production, this would interact with 0G Storage nodes
    const fs = require('fs').promises;
    const path = require('path');
    
    const storageDir = path.join(config.storage.uploadPath, 'zg-storage');
    await fs.mkdir(storageDir, { recursive: true });
    
    const filePath = path.join(storageDir, `${root}.dat`);
    const metaPath = path.join(storageDir, `${root}.meta`);
    
    await fs.writeFile(filePath, data);
    await fs.writeFile(metaPath, JSON.stringify({
      root,
      filename,
      size: data.length,
      timestamp: Date.now(),
    }));
  }

  private async retrieveDataLocally(root: string): Promise<Buffer | null> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const filePath = path.join(config.storage.uploadPath, 'zg-storage', `${root}.dat`);
      const data = await fs.readFile(filePath);
      return data;
    } catch (error) {
      return null;
    }
  }

  private async getLocalFileCount(): Promise<number> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const storageDir = path.join(config.storage.uploadPath, 'zg-storage');
      const files = await fs.readdir(storageDir);
      return files.filter((f: string) => f.endsWith('.dat')).length;
    } catch (error) {
      return 0;
    }
  }

  private async getLocalStorageSize(): Promise<number> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const storageDir = path.join(config.storage.uploadPath, 'zg-storage');
      const files = await fs.readdir(storageDir);
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith('.dat')) {
          const stats = await fs.stat(path.join(storageDir, file));
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }
}
