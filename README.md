# Vect0r

<div align="center">

**The First Decentralized  Database on 0G Network**

Store, search, and scale your AI embeddings with blockchain-powered security. No vendor lock-in, complete data sovereignty.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)

</div>

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Deployment](#deployment)
- [Development](#development)
- [License](#license)

---

##  Overview

**Vect0r** is a production-ready, decentralized  database built on the 0G Network. It provides a complete solution for storing, indexing, and searching  embeddings with blockchain-powered security and transparency. The platform enables developers to build AI-powered applications without vendor lock-in, leveraging decentralized storage and on-chain metadata management.

### Key Value Propositions

-  **Decentralized & Secure**: Data stored on 0G Storage with blockchain integrity verification
-  **High Performance**: Optimized HNSW (Hierarchical Navigable Small World) index for fast similarity search
-  **AI-Optimized**: Built-in support for embeddings, RAG (Retrieval Augmented Generation), and semantic search
-  **No Vendor Lock-in**: Deploy anywhere, migrate easily - your data remains under your control
-  **Cost-Effective**: Leverage decentralized infrastructure for reduced operational costs
-  **Real-time**: Instant synchronization across the decentralized network

---

##  Features

### Core Functionality

- **Document Processing**
  - Upload and process documents (PDF, TXT, and more)
  - Intelligent chunking strategies (fixed-size, sentence-based, paragraph-based)
  - Automatic text extraction and preprocessing

- ** Operations**
  - Generate embeddings using state-of-the-art models
  - Create and manage  collections
  - High-performance similarity search using HNSW algorithm
  - Configurable  dimensions (default: 768)

- **RAG (Retrieval Augmented Generation)**
  - Integrated RAG pipeline with Google Gemini AI
  - Semantic search with automatic context retrieval
  - Source citation and metadata tracking

- **Decentralized Storage**
  - Automatic backup to 0G Storage Network
  - Blockchain-based metadata registry
  - Integrity verification and redundancy management

- **Smart Contract Integration**
  - On-chain collection metadata
  - Access control and governance
  - Transparent audit trail

### Advanced Features

- **Multi-format Support**: PDF, TXT, and extensible document formats
- **Flexible Chunking**: Multiple chunking strategies for optimal document processing
- **RESTful API**: Comprehensive API for programmatic access
- **Web Dashboard**: Intuitive admin interface for management and monitoring
- **Real-time Stats**: System statistics and collection metrics
- **CORS Support**: Cross-origin resource sharing for web applications

---

##  Architecture

Vect0r consists of three main components:

### Component Overview

1. **Frontend**: Next.js-based web application with React, TypeScript, and Tailwind CSS
2. **Backend**: Fastify REST API with TypeScript, handling all business logic
3. **Smart Contracts**: Solidity contracts deployed on 0G Chain for on-chain metadata and governance

---

##  Tech Stack

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Fastify 5.6
- **Language**: TypeScript 5.9
- ** Database**: HNSWlib (Hierarchical Navigable Small World)
- **AI/ML**: 
  - Google Gemini API (for RAG)
  - Embedding models (all-MiniLM-L6-v2)
- **Blockchain**: 
  - Ethers.js 6.13
  - 0G Labs SDK (@0glabs/0g-ts-sdk)
- **Storage**: 0G Storage Network (decentralized)
- **Document Processing**: pdf-parse, custom chunking strategies

### Frontend
- **Framework**: Next.js 15.5
- **UI Library**: React 19.1
- **Styling**: Tailwind CSS 4
- **Icons**: Heroicons
- **HTTP Client**: Axios

### Smart Contracts
- **Language**: Solidity 0.8.27
- **Framework**: Hardhat 2.26
- **Libraries**: OpenZeppelin Contracts 5.4
- **Network**: 0G Chain (EVM-compatible)

---

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Git** for version control
- **0G Network Access**: Mainnet or testnet credentials
- **API Keys**:
  - Google Gemini API key (for RAG functionality)
  - 0G Network private key (for blockchain interactions)

---

##  Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd og-wave-hack\ copy
\`\`\`

### 2. Install Backend Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 3. Install Frontend Dependencies

\`\`\`bash
cd ../frontend
npm install
\`\`\`

### 4. Install Contract Dependencies

\`\`\`bash
cd ../contracts
npm install
\`\`\`

---

##  Configuration

### Backend Configuration

Create a \`.env\` file in the \`backend/\` directory:

\`\`\`env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# 0G Network Configuration
ZG_CHAIN_RPC_URL=https://evmrpc.0g.ai
ZG_INDEXER_URL=https://indexer-storage-turbo.0g.ai
ZG_CHAIN_ID=16661
PRIVATE_KEY=your_0g_private_key_here

# Smart Contract Addresses (Mainnet)
_REGISTRY_ADDRESS=0x796373F5e5879AF43233B378c0425b54797Cf5B9
STORAGE_ORACLE_ADDRESS=0x52c0088C5b910FE40Cb217CF2d3E779113a0007e

# AI/ML Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Storage Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB

#  Database Configuration (Optional)
_DIMENSION=768
HNSW_M=16
HNSW_EF_CONSTRUCTION=200
HNSW_EF_SEARCH=50
\`\`\`

### Frontend Configuration

Create a \`.env.local\` file in the \`frontend/\` directory:

\`\`\`env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
\`\`\`

### Contract Configuration

Create a \`.env\` file in the \`contracts/\` directory:

\`\`\`env
PRIVATE_KEY=your_0g_private_key_here
ZG_CHAIN_RPC_URL=https://evmrpc.0g.ai
ZG_EXPLORER_API_KEY=your_explorer_api_key
ZG_EXPLORER_API_URL=https://chainscan.0g.ai/api
ZG_EXPLORER_URL=https://chainscan.0g.ai
\`\`\`

---

##  Usage

### Starting the Development Server

#### Backend

\`\`\`bash
cd backend
npm run dev
\`\`\`

The backend API will be available at \`http://localhost:3001\`

#### Frontend

\`\`\`bash
cd frontend
npm run dev
\`\`\`

The frontend will be available at \`http://localhost:3000\`

### Building for Production

#### Backend

\`\`\`bash
cd backend
npm run build
npm start
\`\`\`

#### Frontend

\`\`\`bash
cd frontend
npm run build
npm start
\`\`\`

---

##  API Documentation

### Base URL

- **Development**: \`http://localhost:3001/api/v1\`
- **Production**: \`https://your-backend-domain.com/api/v1\`

### Endpoints

#### System Endpoints

**Health Check**
\`\`\`http
GET /api/v1/health
\`\`\`

Response:
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
\`\`\`

**System Statistics**
\`\`\`http
GET /api/v1/stats
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "stats": {
    "collections": {
      "total": 5,
      "totals": 1250
    },
    "storage": {
      "0g": {
        "totalStored": "2.5 MB",
        "activeFiles": 25
      }
    },
    "performance": {
      "avgSearchTime": "45ms",
      "avgEmbeddingTime": "120ms"
    }
  }
}
\`\`\`

#### Collection Management

**List Collections**
\`\`\`http
GET /api/v1/collections
\`\`\`

**Create Collection**
\`\`\`http
POST /api/v1/collections
Content-Type: application/json

{
  "name": "my-collection",
  "dimension": 768,
  "description": "Collection description"
}
\`\`\`

**Get Collection Details**
\`\`\`http
GET /api/v1/collections/:id
\`\`\`

**Search s**
\`\`\`http
POST /api/v1/collections/:id/search
Content-Type: application/json

{
  "query": [0.1, 0.2, ...],
  "topK": 10,
  "threshold": 0.7
}
\`\`\`

#### Document Upload

**Upload Document**
\`\`\`http
POST /api/v1/upload
Content-Type: multipart/form-data

file: <file>
config: {
  "collectionName": "my-collection",
  "chunkingStrategy": {
    "type": "fixed-size",
    "chunkSize": 512,
    "overlap": 50
  },
  "generateEmbeddings": true,
  "createNewCollection": true
}
\`\`\`

**Upload Info**
\`\`\`http
GET /api/v1/upload/info
\`\`\`

#### RAG (Retrieval Augmented Generation)

**Query with RAG**
\`\`\`http
POST /api/v1/rag/query
Content-Type: application/json

{
  "collectionId": "collection-id",
  "query": "What is the main topic?",
  "topK": 5,
  "includeMetadata": true
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "answer": "Generated answer based on retrieved context...",
  "sources": [
    {
      "text": "Relevant text chunk...",
      "score": 0.85,
      "metadata": {...}
    }
  ],
  "processingTime": 1250,
  "tokensUsed": 450
}
\`\`\`

**RAG Status**
\`\`\`http
GET /api/v1/rag/status
\`\`\`

### Error Responses

All error responses follow this format:

\`\`\`json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
\`\`\`

Common HTTP status codes:
- \`400\` - Bad Request
- \`404\` - Not Found
- \`500\` - Internal Server Error
- \`503\` - Service Unavailable

---

##  Smart Contracts

### Registry.sol

Manages  collections and metadata on-chain.

**Key Functions:**
- \`createCollection()\` - Register a new collection
- \`updateCollection()\` - Update collection metadata
- \`grantAccess()\` - Manage access control
- \`getCollection()\` - Retrieve collection details

**Contract Address (Mainnet):**
\`\`\`
0x796373F5e5879AF43233B378c0425b54797Cf5B9
\`\`\`

### StorageOracle.sol

Tracks data distribution and availability across 0G Storage nodes.

**Key Functions:**
- \`registerDataStorage()\` - Register storage entry
- \`getStorageEntry()\` - Retrieve storage information
- \`verifyIntegrity()\` - Verify data integrity
- \`requestReplication()\` - Manage data replication

**Contract Address (Mainnet):**
\`\`\`
0x52c0088C5b910FE40Cb217CF2d3E779113a0007e
\`\`\`

### Compiling Contracts

\`\`\`bash
cd contracts
npm run compile
\`\`\`

### Deploying Contracts

\`\`\`bash
cd contracts
npm run deploy
\`\`\`

See \`DEPLOYMENT.md\` for detailed deployment instructions.

---

##  Deployment

### Backend Deployment (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the root directory to \`backend\`
4. Configure build and start commands:
   - Build: \`npm ci && npm run build\`
   - Start: \`npm start\`
5. Add environment variables (see Configuration section)
6. Deploy

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Frontend Deployment (Vercel)

1. Import your repository in Vercel
2. Set the root directory to \`frontend\`
3. Configure environment variables:
   - \`NEXT_PUBLIC_API_BASE\`: Your backend API URL
4. Deploy

### Smart Contracts Deployment

1. Configure your \`.env\` file with network credentials
2. Compile contracts: \`npm run compile\`
3. Deploy: \`npm run deploy\`
4. Update contract addresses in backend configuration

---

##  Development

### Project Structure

\`\`\`
.
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── core/           # Core engine (Engine)
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic services
│   ├── dist/               # Compiled JavaScript
│   └── uploads/            # Upload directory
├── frontend/               # Next.js frontend
│   └── src/
│       └── app/            # Next.js app directory
├── contracts/              # Smart contracts
│   ├── contracts/          # Solidity contracts
│   ├── scripts/            # Deployment scripts
│   └── test/               # Contract tests
└── README.md
\`\`\`

### Development Scripts

**Backend:**
\`\`\`bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Start production server
\`\`\`

**Frontend:**
\`\`\`bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
\`\`\`

**Contracts:**
\`\`\`bash
npm run compile  # Compile Solidity contracts
npm run deploy   # Deploy contracts
npm test         # Run contract tests
\`\`\`

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

### Resources

- **Documentation**: [See \`/docs\` route in the application]
- **0G Network Docs**: [https://docs.0g.ai](https://docs.0g.ai)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

<div align="center">

**Built with 💙 for the decentralized future**

</div>
