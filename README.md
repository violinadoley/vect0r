<div align="center">
  <img src="logo.jpeg" alt="Vect0r Logo" width="200"/>
</div>

# Vect0r - The First Decentralized Vector Database Built on 0G Network

Vect0r is a decentralized vector database that combines Hierarchical Navigable Small World (HNSW) indexing with blockchain-powered data integrity and distributed storage. Built specifically for the 0G Network ecosystem, Vect0r is a push towards making Artificial Intelligence and its power a truly public asset. It works to decentralize the core infrastructure—the vector database—which powers RAG, Semantic Search, Knowledge Systems, and many other AI-powered utilities throughout the world, preventing censorship and vendor lock-in, increasing transparency, while also reducing overhead costs and latency.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![0G Network](https://img.shields.io/badge/Built%20on-0G%20Network-blue)](https://0g.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-orange)](https://soliditylang.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [0G Network Integration](#0g-network-integration)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Use Cases](#use-cases)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Vect0r solves the critical problem of vendor lock-in and centralization in modern vector databases. Traditional vector DB services require trusting a single provider with your AI embeddings and giving up control over your data. Vect0r changes this by leveraging 0G Network's decentralized storage and blockchain infrastructure to create a truly open, permissionless vector database.

### What Makes Vect0r Different?

- **Truly Decentralized**: Data stored on 0G Storage Network with on-chain metadata and access control
- **High Performance**: HNSW (Hierarchical Navigable Small World) indexing for millisecond-latency searches
- **Smart Contract Governance**: Immutable collection registry and storage oracle on 0G Chain
- **Developer Friendly**: RESTful APIs, automatic embeddings, RAG support, and document processing
- **Zero Vendor Lock-in**: Open standards, portable infrastructure, deploy anywhere

---

## ✨ Key Features

### Vector Operations
- ✅ **High-performance vector search** with HNSW indexing (configurable M, efConstruction, efSearch)
- ✅ **Configurable vector dimensions** (default: 768, supports any dimension)
- ✅ **Cosine similarity search** with metadata filtering
- ✅ **Batch vector operations** for efficient bulk processing
- ✅ **Real-time collection management** with CRUD operations

### Document Processing
- ✅ **Multi-format support**: PDF, TXT, Markdown, JSON
- ✅ **Intelligent chunking strategies**: Fixed, Sentence, Paragraph, Semantic
- ✅ **Automatic embedding generation** via Google Gemini
- ✅ **Configurable chunk sizes and overlap** for optimal context preservation
- ✅ **Metadata extraction and storage** for rich document information

### Blockchain Integration
- ✅ **VectorRegistry Smart Contract** - Immutable collection metadata on 0G Chain
- ✅ **StorageOracle Smart Contract** - Data distribution tracking and integrity verification
- ✅ **Role-based access control** (Admin, Operator, User, Oracle)
- ✅ **On-chain governance** with pausable contracts
- ✅ **Event logging** for all critical operations

### Storage & Retrieval
- ✅ **0G Storage SDK Integration** - Official 0G Network storage implementation
- ✅ **Merkle tree verification** for data integrity
- ✅ **Automatic replication management** with configurable redundancy
- ✅ **Local fallback storage** when network is unavailable
- ✅ **Efficient data serialization** with compression support

### AI/ML Features
- ✅ Quick **Retrieval-Augmented Generation (RAG)** Question-Answer spin-up with Gemini integration
- ✅ **Semantic search** across document collections
- ✅ **Context-aware query expansion** for better results
- ✅ **Automatic text-to-embedding** pipeline

---

## 🏗️ Architecture

Vect0r follows a three-tier architecture designed for scalability, maintainability, and decentralization.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Doc Upload  │  │ Collections  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                    Backend (Fastify + TypeScript)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              VectorEngine (HNSW Core)                    │   │
│  │  • Collection Management  • Vector Search                │   │
│  │  • Batch Operations      • Metadata Filtering            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │ EmbeddingService  │  │ GeminiService     │                   │
│  │ • Text→Vector     │  │ • RAG Queries     │                   │
│  └───────────────────┘  └───────────────────┘                   │
│                                                                   │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │ DocumentService   │  │ Real0GStorageSDK  │                   │
│  │ • PDF/Text Parse  │  │ • Upload/Download │                   │
│  │ • Chunking        │  │ • Merkle Trees    │                   │
│  └───────────────────┘  └───────────────────┘                   │
│                                                                   │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │ VectorRegistry    │  │ StorageOracle     │                   │
│  │ Service           │  │ Service           │                   │
│  └─────────┬─────────┘  └─────────┬─────────┘                   │
└────────────┼────────────────────────┼─────────────────────────────┘
             │                        │
             │ Web3 / ethers.js       │
             │                        │
┌────────────▼────────────────────────▼─────────────────────────────┐
│                     0G Network Blockchain                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                Smart Contracts (Solidity)                 │    │
│  │  ┌────────────────────┐  ┌────────────────────┐          │    │
│  │  │  VectorRegistry    │  │  StorageOracle     │          │    │
│  │  │  • Collections     │  │  • Node Tracking   │          │    │
│  │  │  • Access Control  │  │  • Replication     │          │    │
│  │  │  • Metadata        │  │  • Integrity       │          │    │
│  │  └────────────────────┘  └────────────────────┘          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Deployed on: 0G Testnet (Chain ID: 16602)                        │
│  RPC: https://evmrpc-testnet.0g.ai                                │
└────────────────────────────────────────────────────────────────────┘
                             │
                             │ 0G Storage SDK
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    0G Storage Network                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Storage Node │  │ Storage Node │  │ Storage Node │          │
│  │  • Vector    │  │  • Documents │  │  • Metadata  │          │
│  │    Data      │  │  • Chunks    │  │  • Replicas  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Indexer: https://indexer-storage-testnet-turbo.0g.ai           │
└───────────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **Frontend → Backend**: REST API calls for document upload, collection management, and search
2. **Backend → VectorEngine**: In-memory HNSW index operations
3. **Backend → 0G Storage**: Direct upload/download via official 0G SDK with Merkle proof verification
4. **Backend → Smart Contracts**: Write collection metadata and storage records on-chain
5. **Smart Contracts → 0G Chain**: Event emission and state persistence
6. **Storage Nodes → Blockchain**: Register storage proofs and availability

---

## 🌐 0G Network Integration

This section details **exactly where, how, and why** Vect0r leverages 0G Network's infrastructure.

### 1. 0G Storage Network Integration

**File**: `backend/src/services/Real0GStorageSDK.ts`

#### Where It's Used:
- **Document Storage**: All processed documents and vector collections are uploaded to 0G Storage
- **Vector Data Persistence**: Embeddings and metadata stored across distributed 0G nodes
- **Merkle Tree Generation**: Each upload generates cryptographic proofs for integrity

#### How It Works:
```typescript
// Official 0G SDK Integration
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';

// Endpoints (Official 0G Testnet)
const RPC_URL = 'https://evmrpc-testnet.0g.ai/';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

// Upload Process:
// 1. Create ZgFile from buffer/path
const file = await ZgFile.fromFilePath(tempFilePath);

// 2. Generate Merkle tree for verification
const [tree, treeErr] = await file.merkleTree();
const rootHash = tree?.rootHash(); // Cryptographic proof

// 3. Upload to 0G Network with proof
const [tx, uploadErr] = await this.indexer.upload(file, this.RPC_URL, this.signer);

// 4. Store root hash for future retrieval
return {
  root: rootHash,           // 0G Storage identifier
  txHash: tx,               // Blockchain transaction
  storageProof: '0g-network' // Proof of decentralized storage
};
```

#### Why 0G Storage:
- ✅ **Decentralization**: No single point of failure, data distributed across nodes
- ✅ **Integrity**: Merkle tree proofs ensure data hasn't been tampered with
- ✅ **Availability**: Automatic replication ensures data is always accessible
- ✅ **Cost-Effective**: More economical than traditional cloud storage at scale
- ✅ **Censorship Resistant**: No central authority can delete or block your data

#### API Endpoints Using 0G Storage:
- `POST /api/v1/upload` - Upload documents → stored in 0G Storage
- `POST /api/v1/collections/:id/sync` - Sync collection data → 0G Storage
- `GET /api/v1/upload/info` - Get 0G Storage statistics

---

### 2. VectorRegistry Smart Contract

**File**: `contracts/contracts/VectorRegistry.sol`  
**Deployed Address**: `0x6ab136BdDDffAC066BBe0Cc226599777B601f775` (0G Testnet)

#### Where It's Used:
- **Collection Creation**: Every new vector collection is registered on-chain
- **Access Control**: Permissions managed via blockchain-based roles
- **Metadata Storage**: Collection metadata (dimension, count, owner) stored immutably

#### How It Works:
```solidity
// On-Chain Collection Structure
struct Collection {
    string name;                // Human-readable name
    string description;         // Collection description
    uint256 dimension;          // Vector dimension (768, 1536, etc.)
    uint256 vectorCount;        // Total vectors stored
    address owner;              // Owner's wallet address
    bool isPublic;              // Public or private access
    uint256 createdAt;          // Creation timestamp
    uint256 updatedAt;          // Last update timestamp
    string storageRoot;         // 0G Storage root hash (!)
    bytes32 metadataHash;       // Content integrity hash
}

// Key Functions:
function createCollection(...) external;      // Register new collection
function updateCollection(...) external;      // Update 0G storage root
function addVectorMetadata(...) external;     // Add vector to collection
function grantAccess(...) external;           // Grant user access
function getCollection(...) external view;    // Retrieve collection info
```

#### Backend Integration:
**File**: `backend/src/services/VectorRegistryService.ts`

```typescript
// Creating collection on blockchain
await vectorRegistryContract.createCollection(
  collectionId,      // UUID
  name,              // "My Documents"
  description,       // "PDF knowledge base"
  dimension,         // 768
  isPublic          // true/false
);

// Update with 0G Storage root after upload
await vectorRegistryContract.updateCollection(
  collectionId,
  storageRoot,       // 0G Storage root hash (!)
  vectorCount,
  metadataHash
);
```

#### Why On-Chain Registry:
- ✅ **Immutability**: Collection metadata cannot be altered without permission
- ✅ **Transparency**: All operations are auditable on the blockchain
- ✅ **Access Control**: Cryptographically enforced permissions
- ✅ **Interoperability**: Other dApps can query your collections
- ✅ **Ownership**: You truly own your vector data, provable on-chain

---

### 3. StorageOracle Smart Contract

**File**: `contracts/contracts/StorageOracle.sol`  
**Deployed Address**: `0x9C4a249A04613651CBa2E33a8FFE316f15B639A8` (0G Testnet)

#### Where It's Used:
- **Data Distribution Tracking**: Records which 0G nodes store which data
- **Replication Management**: Ensures minimum replication factor (default: 3)
- **Integrity Verification**: Monitors data integrity across storage nodes
- **Node Health Monitoring**: Tracks node reliability and availability

#### How It Works:
```solidity
// On-Chain Storage Record
struct StorageEntry {
    string root;                 // 0G Storage root hash (!)
    string[] nodeAddresses;      // Which nodes have the data
    uint256 size;                // Data size in bytes
    uint256 replicationFactor;   // How many copies exist
    uint256 timestamp;           // Last update time
    bool isActive;               // Is data still stored
    bytes32 integrityHash;       // For verification
}

// Key Functions:
function registerDataStorage(...) external;   // Register data on 0G nodes
function verifyIntegrity(...) external;       // Verify data hasn't changed
function requestReplication(...) external;    // Request more copies
function getStorageEntry(...) external view;  // Query storage status
```

#### Backend Integration:
**File**: `backend/src/services/StorageOracleService.ts`

```typescript
// Register document in 0G Storage
await storageOracleContract.registerDataStorage(
  storageRoot,           // From 0G SDK upload
  nodeAddresses,         // ['node1', 'node2', 'node3']
  dataSize,              // Bytes
  integrityHash          // keccak256(data)
);

// Verify data integrity
await storageOracleContract.verifyIntegrity(
  storageRoot,
  nodeAddress,
  actualHash             // From 0G node
);
```

#### Why Storage Oracle:
- ✅ **Data Availability Guarantee**: Ensures data is replicated across nodes
- ✅ **Automatic Failover**: If a node goes down, triggers re-replication
- ✅ **Integrity Monitoring**: Catches data corruption early
- ✅ **Node Accountability**: Unreliable nodes get penalized (reliability score)
- ✅ **SLA Enforcement**: Smart contract enforces storage guarantees

---

### 4. 0G Chain RPC Integration

**Configuration**: `backend/src/config/index.ts`

```typescript
zg: {
  chainRpcUrl: 'https://evmrpc-testnet.0g.ai',      // 0G Chain RPC
  storageUrl: 'https://storage-testnet.0g.ai',       // Storage Gateway
  indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai', // Indexer
  chainId: 16602,                                    // 0G Testnet Chain ID
}
```

#### Why 0G Chain:
- ✅ **High Throughput**: Fast transaction confirmation for metadata updates
- ✅ **Low Fees**: Economical for frequent collection updates
- ✅ **EVM Compatible**: Use existing Ethereum tools and libraries
- ✅ **Built-in Storage Integration**: Seamless connection to 0G Storage Network

---

### 0G Integration Summary Table

| Component | 0G Feature Used | Purpose | File Location |
|-----------|----------------|---------|---------------|
| **Real0GStorageSDK** | 0G Storage + Indexer | Store vector data, documents, embeddings | `backend/src/services/Real0GStorageSDK.ts` |
| **VectorRegistry** | 0G Chain Smart Contract | On-chain collection metadata & access control | `contracts/contracts/VectorRegistry.sol` |
| **StorageOracle** | 0G Chain Smart Contract | Track data distribution & replication | `contracts/contracts/StorageOracle.sol` |
| **VectorEngine** | Both Storage & Chain | Sync local index with blockchain & storage | `backend/src/core/VectorEngine.ts` |
| **Document Processing** | 0G Storage | Upload processed docs with Merkle proofs | `backend/src/services/DocumentProcessingService.ts` |

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript 5.9
- **Framework**: Fastify 5.6 (high-performance web framework)
- **Vector Indexing**: hnswlib-node 3.0 (HNSW algorithm)
- **Blockchain**: ethers.js 6.15 (Ethereum/0G Chain interaction)
- **Storage**: @0glabs/0g-ts-sdk 0.3.2 (Official 0G Storage SDK)
- **Document Processing**: pdf-parse, fs-extra
- **AI/ML**: @google/generative-ai (Gemini embeddings & RAG)

### Smart Contracts
- **Language**: Solidity 0.8.27
- **Framework**: Hardhat 3.0.7
- **Libraries**: OpenZeppelin Contracts 5.4.0
  - AccessControl (role-based permissions)
  - ReentrancyGuard (security)
  - Pausable (emergency stop)

### Frontend
- **Framework**: Next.js 15.5 with Turbopack
- **Language**: TypeScript 5
- **UI Library**: React 19.1
- **Styling**: Tailwind CSS 4
- **Components**: Headless UI 2.2, Heroicons 2.2

### Infrastructure
- **Blockchain**: 0G Network Testnet (Chain ID: 16602)
- **Storage**: 0G Distributed Storage Network
- **RPC Endpoint**: https://evmrpc-testnet.0g.ai
- **Indexer**: https://indexer-storage-testnet-turbo.0g.ai

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm/yarn
- 0G Testnet wallet with test tokens
- Private key with funds for contract interactions
- (Optional) Google Gemini API key for embeddings/RAG

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd 0g-wave-hack
```

2. **Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration:
# - PRIVATE_KEY: Your 0G wallet private key
# - GEMINI_API_KEY: Google Gemini API key
# - VECTOR_REGISTRY_ADDRESS: Deployed contract address
# - STORAGE_ORACLE_ADDRESS: Deployed contract address

# Build TypeScript
npm run build

# Start development server
npm run dev

# Or production server
npm start
```

Backend will run on `http://localhost:3001` (configurable via PORT)

3. **Smart Contracts Setup**

```bash
cd contracts

# Install dependencies
npm install

# Copy and configure .env
cp ../.env .env

# Compile contracts
npx hardhat compile

# Deploy to 0G Testnet
npx hardhat run scripts/deploy.ts --network ogTestnet

# Update deployed addresses in backend/.env
```

4. **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Start development server (with Turbopack)
npm run dev

# Or production build
npm run build
npm start
```

Frontend will run on `http://localhost:3000`

### Quick Test

```bash
# Test backend health
curl http://localhost:3001/api/v1/health

# Upload a test document
curl -X POST http://localhost:3001/api/v1/upload \
  -F "file=@test-document.pdf" \
  -F "collectionName=Test Collection" \
  -F "chunkStrategy=sentence" \
  -F "chunkSize=512"

# Query via RAG
curl -X POST http://localhost:3001/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the main topic?",
    "collectionId": "<collection-id>",
    "topK": 5
  }'
```

---

## 📁 Project Structure

```
0g-wave-hack/
│
├── backend/                      # Backend Server (Fastify + TypeScript)
│   ├── src/
│   │   ├── config/              # Configuration management
│   │   │   └── index.ts         # Environment variables & settings
│   │   │
│   │   ├── core/                # Core Vector Engine
│   │   │   └── VectorEngine.ts  # HNSW indexing, search, collections
│   │   │
│   │   ├── services/            # Business Logic Services
│   │   │   ├── Real0GStorageSDK.ts          # ⭐ 0G Storage Integration
│   │   │   ├── VectorRegistryService.ts     # ⭐ VectorRegistry Contract
│   │   │   ├── StorageOracleService.ts      # ⭐ StorageOracle Contract
│   │   │   ├── EmbeddingService.ts          # Text → Vector embeddings
│   │   │   ├── GeminiService.ts             # RAG & LLM queries
│   │   │   ├── DocumentProcessingService.ts # PDF/Text parsing & chunking
│   │   │   └── StorageInterface.ts          # Storage abstraction
│   │   │
│   │   ├── routes/              # API Endpoints
│   │   │   ├── collections.ts   # Collection CRUD
│   │   │   ├── upload.ts        # Document upload
│   │   │   ├── rag.ts           # RAG queries
│   │   │   └── system.ts        # Health, stats, config
│   │   │
│   │   └── index.ts             # Server initialization
│   │
│   ├── dist/                    # Compiled JavaScript
│   ├── uploads/                 # Temporary file storage
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                     # Environment variables
│
├── contracts/                   # Smart Contracts (Solidity + Hardhat)
│   ├── contracts/
│   │   ├── VectorRegistry.sol   # ⭐ Collection metadata on 0G Chain
│   │   └── StorageOracle.sol    # ⭐ Storage tracking & replication
│   │
│   ├── scripts/
│   │   └── deploy.ts            # Deployment scripts
│   │
│   ├── test/
│   │   └── VectorRegistry.test.ts  # Contract tests
│   │
│   ├── artifacts/               # Compiled contract ABIs
│   ├── deployed-contracts.json  # Deployed addresses
│   ├── hardhat.config.js        # Hardhat configuration
│   └── package.json
│
├── frontend/                    # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/                 # Next.js 15 App Router
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── admin-dashboard/ # Admin interface
│   │   │   ├── docs/            # Documentation
│   │   │   ├── features/        # Features showcase
│   │   │   └── layout.tsx       # Root layout
│   │   │
│   │   └── components/          # React components
│   │
│   ├── public/                  # Static assets
│   ├── package.json
│   └── next.config.ts
│
├── vercel.json                  # Vercel deployment config
└── README.md                    # ⭐ This file
```

---

## 📡 API Documentation

Base URL: `http://localhost:3001/api/v1`

### Collections

#### Create Collection
```http
POST /collections
Content-Type: application/json

{
  "name": "My Knowledge Base",
  "description": "Company documents",
  "dimension": 768,
  "isPublic": true
}

Response: {
  "collectionId": "uuid-v4",
  "message": "Collection created successfully"
}
```

#### List Collections
```http
GET /collections

Response: {
  "collections": [
    {
      "id": "uuid",
      "name": "My Knowledge Base",
      "dimension": 768,
      "count": 1234,
      "created": 1697123456789,
      "updated": 1697123456789
    }
  ],
  "total": 1
}
```

#### Search Collection
```http
POST /collections/:collectionId/search
Content-Type: application/json

{
  "query": "How do I deploy smart contracts?",
  "k": 10,
  "includeMetadata": true
}

Response: {
  "results": [
    {
      "id": "chunk-uuid",
      "score": 0.89,
      "metadata": {
        "text": "To deploy smart contracts...",
        "source": "deployment-guide.pdf",
        "page": 5
      }
    }
  ],
  "count": 10,
  "processingTime": 45
}
```

### Document Upload

#### Upload Document
```http
POST /upload
Content-Type: multipart/form-data

Form Data:
- file: <binary>
- collectionName: "New Collection"
- collectionId: "existing-uuid" (optional)
- chunkStrategy: "sentence" | "paragraph" | "fixed" | "semantic"
- chunkSize: 512
- chunkOverlap: 50
- generateEmbeddings: true

Response: {
  "success": true,
  "collectionId": "uuid",
  "document": {
    "id": "doc-uuid",
    "filename": "document.pdf",
    "chunks": 42,
    "storageMetadata": {
      "root": "0x...",  // 0G Storage root hash
      "txHash": "0x...", // 0G transaction
      "storageProof": "0g-network"
    }
  },
  "vectorsInserted": 42
}
```

#### Get Upload Info
```http
GET /upload/info

Response: {
  "supported_formats": ["application/pdf", "text/plain", ...],
  "chunking_strategies": ["fixed", "sentence", "paragraph", "semantic"],
  "max_file_size": "50MB",
  "storage": {
    "type": "0g-storage",
    "network": "testnet",
    "connected": true
  }
}
```

### RAG (Retrieval-Augmented Generation)

#### Query with RAG
```http
POST /rag/query
Content-Type: application/json

{
  "query": "Explain vector databases",
  "collectionId": "uuid",
  "topK": 5,
  "includeContext": true,
  "model": "gemini-1.5-pro"
}

Response: {
  "answer": "Vector databases store high-dimensional...",
  "context": [
    {
      "text": "Vector databases...",
      "score": 0.92,
      "source": "intro.pdf"
    }
  ],
  "processingTime": 1234,
  "model": "gemini-1.5-pro",
  "tokensUsed": 567
}
```

#### RAG Status
```http
GET /rag/status

Response: {
  "available": true,
  "model": "gemini-1.5-pro",
  "maxTokens": 32768,
  "features": ["text-generation", "embeddings", "rag"]
}
```

### System

#### Health Check
```http
GET /health

Response: {
  "status": "healthy",
  "timestamp": "2024-10-20T12:00:00Z",
  "uptime": 86400,
  "services": {
    "vectorEngine": "operational",
    "storage": "operational",
    "blockchain": "operational",
    "embedding": "operational"
  }
}
```

#### Get Statistics
```http
GET /stats

Response: {
  "collections": 15,
  "totalVectors": 125000,
  "memoryUsage": {...},
  "blockchain": {
    "vectorRegistry": {
      "totalCollections": 15,
      "totalVectors": 125000,
      "contractAddress": "0x..."
    },
    "storageOracle": {
      "totalStoredData": 524288000,
      "activeNodes": 12,
      "replicationFactor": 3
    }
  },
  "storage": {
    "0g": {
      "connected": true,
      "network": "testnet",
      "wallet": "0x..."
    }
  }
}
```

#### Get Configuration
```http
GET /config

Response: {
  "vector": {
    "dimension": 768,
    "hnsw": {
      "m": 16,
      "efConstruction": 200,
      "efSearch": 50
    }
  },
  "storage": {
    "provider": "0g-network",
    "maxFileSize": "50MB"
  },
  "contracts": {
    "vectorRegistry": "0x...",
    "storageOracle": "0x..."
  }
}
```

---

## 📜 Smart Contracts

### VectorRegistry

**Address**: `0x6ab136BdDDffAC066BBe0Cc226599777B601f775` (0G Testnet)

#### Key Functions

```solidity
// Create a new vector collection
function createCollection(
    string memory collectionId,
    string memory name,
    string memory description,
    uint256 dimension,
    bool isPublic
) external;

// Update collection with 0G Storage root
function updateCollection(
    string memory collectionId,
    string memory storageRoot,      // 0G Storage root hash
    uint256 vectorCount,
    bytes32 metadataHash
) external;

// Add vector metadata to collection
function addVectorMetadata(
    string memory collectionId,
    string memory vectorId,
    string memory storageHash,       // 0G Storage hash
    bytes32 contentHash
) external;

// Grant access to user
function grantAccess(
    string memory collectionId,
    address user
) external;

// Get collection information
function getCollection(string memory collectionId) 
    external view returns (Collection memory);

// Get all collection IDs
function getAllCollections() 
    external view returns (string[] memory);
```

#### Events

```solidity
event CollectionCreated(
    string indexed collectionId,
    string name,
    address indexed owner,
    uint256 dimension
);

event CollectionUpdated(
    string indexed collectionId,
    string storageRoot,
    uint256 vectorCount
);

event VectorAdded(
    string indexed collectionId,
    string indexed vectorId,
    address indexed user,
    string storageHash
);

event AccessGranted(
    string indexed collectionId,
    address indexed user
);
```

### StorageOracle

**Address**: `0x9C4a249A04613651CBa2E33a8FFE316f15B639A8` (0G Testnet)

#### Key Functions

```solidity
// Register data storage on 0G nodes
function registerDataStorage(
    string memory root,              // 0G Storage root
    string[] memory nodeAddresses,   // Which nodes have the data
    uint256 size,
    bytes32 integrityHash
) external;

// Register a storage node
function registerNode(
    string memory nodeAddress,
    uint256 totalStorage
) external;

// Update node status
function updateNodeStatus(
    string memory nodeAddress,
    uint256 usedStorage,
    uint256 reliability           // 0-100 score
) external;

// Verify data integrity
function verifyIntegrity(
    string memory root,
    string memory nodeAddress,
    bytes32 actualHash
) external;

// Request more replicas
function requestReplication(
    string memory root,
    uint256 targetReplicas
) external;

// Get storage entry
function getStorageEntry(string memory root)
    external view returns (StorageEntry memory);

// Get storage statistics
function getStorageStats()
    external view returns (
        uint256 totalStoredData,
        uint256 totalActiveNodes,
        uint256 activeRootsCount,
        uint256 minReplicationFactor
    );
```

#### Events

```solidity
event DataStored(
    string indexed root,
    string[] nodeAddresses,
    uint256 size,
    uint256 replicationFactor
);

event ReplicationRequested(
    string indexed root,
    uint256 targetReplicas
);

event IntegrityViolation(
    string indexed root,
    string indexed nodeAddress,
    bytes32 expectedHash,
    bytes32 actualHash
);

event NodeRegistered(
    string indexed nodeAddress,
    uint256 totalStorage
);
```

### Deploying Contracts

```bash
cd contracts

# Compile
npx hardhat compile

# Deploy to 0G Testnet
npx hardhat run scripts/deploy.ts --network ogTestnet

# Verify (if supported)
npx hardhat verify --network ogTestnet <CONTRACT_ADDRESS>
```

### Hardhat Configuration

```javascript
// hardhat.config.js
networks: {
  ogTestnet: {
    url: process.env.ZG_CHAIN_RPC_URL || 'https://evmrpc-testnet.0g.ai',
    chainId: 16602,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

---

## 💡 Use Cases

### 1. AI-Powered Document Search
Build semantic search for knowledge bases, documentation, and archives. Upload PDFs, text files, and markdown documents, then query with natural language.

**Example:**
```bash
# Upload company handbook
curl -X POST http://localhost:3001/api/v1/upload \
  -F "file=@employee-handbook.pdf" \
  -F "collectionName=HR Documents"

# Search
curl -X POST http://localhost:3001/api/v1/rag/query \
  -d '{"query": "What is the vacation policy?", "collectionId": "..."}'
```

### 2. Retrieval-Augmented Generation (RAG)
Power chatbots and AI assistants with your own knowledge base. Combine Vect0r's semantic search with LLM generation for accurate, context-aware responses.

**Example:**
```javascript
// RAG Query
const response = await fetch('http://localhost:3001/api/v1/rag/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "How do I integrate 0G Storage in my app?",
    collectionId: "technical-docs",
    topK: 5
  })
});

const { answer, context } = await response.json();
console.log(answer); // LLM-generated answer with citations
```

### 3. Content Recommendation Systems
Create intelligent recommendations based on semantic similarity. Recommend articles, products, or content based on user behavior and content embeddings.

**Example:**
```javascript
// Get similar content
const similar = await fetch('http://localhost:3001/api/v1/collections/articles/search', {
  method: 'POST',
  body: JSON.stringify({
    query: "blockchain scalability solutions",
    k: 10,
    filter: { category: "technology" }
  })
});
```

### 4. Research & Academic Search
Index research papers, academic publications, and technical documentation. Search by concepts rather than keywords for better discovery.

**Example:**
```bash
# Upload research papers
for paper in papers/*.pdf; do
  curl -X POST http://localhost:3001/api/v1/upload \
    -F "file=@$paper" \
    -F "collectionName=Research Papers" \
    -F "chunkStrategy=paragraph"
done

# Semantic search
curl -X POST .../collections/.../search \
  -d '{"query": "novel approaches to distributed consensus"}'
```

### 5. Enterprise Knowledge Management
Centralize company knowledge with decentralized storage. Maintain document versions, access control, and full-text search across all company resources.

**Features:**
- On-chain access control via VectorRegistry
- Immutable audit trail on 0G Chain
- Distributed storage on 0G Network
- Semantic search across all documents

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests (if implemented)
cd backend
npm test

# Smart contract tests
cd contracts
npx hardhat test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start

# Contracts
cd contracts
npx hardhat compile
```

### Environment Variables

#### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.com

# 0G Network
ZG_CHAIN_RPC_URL=https://evmrpc-testnet.0g.ai
ZG_STORAGE_URL=https://storage-testnet.0g.ai
ZG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
ZG_CHAIN_ID=16602
PRIVATE_KEY=0x...

# Contracts
VECTOR_REGISTRY_ADDRESS=0x6ab136BdDDffAC066BBe0Cc226599777B601f775
STORAGE_ORACLE_ADDRESS=0x9C4a249A04613651CBa2E33a8FFE316f15B639A8

# Vector Config
VECTOR_DIMENSION=768
HNSW_M=16
HNSW_EF_CONSTRUCTION=200
HNSW_EF_SEARCH=50

# AI/ML
GEMINI_API_KEY=your-api-key

# Storage
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
```

### Code Structure Guidelines

1. **Services**: Business logic isolated in `backend/src/services/`
2. **Routes**: API endpoints in `backend/src/routes/`
3. **Core**: Vector engine logic in `backend/src/core/`
4. **Contracts**: Smart contracts in `contracts/contracts/`
5. **Frontend**: React components in `frontend/src/components/`

### Adding New Features

1. **New Vector Operation**: Extend `VectorEngine.ts`
2. **New API Endpoint**: Add route in `backend/src/routes/`
3. **New Smart Contract Function**: Update Solidity files and redeploy
4. **New Document Format**: Extend `DocumentProcessingService.ts`

---

## 🚢 Deployment

### Backend Deployment

#### Option 1: Docker (Recommended)
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/dist ./dist
COPY backend/.env .env
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

```bash
docker build -t vect0r-backend .
docker run -p 3001:3001 --env-file .env vect0r-backend
```

#### Option 2: PM2
```bash
npm install -g pm2
cd backend
npm run build
pm2 start dist/index.js --name vect0r-backend
pm2 save
```

### Frontend Deployment

#### Vercel (Recommended)
```bash
cd frontend
vercel --prod
```

Or connect GitHub repo to Vercel for automatic deployments.

#### Static Export
```bash
cd frontend
npm run build
# Deploy 'out' directory to any static host
```

### Smart Contract Deployment

```bash
cd contracts

# Deploy to 0G Testnet
npx hardhat run scripts/deploy.ts --network ogTestnet

# Update deployed addresses in:
# 1. backend/.env
# 2. contracts/deployed-contracts.json
# 3. Frontend constants (if needed)
```

---

## 📊 Performance Benchmarks

### Vector Search Performance
- **Small Collections** (< 10K vectors): < 10ms
- **Medium Collections** (10K - 100K): 10-50ms
- **Large Collections** (100K - 1M): 50-200ms

### Document Processing
- **PDF (100 pages)**: ~5-10 seconds
- **Text (1MB)**: ~1-2 seconds
- **Embedding Generation**: ~100-500ms per chunk

### 0G Storage
- **Upload (10MB)**: ~2-5 seconds
- **Download (10MB)**: ~1-3 seconds
- **Merkle Proof Verification**: ~50-100ms

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Follow existing code style
- Add comments for complex logic

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **0G Network** - For providing decentralized storage and blockchain infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **Fastify** - For high-performance web framework
- **hnswlib** - For efficient vector search implementation
- **Google Gemini** - For embedding generation and RAG capabilities

---


### Wave 4 - This is the first wave we have submitted to
- ✅ HNSW vector indexing with 0G Storage integration
- ✅ 0G Storage integration
- ✅ Smart contract deployment
- ✅ Multi-format document processing with intelligent chunking
- ✅ RESTful API and admin dashboard
- ✅ Document processing pipeline
- ✅ RAG implementation with automatic embedding generation

---

## Future Plans for 0G Labs 5th Wave Starting 25th October 2025

**Production-Ready Features:**
- 🔄 Wallet and OAuth authentication with identity-based persistence
- 🔄 Vect0r CLI for one-command local environment setup
- 🔄 Performance optimization targeting sub-10ms latency
- 🔄 Comprehensive benchmarking against Web2 vector databases

**Research & Growth:**
- 🔄 Technical whitepaper on decentralized vector database architecture
- 🔄 Integration as a core component of 0G's AI infrastructure stack

Beyond the buildathon, we aim to establish Vect0r as essential infrastructure in the 0G ecosystem, making AI truly public and censorship-resistant.

---