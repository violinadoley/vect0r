import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // 0G Network Configuration
  zg: {
    chainRpcUrl: process.env.ZG_CHAIN_RPC_URL || 'https://evmrpc.0g.ai',
    storageUrl: process.env.ZG_STORAGE_URL || 'https://storage.0g.ai',
    indexerUrl: process.env.ZG_INDEXER_URL || 'https://indexer-storage.0g.ai',
    chainId: parseInt(process.env.ZG_CHAIN_ID || '16661'),
    privateKey: process.env.PRIVATE_KEY || '',
  },

  // Smart Contract Addresses
  contracts: {
    vectorRegistry: process.env.VECTOR_REGISTRY_ADDRESS || '',
    storageOracle: process.env.STORAGE_ORACLE_ADDRESS || '',
  },

  // Vector Database Configuration
  vector: {
    dimension: parseInt(process.env.VECTOR_DIMENSION || '768'),
    hnsw: {
      m: parseInt(process.env.HNSW_M || '16'),
      efConstruction: parseInt(process.env.HNSW_EF_CONSTRUCTION || '200'),
      efSearch: parseInt(process.env.HNSW_EF_SEARCH || '50'),
    },
  },

  // Storage Configuration
  storage: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // AI/ML Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
};

// Validate required configuration
if (!config.zg.privateKey && config.nodeEnv !== 'development') {
  console.warn('Warning: PRIVATE_KEY not set. Some 0G features may not work.');
}

export default config;
