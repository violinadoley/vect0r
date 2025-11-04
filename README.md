# Vect0r

<div align="center">

### **The First Decentralized Vector Database on the 0G Network**

Store, search, and scale AI embeddings with **blockchain-powered security**, **no vendor lock-in**, and **complete data sovereignty.**

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)

</div>

---

## **Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Smart Contracts](#smart-contracts)
- [Deployment](#deployment)
- [Development](#development)
- [License](#license)

---

## **Overview**

**Vect0r** is a decentralized vector database built on the **0G Network** for storing, indexing, and retrieving embeddings at scale. Designed for AI-first applications, it ensures **security**, **transparency**, and **zero vendor lock-in**.

### **Key Value Propositions**
- **Decentralized & Secure** — On-chain metadata + 0G Storage integrity verification  
- **High Performance** — HNSW-based similarity search for low-latency retrieval  
- **AI-Native** — Integrated RAG pipelines and semantic search  
- **No Vendor Lock-in** — Your data remains sovereign and portable  
- **Cost-Efficient** — Leverages decentralized infrastructure to reduce operational overhead  
- **Real-Time Sync** — Instant state consistency across the network  

---

## **Features**

### **Core**
- Document processing (PDF, TXT, etc.)
- Intelligent chunking (fixed, sentence, paragraph)
- Embedding generation (state-of-the-art models)
- High-performance HNSW similarity search
- Configurable vector dimensions (default: 768)

### **RAG**
- Built-in Retrieval Augmented Generation pipeline
- Google Gemini API integration
- Automatic context selection & metadata tracking

### **Decentralized Storage**
- Automatic backup to **0G Storage Network**
- Blockchain-backed metadata and auditability
- Redundancy and integrity guarantees

### **Smart Contract Layer**
- On-chain collection registry
- Access governance mechanisms
- Transparent data lineage

---

## **Architecture**

![Architecture Diagram](./architectureDiagram.png)

### Components
1. **Frontend** — Next.js dashboard  
2. **Backend** — Fastify REST API service  
3. **Smart Contracts** — Solidity contracts on 0G Chain  

---

## **Tech Stack**

**Backend**
- Node.js 20.x
- Fastify 5.6
- TypeScript 5.9
- HNSWlib for vector indexing
- Google Gemini + all-MiniLM-L6-v2 embeddings
- Ethers.js + 0G TS SDK
- 0G Storage Network

**Frontend**
- Next.js 15.5
- React 19.1
- Tailwind CSS 4
- Heroicons
- Axios

**Smart Contracts**
- Solidity 0.8.27
- Hardhat 2.26
- OpenZeppelin 5.4
- Network: 0G Chain (EVM-compatible)

---

## **Prerequisites**

- `Node.js` ≥ 20.x  
- `npm` ≥ 9.x  
- Git  
- Access to 0G network (mainnet or testnet)  
- API Keys:
  - Google Gemini
  - 0G Network private key

---

## **Installation**

```bash
git clone <repository-url>
cd og-wave-hack
```

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd ../frontend
npm install
```

### Contracts
```bash
cd ../contracts
npm install
```

---

## **Configuration**

### Backend `.env`
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

ZG_CHAIN_RPC_URL=https://evmrpc.0g.ai
ZG_INDEXER_URL=https://indexer-storage-turbo.0g.ai
ZG_CHAIN_ID=16661
PRIVATE_KEY=your_0g_private_key

REGISTRY_ADDRESS=0x796373F5e5879AF43233B378c0425b54797Cf5B9
STORAGE_ORACLE_ADDRESS=0x52c0088C5b910FE40Cb217CF2d3E779113a0007e

GEMINI_API_KEY=your_gemini_api_key

UPLOAD_PATH=./uploads
DIMENSION=768
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
```

### Contracts `.env`
```env
PRIVATE_KEY=your_0g_private_key
ZG_CHAIN_RPC_URL=https://evmrpc.0g.ai
ZG_EXPLORER_API_KEY=your_api_key
```

---

## **Usage**

### Run Backend
```bash
cd backend
npm run dev
```
→ http://localhost:3001

### Run Frontend
```bash
cd frontend
npm run dev
```
→ http://localhost:3000

---

## **Smart Contracts**

**Mainnet Contract Address:**
```
0x52c0088C5b910FE40Cb217CF2d3E779113a0007e
```

Compile:
```bash
cd contracts
npm run compile
```

Deploy:
```bash
npm run deploy
```

---

## **Deployment**

| Component   | Platform | Notes |
|------------|----------|-------|
| Backend    | Render   | Add `.env` variables and deploy |
| Frontend   | Vercel   | Set `NEXT_PUBLIC_API_BASE` and deploy |
| Contracts  | Hardhat  | Ensure RPC + private key configured |

See `DEPLOYMENT.md` for extended guidance.

---

## **License**

This project is distributed under the **MIT License**.  
See: `LICENSE`

---

<div align="center">

**Built with 💙 for a decentralized AI future.**

</div>
