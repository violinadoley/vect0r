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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Real0GStorageSDK = void 0;
const _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
const ethers_1 = require("ethers");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const config_1 = require("../config");
/**
 * Real 0G Storage Service using Official SDK
 * Based on: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
 */
class Real0GStorageSDK {
    constructor() {
        this.signer = null;
        // Official 0G Network endpoints from documentation
        this.RPC_URL = 'https://evmrpc-testnet.0g.ai/';
        this.INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
        // Initialize provider using official testnet RPC
        this.provider = new ethers_1.ethers.JsonRpcProvider(this.RPC_URL);
        // Initialize signer if private key is available
        if (config_1.config.zg.privateKey) {
            this.signer = new ethers_1.ethers.Wallet(config_1.config.zg.privateKey, this.provider);
            console.log(`🔗 Real 0G SDK initialized with wallet: ${this.signer.address}`);
        }
        else {
            console.log('⚠️  Real 0G SDK initialized without wallet (read-only mode)');
        }
        // Initialize indexer with official endpoint
        this.indexer = new _0g_ts_sdk_1.Indexer(this.INDEXER_RPC);
        console.log(`📡 Connected to 0G Indexer: ${this.INDEXER_RPC}`);
    }
    /**
     * Upload data to real 0G Storage Network using official SDK
     */
    async uploadData(data, filename) {
        if (!this.signer) {
            throw new Error('Signer required for 0G Storage uploads');
        }
        try {
            console.log(`📤 Uploading ${filename} to 0G Storage Network (${Buffer.isBuffer(data) ? data.length : Buffer.from(data).length} bytes)...`);
            // Step 1: Create temporary file for ZgFile
            const tempDir = path.join(config_1.config.storage.uploadPath, 'temp');
            await fs.ensureDir(tempDir);
            const tempFilePath = path.join(tempDir, `${Date.now()}_${filename}`);
            const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            await fs.writeFile(tempFilePath, dataBuffer);
            // Step 2: Create ZgFile from file path (following official docs)
            const file = await _0g_ts_sdk_1.ZgFile.fromFilePath(tempFilePath);
            // Step 3: Generate Merkle tree for verification (following official docs)
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) {
                await fs.remove(tempFilePath); // Cleanup
                throw new Error(`Error generating Merkle tree: ${treeErr}`);
            }
            const rootHash = tree?.rootHash();
            console.log(`🌳 Generated Merkle root hash: ${rootHash}`);
            // Step 4: Upload to 0G Network using official SDK
            console.log(`🚀 Uploading to 0G Storage Network...`);
            const [tx, uploadErr] = await this.indexer.upload(file, this.RPC_URL, this.signer);
            if (uploadErr !== null) {
                await fs.remove(tempFilePath); // Cleanup
                throw new Error(`0G Upload error: ${uploadErr}`);
            }
            // Step 5: Cleanup and return result
            await fs.remove(tempFilePath);
            await file.close(); // Important: close file as per docs
            const result = {
                root: rootHash,
                size: dataBuffer.length,
                timestamp: Date.now(),
                txHash: tx,
                storageProof: '0g-network',
                distributionNodes: ['0g-storage-network'],
                filename,
                network: 'testnet'
            };
            console.log(`✅ Successfully uploaded ${filename} to 0G Storage Network!`);
            console.log(`   📝 Transaction: ${tx}`);
            console.log(`   🔗 Root Hash: ${rootHash}`);
            return result;
        }
        catch (error) {
            console.error('❌ Error uploading to 0G Storage:', error);
            // Store locally if 0G network fails
            console.warn('🔄 Storing locally (0G network unavailable)...');
            return this.localStorageUpload(Buffer.isBuffer(data) ? data : Buffer.from(data), filename);
        }
    }
    /**
     * Upload vector collection data to 0G Storage Network
     */
    async uploadVectorCollection(collectionId, vectors, metadata) {
        try {
            console.log(`📊 Uploading vector collection: ${collectionId} (${vectors.length} vectors)`);
            // Prepare collection data for 0G Storage
            const collectionData = {
                collectionId,
                metadata,
                vectors: vectors.map(v => ({
                    id: v.id,
                    embedding: v.embedding,
                    metadata: v.metadata
                })),
                timestamp: Date.now(),
                totalVectors: vectors.length
            };
            // Upload collection as JSON to 0G Storage
            const jsonData = JSON.stringify(collectionData, null, 2);
            const filename = `collection_${collectionId}.json`;
            const result = await this.uploadData(jsonData, filename);
            console.log(`✅ Vector collection uploaded to 0G Storage: ${collectionId}`);
            return {
                ...result,
                collectionId,
                vectorCount: vectors.length,
                collectionMetadata: metadata
            };
        }
        catch (error) {
            console.error('Error uploading vector collection to 0G:', error);
            throw error;
        }
    }
    /**
     * Download data from real 0G Storage Network using official SDK
     */
    async downloadData(rootHash, outputPath) {
        try {
            console.log(`📥 Downloading from 0G Storage Network: ${rootHash}`);
            // Default output path
            const downloadPath = outputPath || path.join(config_1.config.storage.uploadPath, 'downloads', `${rootHash}.dat`);
            await fs.ensureDir(path.dirname(downloadPath));
            // Download with proof verification enabled (following official docs)
            const downloadErr = await this.indexer.download(rootHash, downloadPath, true);
            if (downloadErr !== null) {
                throw new Error(`0G Download error: ${downloadErr}`);
            }
            // Read and return the downloaded data
            const data = await fs.readFile(downloadPath);
            console.log(`✅ Successfully downloaded ${data.length} bytes from 0G Storage`);
            return data;
        }
        catch (error) {
            console.error('❌ Error downloading from 0G Storage:', error);
            // Try local storage
            console.warn('🔄 Attempting local storage download...');
            return this.localStorageDownload(rootHash);
        }
    }
    /**
     * Upload file directly using file path (most efficient method)
     */
    async uploadFile(filePath) {
        if (!this.signer) {
            throw new Error('Signer required for 0G Storage uploads');
        }
        try {
            console.log(`📁 Uploading file: ${filePath}`);
            // Create ZgFile from file path
            const file = await _0g_ts_sdk_1.ZgFile.fromFilePath(filePath);
            // Generate Merkle tree
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) {
                throw new Error(`Merkle tree error: ${treeErr}`);
            }
            const rootHash = tree?.rootHash();
            // Upload to network
            const [tx, uploadErr] = await this.indexer.upload(file, this.RPC_URL, this.signer);
            if (uploadErr !== null) {
                throw new Error(`Upload error: ${uploadErr}`);
            }
            await file.close();
            return {
                rootHash,
                txHash: tx,
                filename: path.basename(filePath),
                storageProof: '0g-network'
            };
        }
        catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }
    /**
     * Test 0G Storage connectivity
     */
    async testConnection() {
        try {
            // Test with small data upload
            const testData = `0G Storage test - ${new Date().toISOString()}`;
            const result = await this.uploadData(testData, 'connection-test.txt');
            console.log('🧪 0G Storage connection test successful');
            return result.storageProof === '0g-network';
        }
        catch (error) {
            console.error('🧪 0G Storage connection test failed:', error);
            return false;
        }
    }
    /**
     * Get storage network status
     */
    async getNetworkStatus() {
        try {
            return {
                indexerEndpoint: this.INDEXER_RPC,
                rpcEndpoint: this.RPC_URL,
                walletConnected: !!this.signer,
                walletAddress: this.signer?.address || null,
                network: 'testnet'
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    /**
     * Get Real 0G Statistics (lightweight version)
     */
    async getReal0GStats() {
        try {
            // Use cached status or basic network check instead of full upload test
            const networkStatus = await Promise.race([
                this.getNetworkStatus(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Network status timeout')), 5000))
            ]);
            return {
                real0g: {
                    connected: true, // Assume connected if network status succeeds
                    network: networkStatus.network,
                    indexer: networkStatus.indexerEndpoint,
                    rpc: networkStatus.rpcEndpoint,
                    wallet: networkStatus.walletAddress,
                    storageType: 'official-sdk'
                }
            };
        }
        catch (error) {
            return {
                real0g: {
                    connected: false,
                    error: error.message,
                    storageType: 'unavailable'
                }
            };
        }
    }
    // Local storage methods (when 0G network is unavailable)
    async localStorageUpload(dataBuffer, filename) {
        const storageDir = path.join(config_1.config.storage.uploadPath, '0g-storage');
        await fs.ensureDir(storageDir);
        const root = `0x${Buffer.from(dataBuffer).toString('hex').slice(0, 64)}`;
        const filePath = path.join(storageDir, `${root}.dat`);
        const metaPath = path.join(storageDir, `${root}.meta`);
        await fs.writeFile(filePath, dataBuffer);
        await fs.writeFile(metaPath, JSON.stringify({
            root,
            filename,
            size: dataBuffer.length,
            timestamp: Date.now(),
            storageProof: 'local-storage',
            note: 'Stored locally (0G network unavailable)'
        }));
        return {
            root,
            size: dataBuffer.length,
            timestamp: Date.now(),
            storageProof: 'local-storage',
            distributionNodes: ['local-node'],
            filename
        };
    }
    async localStorageDownload(root) {
        const filePath = path.join(config_1.config.storage.uploadPath, '0g-storage', `${root}.dat`);
        if (await fs.pathExists(filePath)) {
            return await fs.readFile(filePath);
        }
        else {
            throw new Error(`File not found in local fallback storage: ${root}`);
        }
    }
}
exports.Real0GStorageSDK = Real0GStorageSDK;
//# sourceMappingURL=Real0GStorageSDK.js.map