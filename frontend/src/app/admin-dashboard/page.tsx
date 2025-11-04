'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  ChartBarIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CogIcon,
  CloudIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  ServerIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const navigation = [
  { name: 'Overview', href: '#overview', icon: ChartBarIcon, current: true },
  { name: 'Upload', href: '#upload', icon: ArrowUpTrayIcon, current: false },
  { name: 'Collections', href: '#collections', icon: FolderIcon, current: false },
  { name: 'RAG Demo', href: '#rag', icon: SparklesIcon, current: false },
  { name: 'Search', href: '#search', icon: MagnifyingGlassIcon, current: false },
  { name: 'Settings', href: '#settings', icon: CogIcon, current: false },
]

// API configuration
// Use env var in production; fall back to local during development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

// Target wallet address for filtering collections
const TARGET_WALLET_ADDRESS = '0x24a00018F302Fa2fa523811Aec199D686d653Afc'

interface Collection {
  id: string;
  name: string;
  dimension: number;
  count: number;
  created: number;
  updated: number;
  owner?: string;
  txHash?: string;
  blockNumber?: number;
  blockHash?: string;
  storageRoot?: string;
  isPublic?: boolean;
}

interface VectorDocument {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  timestamp: number;
}

interface SystemStats {
  success: boolean;
  stats: {
    system: {
      nodeEnv: string;
      uptime: number;
      memory: any;
      timestamp: number;
    };
    vectors: {
      local: {
        collections: number;
        totalVectors: number;
      };
      blockchain?: any;
    };
    blockchain: {
      status: {
        vectorRegistry: any;
        storageOracle: any;
      };
      chainId: number;
      hasWallet: boolean;
      contracts: {
        vectorRegistry: string;
        storageOracle: string;
      };
    };
    storage: {
      real0g: any;
      oracle?: any;
    };
  };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminDashboard() {
  const [currentSection, setCurrentSection] = useState('overview')
  const [collections, setCollections] = useState<Collection[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionVectors, setCollectionVectors] = useState<VectorDocument[]>([])
  const [vectorsLoading, setVectorsLoading] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  
  // RAG Demo state
  const [ragQuery, setRagQuery] = useState('')
  const [ragLoading, setRagLoading] = useState(false)
  const [ragAnswer, setRagAnswer] = useState<string | null>(null)
  const [ragSources, setRagSources] = useState<any[]>([])
  const [selectedRagCollection, setSelectedRagCollection] = useState<string>('')
  const [ragProcessingTime, setRagProcessingTime] = useState<number>(0)
  const [ragError, setRagError] = useState<string | null>(null)
  const [expandedSource, setExpandedSource] = useState<number | null>(null)
  const [ragProcessingStep, setRagProcessingStep] = useState<number>(0)
  
  const [uploadConfig, setUploadConfig] = useState({
    chunkingStrategy: {
      type: 'sentence',
      chunkSize: 1000,
      overlap: 100
    },
    generateEmbeddings: true,
    useZeroGCompute: false,
    createNewCollection: true,
    collectionName: '',
    collectionDescription: ''
  })
  
  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData()
    // Remove frequent stats polling to prevent overwhelming backend
    // const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    // return () => clearInterval(interval)
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // First, cleanup default collections (only in local dev)
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        await cleanupDefaultCollections()
      }
      
      // Then fetch data
      await Promise.all([
        fetchCollections(),
        fetchStats()
      ])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Error fetching initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const cleanupDefaultCollections = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/collections/cleanup-defaults`)
      console.log('✅ Cleaned up default collections')
    } catch (err) {
      console.warn('Could not cleanup default collections:', err)
      // Don't block the UI if cleanup fails
    }
  }

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/collections`)
      if (response.data.success) {
        // Further filter to show only collections owned by target wallet
        // and exclude any remaining default collections
        const filteredCollections = response.data.collections.filter((c: Collection) => {
          // Exclude default named collections
          if (c.name.toLowerCase() === 'default') return false
          
          // If owner info is available, filter by target wallet
          // If not available, include all (MVP behavior)
          if (c.owner) {
            return c.owner.toLowerCase() === TARGET_WALLET_ADDRESS.toLowerCase()
          }
          
          return true // Include collections without owner info
        })
        
        // Sort by created date descending (newest first) without mutating the original array
        const sortedCollections = [...filteredCollections].sort(
          (a: Collection, b: Collection) => b.created - a.created
        )
        
        setCollections(sortedCollections)
      }
    } catch (err) {
      console.error('Error fetching collections:', err)
    }
  }

  const fetchCollectionVectors = async (collectionId: string) => {
    setVectorsLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/collections/${collectionId}/vectors?limit=100`)
      if (response.data.success) {
        setCollectionVectors(response.data.vectors)
      }
    } catch (err) {
      console.error('Error fetching vectors:', err)
      setError('Failed to load vectors')
    } finally {
      setVectorsLoading(false)
    }
  }

  const handleViewVectors = async (collection: Collection) => {
    setSelectedCollection(collection)
    setCurrentSection('vectors')
    await fetchCollectionVectors(collection.id)
  }


  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const truncateHash = (hash: string, startLen = 6, endLen = 4) => {
    if (!hash) return 'N/A'
    if (hash.length <= startLen + endLen) return hash
    return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`
  }

  const handleRagQuery = async () => {
    if (!ragQuery.trim() || !selectedRagCollection) {
      setRagError('Please enter a question and select a collection')
      return
    }

    setRagLoading(true)
    setRagError(null)
    setRagAnswer(null)
    setRagSources([])
    setRagProcessingStep(1) // Searching

    try {
      // Step 1: Searching
      await new Promise(resolve => setTimeout(resolve, 300))
      setRagProcessingStep(2) // Retrieved

      const response = await axios.post(`${API_BASE_URL}/rag/query`, {
        collectionId: selectedRagCollection,
        query: ragQuery,
        topK: 5,
        includeMetadata: true
      }, { timeout: 60000 })

      // Step 3: Generating
      setRagProcessingStep(3)

      if (response.data.success) {
        setRagAnswer(response.data.answer)
        setRagSources(response.data.sources)
        setRagProcessingTime(response.data.processingTime)
        console.log('✅ RAG query successful:', response.data)
      }
    } catch (err: any) {
      console.error('RAG query error:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to process query'
      console.error('Error details:', err.response?.data)
      setRagError(errorMessage)
    } finally {
      setRagLoading(false)
      setRagProcessingStep(0)
    }
  }

  const resetRagQuery = () => {
    setRagQuery('')
    setRagAnswer(null)
    setRagSources([])
    setRagError(null)
    setRagProcessingTime(0)
    setExpandedSource(null)
  }

  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'text-green-400 bg-green-400/20'
    if (score > 0.6) return 'text-yellow-400 bg-yellow-400/20'
    return 'text-orange-400 bg-orange-400/20'
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`, { timeout: 10000 })
      if (response.data.success) {
        setSystemStats(response.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load system statistics')
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    setUploadProgress(0)
    setUploadResult(null)
    
    try {
      // Prepare config with collection name if creating new collection
      const config = {
        ...uploadConfig,
        collectionName: uploadConfig.createNewCollection ? 
          (uploadConfig.collectionName || selectedFile.name.replace(/\.[^/.]+$/, '') + '_collection') : 
          uploadConfig.collectionName
      }

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('config', JSON.stringify(config))

      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(progress)
        }
      })

      if (response.data.success) {
        setUploadResult(response.data)
        await fetchCollections() // Refresh collections
        await fetchStats() // Refresh stats
        console.log('Upload successful:', response.data)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Upload failed: ' + (err as any).message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setUploadProgress(0)
    setError(null)
  }

  const updateChunkingStrategy = (field: string, value: any) => {
    setUploadConfig(prev => ({
      ...prev,
      chunkingStrategy: {
        ...prev.chunkingStrategy,
        [field]: value
      }
    }))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCollectionStatus = (collection: Collection) => {
    if (collection.count === 0) return 'empty'
    return 'active'
  }

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <div className="min-h-screen bg-black">
      
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
          <div
            className="aspect-1097/845 w-[68.5625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20"
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-black backdrop-blur-xl border-r border-white/10">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <ServerIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">VectorZero</h1>
                    <p className="text-xs text-gray-400">Admin Dashboard</p>
                  </div>
                </div>
              </div>
              <nav className="mt-8 flex-1 space-y-1 px-2">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setCurrentSection(item.href.slice(1))}
                    className={classNames(
                      currentSection === item.href.slice(1)
                        ? 'bg-indigo-500/20 border-indigo-400/50 text-white'
                        : 'text-gray-300 hover:bg-white/5 border-transparent',
                      'group flex w-full items-center rounded-md border px-2 py-2 text-sm font-medium transition-all duration-200'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        currentSection === item.href.slice(1) ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300',
                        'mr-3 h-5 w-5 flex-shrink-0'
                      )}
                    />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            
            
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-black backdrop-blur-md border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white capitalize">{currentSection}</h1>
                <p className="text-sm text-white">Decentralized Vector Database Dashboard</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-white">Live</span>
                </div>
                <button className=" bg-white px-3 py-2 text-sm text-black hover:bg-white/80">
                  New Collection
                </button>
                <button className=" bg-white px-3 py-2 text-sm text-black hover:bg-white/80">
                  <Link href="/">Home</Link>
                </button>
              </div>
            </div>
          </header>

          {/* Dashboard content */}
          <main className="flex-1 overflow-y-auto bg-black p-6">
            {currentSection === 'overview' && (
              <div className="space-y-6">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                    <p className="mt-4 text-white">Loading dashboard data...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="rounded-lg bg-black border border-red-500/20 p-6">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Enhanced Search */}
                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Vector Search</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <input
                          type="text"
                          placeholder="Search your vector database with natural language..."
                          className="w-full rounded-md bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
                        />
                      </div>
                      <div>
                        <select className="w-full rounded-md bg-white/10 border border-white/20 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all">
                          <option value="">All Collections</option>
                          {collections.map((collection) => (
                            <option key={collection.id} value={collection.id} className="bg-gray-800">
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Results Count</label>
                        <select className="w-full bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-black-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/50">
                          <option value="5" className="bg-gray-800">5 results</option>
                          <option value="10" className="bg-gray-800">10 results</option>
                          <option value="20" className="bg-gray-800">20 results</option>
                          <option value="50" className="bg-gray-800">50 results</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Search Type</label>
                        <select className="w-full bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-black-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/50">
                          <option value="semantic" className="bg-gray-800">Semantic Search</option>
                          <option value="hybrid" className="bg-gray-800">Hybrid Search</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <button className="w-full bg-white px-6 py-2.5 text-sm text-black hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all transform hover:scale-105">
                          <div className="flex items-center justify-center space-x-2">
                            <MagnifyingGlassIcon className="h-4 w-4" />
                            <span>Search</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Collections */}
                {systemStats && (
                  <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10">
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white">Collections</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {collections.length > 0 ? collections.map((collection) => (
                          <div key={collection.id} className="flex items-center justify-between rounded-md bg-black p-4 border border-white/10">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <FolderIcon className="h-6 w-6 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{collection.name}</p>
                                <p className="text-xs text-gray-400">{collection.count.toLocaleString()} vectors • {collection.dimension}d</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={classNames(
                                getCollectionStatus(collection) === 'active' ? 'bg-green-400/20 text-green-400' :
                                'bg-gray-400/20 text-gray-400',
                                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium'
                              )}>
                                {getCollectionStatus(collection)}
                              </span>
                              <span className="text-xs text-gray-400">{getTimeAgo(collection.updated)}</span>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-white">
                            <FolderIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No collections found</p>
                            <p className="text-sm mt-2">Upload a document to create your first collection</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentSection === 'upload' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Document Upload</h2>
                  {selectedFile && (
                    <button
                      onClick={resetUpload}
                      className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-400 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* File Upload Area */}
                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Document</h3>
                  
                  {!selectedFile ? (
                    <div
                      className={classNames(
                        'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
                        dragActive 
                          ? 'border-indigo-400 bg-indigo-500/10' 
                          : 'border-gray-600 hover:border-gray-500'
                      )}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg text-white mb-2">Drop your document here</p>
                      <p className="text-sm text-white mb-4">
                        Supports PDF, TXT, and JSON files up to 50MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.txt,.json,.md"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-white px-6 py-3 text-sm text-black hover:bg-white/80 cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-black border border-white/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-8 w-8 text-indigo-400" />
                          <div>
                            <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                            <p className="text-xs text-white">
                              {formatBytes(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <CheckCircleIcon className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Configuration Options */}
                {selectedFile && (
                  <div className="space-y-6">
                    {/* Chunking Strategy */}
                    <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Chunking Strategy</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Strategy Type
                          </label>
                          <select
                            value={uploadConfig.chunkingStrategy.type}
                            onChange={(e) => updateChunkingStrategy('type', e.target.value)}
                            className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          >
                            <option value="sentence">Sentence-based</option>
                            <option value="fixed">Fixed size</option>
                            <option value="paragraph">Paragraph-based</option>
                            <option value="semantic">Semantic (experimental)</option>
                          </select>
                          <p className="text-xs text-white mt-1">
                            {uploadConfig.chunkingStrategy.type === 'sentence' && 'Split at sentence boundaries with size limits'}
                            {uploadConfig.chunkingStrategy.type === 'fixed' && 'Split into fixed-size chunks with overlap'}
                            {uploadConfig.chunkingStrategy.type === 'paragraph' && 'Split at paragraph boundaries'}
                            {uploadConfig.chunkingStrategy.type === 'semantic' && 'Group semantically similar content'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Chunk Size
                          </label>
                          <input
                            type="number"
                            min="100"
                            max="5000"
                            value={uploadConfig.chunkingStrategy.chunkSize}
                            onChange={(e) => updateChunkingStrategy('chunkSize', parseInt(e.target.value))}
                            className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <p className="text-xs text-white mt-1">
                            Maximum characters per chunk (100-5000)
                          </p>
                        </div>

                        {uploadConfig.chunkingStrategy.type !== 'paragraph' && (
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Overlap
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={Math.floor(uploadConfig.chunkingStrategy.chunkSize / 2)}
                              value={uploadConfig.chunkingStrategy.overlap}
                              onChange={(e) => updateChunkingStrategy('overlap', parseInt(e.target.value))}
                              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                            <p className="text-xs text-white mt-1">
                              Characters to overlap between chunks
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Processing Options */}
                    <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Processing Options</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-white">Generate Embeddings</label>
                            <p className="text-xs text-white">Create vector embeddings for semantic search</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={uploadConfig.generateEmbeddings}
                              onChange={(e) => setUploadConfig(prev => ({ ...prev, generateEmbeddings: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-white">Use 0G Compute</label>
                            <p className="text-xs text-white">Process embeddings on 0G network (experimental)</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={uploadConfig.useZeroGCompute}
                              onChange={(e) => setUploadConfig(prev => ({ ...prev, useZeroGCompute: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Collection Settings */}
                    <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Collection Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-white">Create New Collection</label>
                            <p className="text-xs text-white">Create a new collection for this document</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={uploadConfig.createNewCollection}
                              onChange={(e) => setUploadConfig(prev => ({ ...prev, createNewCollection: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {uploadConfig.createNewCollection ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Collection Name
                              </label>
                              <input
                                type="text"
                                value={uploadConfig.collectionName}
                                onChange={(e) => setUploadConfig(prev => ({ ...prev, collectionName: e.target.value }))}
                                placeholder={selectedFile.name.replace(/\.[^/.]+$/, '') + '_collection'}
                                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Description (Optional)
                              </label>
                              <textarea
                                rows={2}
                                value={uploadConfig.collectionDescription}
                                onChange={(e) => setUploadConfig(prev => ({ ...prev, collectionDescription: e.target.value }))}
                                placeholder="Describe this collection..."
                                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Select Existing Collection
                            </label>
                            <select
                              value={uploadConfig.collectionName}
                              onChange={(e) => setUploadConfig(prev => ({ ...prev, collectionName: e.target.value }))}
                              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              <option value="">Choose collection...</option>
                              {collections.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                  {collection.name} ({collection.count} vectors)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Button and Progress */}
                    <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                      {!isUploading && !uploadResult && (
                        <button
                          onClick={handleFileUpload}
                          disabled={!uploadConfig.generateEmbeddings || (!uploadConfig.createNewCollection && !uploadConfig.collectionName)}
                          className="w-full rounded-md bg-indigo-500 px-4 py-3 text-lg font-semibold text-white hover:bg-indigo-400 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                          Process Document
                        </button>
                      )}

                      {isUploading && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-white">
                            <span>Processing document...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {uploadResult && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 text-green-400">
                            <CheckCircleIcon className="h-6 w-6" />
                            <h4 className="text-lg font-semibold">Processing Complete!</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <p className="text-white">Document:</p>
                              <p className="text-white">{uploadResult.document.filename}</p>
                              <p className="text-white">Size: {formatBytes(uploadResult.document.originalSize)}</p>
                              <p className="text-white">Processing time: {uploadResult.document.processingTime}ms</p>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-white">Results:</p>
                              <p className="text-white">{uploadResult.processing.totalChunks} chunks created</p>
                              <p className="text-white">{uploadResult.processing.insertedVectors} vectors inserted</p>
                              <p className="text-white">Collection: {uploadResult.collection.name}</p>
                            </div>
                          </div>

                          <div className="flex space-x-4">
                            <button
                              onClick={() => setCurrentSection('collections')}
                              className="flex-1 bg-white px-4 py-2 text-sm text-black hover:bg-white/80 transition-colors"
                            >
                              View Collection
                            </button>
                            <button
                              onClick={resetUpload}
                              className="flex-1 bg-white px-4 py-2 text-sm text-black hover:bg-white/80 transition-colors"
                            >
                              Upload Another
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentSection === 'collections' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Vector Collections</h2>
                  <button className=" bg-white px-4 py-2 text-sm text-black hover:bg-white/80">
                    Create Collection
                  </button>
                </div>

                {collections.length === 0 ? (
                  <div className="text-center py-16 rounded-lg bg-black backdrop-blur-sm border border-white/10">
                    <FolderIcon className="mx-auto h-16 w-16 text-white mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Collections Yet</h3>
                    <p className="text-white mb-6">Upload a document to create your first collection</p>
                    <button 
                      onClick={() => setCurrentSection('upload')}
                      className=" bg-white px-6 py-3 text-sm text-black hover:bg-white/80">
                      Upload Document
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {collections.map((collection) => (
                      <div key={collection.id} className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                              <FolderIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{collection.name}</h3>
                              <p className="text-xs text-white">Created {getTimeAgo(collection.created)}</p>
                            </div>
                          </div>
                          <span className={classNames(
                            getCollectionStatus(collection) === 'active' ? 'bg-green-400/20 text-green-400 border-green-400/30' :
                            'bg-gray-400/20 text-gray-400 border-gray-400/30',
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium'
                          )}>
                            {getCollectionStatus(collection)}
                          </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-xs text-white mb-1">Vectors</p>
                            <p className="text-xl font-bold text-white">{collection.count.toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-xs text-white mb-1">Dimension</p>
                            <p className="text-xl font-bold text-white">{collection.dimension}d</p>
                          </div>
                        </div>

                        {/* Blockchain Info - Only show if blockchain data exists */}
                        {(collection.owner || collection.txHash || collection.blockNumber || collection.blockHash || collection.storageRoot) && (
                          <div className="space-y-2 mb-4 p-4 rounded-lg bg-black/20 border border-white/10">
                            <p className="text-xs font-semibold text-indigo-300 mb-2">⛓️ Blockchain Data</p>
                            
                            {collection.owner && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white">Owner:</span>
                                <button
                                  onClick={() => copyToClipboard(collection.owner!, 'owner')}
                                  className="text-xs font-mono text-white hover:text-indigo-400 transition-colors"
                                  title={collection.owner}
                                >
                                  {truncateHash(collection.owner)}
                                  {copiedText === 'owner' && <span className="ml-2 text-green-400">✓</span>}
                                </button>
                              </div>
                            )}

                            {collection.txHash && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white">Tx Hash:</span>
                                <button
                                  onClick={() => copyToClipboard(collection.txHash!, 'tx')}
                                  className="text-xs font-mono text-white hover:text-indigo-400 transition-colors"
                                  title={collection.txHash}
                                >
                                  {truncateHash(collection.txHash)}
                                  {copiedText === 'tx' && <span className="ml-2 text-green-400">✓</span>}
                                </button>
                              </div>
                            )}

                            {collection.blockNumber && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white">Block:</span>
                                <span className="text-xs font-mono text-white">#{collection.blockNumber.toLocaleString()}</span>
                              </div>
                            )}

                            {collection.blockHash && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white">Block Hash:</span>
                                <button
                                  onClick={() => copyToClipboard(collection.blockHash!, 'block')}
                                  className="text-xs font-mono text-white hover:text-indigo-400 transition-colors"
                                  title={collection.blockHash}
                                >
                                  {truncateHash(collection.blockHash)}
                                  {copiedText === 'block' && <span className="ml-2 text-green-400">✓</span>}
                                </button>
                              </div>
                            )}

                            {collection.storageRoot && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white">Storage Root:</span>
                                <button
                                  onClick={() => copyToClipboard(collection.storageRoot!, 'storage')}
                                  className="text-xs font-mono text-white hover:text-indigo-400 transition-colors"
                                  title={collection.storageRoot}
                                >
                                  {truncateHash(collection.storageRoot)}
                                  {copiedText === 'storage' && <span className="ml-2 text-green-400">✓</span>}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewVectors(collection)}
                            className="flex-1 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-all transform hover:scale-105">
                            View Vectors
                          </button>
                          <button className="flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
                            Search
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentSection === 'vectors' && selectedCollection && (
              <div className="space-y-6">
                {/* Header with back button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setCurrentSection('collections')
                        setSelectedCollection(null)
                        setCollectionVectors([])
                      }}
                      className="rounded-md bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                      ← Back to Collections
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedCollection.name}</h2>
                      <p className="text-sm text-white">Inspecting {collectionVectors.length} vectors</p>
                    </div>
                  </div>
                </div>

                {/* Collection Info Card */}
                <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Collection Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-white mb-1">Total Vectors</p>
                      <p className="text-2xl font-bold text-white">{selectedCollection.count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white mb-1">Dimension</p>
                      <p className="text-2xl font-bold text-white">{selectedCollection.dimension}d</p>
                    </div>
                    <div>
                      <p className="text-xs text-white mb-1">Created</p>
                      <p className="text-sm font-medium text-white">{new Date(selectedCollection.created).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white mb-1">Updated</p>
                      <p className="text-sm font-medium text-white">{getTimeAgo(selectedCollection.updated)}</p>
                    </div>
                  </div>
                </div>

                {/* Vectors List */}
                {vectorsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                    <p className="mt-4 text-white">Loading vectors...</p>
                  </div>
                ) : collectionVectors.length === 0 ? (
                  <div className="text-center py-16 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <DocumentTextIcon className="mx-auto h-16 w-16 text-white mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Vectors Found</h3>
                    <p className="text-white">This collection doesn't contain any vectors yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Vectors ({collectionVectors.length})</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {collectionVectors.map((vector, index) => (
                        <div 
                          key={vector.id} 
                          className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-5 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-mono text-white">{vector.id}</p>
                                <p className="text-xs text-white">
                                  {new Date(vector.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded">
                              {vector.vector.length}d
                            </span>
                          </div>

                          {/* Metadata */}
                          {vector.metadata && Object.keys(vector.metadata).length > 0 && (
                            <div className="mb-3 p-3 rounded bg-black/20 border border-white/10">
                              <p className="text-xs font-semibold text-white mb-2">Metadata</p>
                              <div className="space-y-1">
                                {vector.metadata.filename && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white">Filename:</span>
                                    <span className="text-xs text-white">{vector.metadata.filename}</span>
                                  </div>
                                )}
                                {vector.metadata.chunkId && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white">Chunk ID:</span>
                                    <span className="text-xs font-mono text-white">{vector.metadata.chunkId}</span>
                                  </div>
                                )}
                                {vector.metadata.documentId && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white">Document ID:</span>
                                    <span className="text-xs font-mono text-white">{truncateHash(vector.metadata.documentId)}</span>
                                  </div>
                                )}
                                {vector.metadata.text && (
                                  <div className="mt-2">
                                    <span className="text-xs text-white block mb-1">Text Preview:</span>
                                    <p className="text-xs text-white bg-black/30 p-2 rounded border border-white/5 max-h-20 overflow-y-auto">
                                      {vector.metadata.text.substring(0, 200)}
                                      {vector.metadata.text.length > 200 && '...'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Embedding Preview */}
                          <div className="p-3 rounded bg-black/20 border border-white/10">
                            <p className="text-xs font-semibold text-white mb-2">Embedding Preview (first 10 values)</p>
                            <div className="flex flex-wrap gap-1">
                              {vector.vector.slice(0, 10).map((val, i) => (
                                <span 
                                  key={i} 
                                  className="text-xs font-mono bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded"
                                >
                                  {val.toFixed(4)}
                                </span>
                              ))}
                              {vector.vector.length > 10 && (
                                <span className="text-xs text-white px-2 py-1">
                                  ... +{vector.vector.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentSection === 'rag' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-xl border border-purple-500/20 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                        <SparklesIcon className="h-7 w-7 text-purple-400" />
                        <span>RAG Demo - AI-Powered Q&A</span>
                      </h2>
                      <p className="text-white">
                        Ask questions about your uploaded documents. The system retrieves relevant information 
                        from your vector database and uses AI to generate accurate answers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collection Selector */}
                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">1. Select Collection</h3>
                  {collections.filter(c => c.count > 0).length === 0 ? (
                    <div className="text-center py-8 text-white">
                      <FolderIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No collections with vectors available</p>
                      <p className="text-sm mt-2">Upload a document to create a collection with vectors</p>
                      <button 
                        onClick={() => setCurrentSection('upload')}
                        className="mt-4 bg-white px-6 py-2 text-sm text-black hover:bg-white/80 transition-colors">
                        Upload Documents
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {collections.filter(c => c.count > 0).map((collection) => (
                        <button
                          key={collection.id}
                          onClick={() => setSelectedRagCollection(collection.id)}
                          className={classNames(
                            selectedRagCollection === collection.id
                              ? 'bg-indigo-500/30 border-indigo-400'
                              : 'bg-white/5 border-white/10 hover:bg-white/10',
                            'rounded-lg border p-4 text-left transition-all'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <FolderIcon className="h-5 w-5 text-indigo-400" />
                            {selectedRagCollection === collection.id && (
                              <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-1">{collection.name}</h4>
                          <p className="text-xs text-white">{collection.count} vectors</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Query Input */}
                {selectedRagCollection && (
                  <>
                    <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">2. Ask Your Question</h3>
                      <textarea
                        value={ragQuery}
                        onChange={(e) => setRagQuery(e.target.value)}
                        placeholder="E.g., What is this document about? Summarize the main points..."
                        className="w-full h-32 rounded-md bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all resize-none"
                        disabled={ragLoading}
                      />
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={handleRagQuery}
                          disabled={!ragQuery.trim() || ragLoading}
                          className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 text-lg font-semibold text-white hover:from-purple-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
                        >
                          {ragLoading ? 'Processing...' : 'Ask Question'}
                        </button>
                        {(ragAnswer || ragError) && (
                          <button
                            onClick={resetRagQuery}
                            className="rounded-lg bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Processing Steps */}
                    {ragLoading && (
                      <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                        <div className="space-y-4">
                          {[
                            { step: 1, icon: '🔍', label: 'Searching vector database...', desc: 'Finding relevant document chunks' },
                            { step: 2, icon: '📄', label: 'Retrieved relevant chunks', desc: `Found ${ragSources.length || 5} matching results` },
                            { step: 3, icon: '🤖', label: 'Generating AI answer...', desc: 'Processing with Gemini AI' }
                          ].map((item) => (
                            <div
                              key={item.step}
                              className={classNames(
                                'flex items-center space-x-4 p-4 rounded-lg transition-all',
                                ragProcessingStep >= item.step
                                  ? 'bg-indigo-500/20 border border-indigo-500/30'
                                  : 'bg-white/5 border border-white/10 opacity-50'
                              )}
                            >
                              <div className="text-3xl">{item.icon}</div>
                              <div className="flex-1">
                                <p className="text-white font-medium">{item.label}</p>
                                <p className="text-sm text-white">{item.desc}</p>
                              </div>
                              {ragProcessingStep === item.step && (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
                              )}
                              {ragProcessingStep > item.step && (
                                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {ragError && (
                      <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                        <div className="flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                          <div>
                            <p className="text-white font-medium">Error</p>
                            <p className="text-white text-sm">{ragError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Answer Display */}
                    {ragAnswer && (
                      <>
                        <div className="rounded-xl bg-black backdrop-blur-sm border border-white/10 p-6 shadow-2xl">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                              <SparklesIcon className="h-6 w-6 text-purple-400" />
                              <span>AI Answer</span>
                            </h3>
                            <button
                              onClick={() => copyToClipboard(ragAnswer, 'answer')}
                              className="text-sm text-white hover:text-white transition-colors"
                            >
                              {copiedText === 'answer' ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="prose prose-invert max-w-none">
                            <p className="text-white leading-relaxed whitespace-pre-wrap">{ragAnswer}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white">
                            <span>Processed in {ragProcessingTime}ms</span>
                            <span>{ragSources.length} sources used</span>
                          </div>
                        </div>

                        {/* Sources Display */}
                        {ragSources.length > 0 && (
                          <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                              Source Documents ({ragSources.length})
                            </h3>
                            <div className="space-y-3">
                              {ragSources.map((source, index) => (
                                <div
                                  key={source.vectorId}
                                  className="rounded-lg bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition-all"
                                >
                                  <button
                                    onClick={() => setExpandedSource(expandedSource === index ? null : index)}
                                    className="w-full p-4 text-left"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3 flex-1">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold">
                                          {index + 1}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-white">
                                            {source.metadata?.filename || 'Unknown source'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className={classNames(
                                          getScoreColor(source.score),
                                          'px-3 py-1 rounded-full text-xs font-semibold'
                                        )}>
                                          {(source.score * 100).toFixed(1)}% match
                                        </span>
                                        <span className="text-white">
                                          {expandedSource === index ? '▼' : '▶'}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                  
                                  {expandedSource === index && (
                                    <div className="px-4 pb-4 border-t border-white/10 pt-4">
                                      <p className="text-sm text-white leading-relaxed mb-3">
                                        {source.text}
                                      </p>
                                      {source.metadata && (
                                        <div className="grid grid-cols-2 gap-2 text-xs text-white">
                                          {source.metadata.chunkId && (
                                            <div>
                                              <span className="font-medium">Chunk ID:</span> {source.metadata.chunkId}
                                            </div>
                                          )}
                                          <div>
                                            <span className="font-medium">Vector ID:</span> {truncateHash(source.vectorId)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {currentSection === 'search' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Semantic Search</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Search Query
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white placeholder-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="Enter your search query or paste text to find similar vectors..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Collection
                        </label>
                        <select className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option>All Collections</option>
                          <option>AI Research Papers</option>
                          <option>Product Documents</option>
                          <option>Knowledge Base</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Results
                        </label>
                        <select className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option>10 results</option>
                          <option>25 results</option>
                          <option>50 results</option>
                          <option>100 results</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          defaultValue="0.7"
                          className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    </div>
                    <button className="w-full bg-white px-4 py-2 text-sm text-black hover:bg-white/80 transition-colors">
                      Search Vectors
                    </button>
                  </div>
                </div>

                  <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
                  <div className="text-center py-8 text-white">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Enter a search query to find similar vectors</p>
                  </div>
                </div>
              </div>
            )}


            {currentSection === 'settings' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Vector Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Default Dimension
                      </label>
                      <input
                        type="number"
                        defaultValue="768"
                        className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        HNSW M Parameter
                      </label>
                      <input
                        type="number"
                        defaultValue="16"
                        className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        EF Construction
                      </label>
                      <input
                        type="number"
                        defaultValue="200"
                        className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        EF Search
                      </label>
                      <input
                        type="number"
                        defaultValue="50"
                        className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">0G Network Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        RPC Endpoint
                      </label>
                      <input
                        type="text"
                        defaultValue="https://evmrpc-testnet.0g.ai"
                          className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Storage URL
                      </label>
                      <input
                        type="text"
                        defaultValue="https://storage-testnet.0g.ai"
                        className="w-full rounded-md bg-black backdrop-blur-sm border border-white/10 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'developer' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">API Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Collections API</h4>
                        <code className="text-sm text-white">GET /api/v1/collections</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Search Vectors</h4>
                        <code className="text-sm text-white">POST /api/v1/collections/:id/search</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Insert Vector</h4>
                        <code className="text-sm text-white">POST /api/v1/collections/:id/vectors</code>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">System Health</h4>
                        <code className="text-sm text-white">GET /api/v1/health</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">System Stats</h4>
                        <code className="text-sm text-white">GET /api/v1/stats</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Configuration</h4>
                        <code className="text-sm text-white">GET /api/v1/config</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-black backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">SDK Examples</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">JavaScript/TypeScript</h4>
                          <pre className="rounded-md bg-black backdrop-blur-sm border border-white/10 p-4 text-sm text-white overflow-x-auto">
{`const client = new VectorZeroClient('http://localhost:3001');

// Create collection
const collection = await client.createCollection('my-docs', 768);

// Insert vector
await client.insertText(collection.id, 'Hello world', { source: 'demo' });

// Search
const results = await client.search(collection.id, 'greeting');`}
                      </pre>
                    </div>
              </div>
            </div>
          </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
