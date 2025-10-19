'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  ChartBarIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CogIcon,
  CodeBracketIcon,
  CloudIcon,
  ServerIcon,
  DocumentTextIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Overview', href: '#overview', icon: ChartBarIcon, current: true },
  { name: 'Upload', href: '#upload', icon: ArrowUpTrayIcon, current: false },
  { name: 'Collections', href: '#collections', icon: FolderIcon, current: false },
  { name: 'Search', href: '#search', icon: MagnifyingGlassIcon, current: false },
  { name: '0G Network', href: '#network', icon: CloudIcon, current: false },
  { name: 'Settings', href: '#settings', icon: CogIcon, current: false },
  { name: 'Developer', href: '#developer', icon: CodeBracketIcon, current: false },
]

// API configuration  
const API_BASE_URL = 'http://localhost:3001/api/v1'

interface Collection {
  id: string;
  name: string;
  dimension: number;
  count: number;
  created: number;
  updated: number;
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
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
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

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/collections`)
      if (response.data.success) {
        setCollections(response.data.collections)
      }
    } catch (err) {
      console.error('Error fetching collections:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`)
      if (response.data.success) {
        setSystemStats(response.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
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

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
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
    <div className="min-h-screen bg-gray-900">
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
          <div className="flex min-h-0 flex-1 flex-col bg-gray-800/50 backdrop-blur-xl border-r border-white/10">
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
            
            {/* 0G Network Status */}
            <div className="flex-shrink-0 border-t border-white/10 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">0G Network</p>
                  <p className="text-xs text-gray-400">Connected</p>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-gray-800/30 backdrop-blur-md border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white capitalize">{currentSection}</h1>
                <p className="text-sm text-gray-400">Decentralized Vector Database Dashboard</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-white">Live</span>
                </div>
                <button className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
                  New Collection
                </button>
              </div>
            </div>
          </header>

          {/* Dashboard content */}
          <main className="flex-1 overflow-y-auto bg-gray-900/50 p-6">
            {currentSection === 'overview' && (
              <div className="space-y-6">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading dashboard data...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                {systemStats && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-5 shadow">
                      <dt className="truncate text-sm font-medium text-gray-400">Total Collections</dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                        {systemStats.stats.vectors.local.collections}
                      </dd>
                      <div className="absolute bottom-0 right-0 p-3">
                        <FolderIcon className="h-4 w-4 text-indigo-400" />
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-5 shadow">
                      <dt className="truncate text-sm font-medium text-gray-400">Total Vectors</dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                        {systemStats.stats.vectors.local.totalVectors.toLocaleString()}
                      </dd>
                      <div className="absolute bottom-0 right-0 p-3">
                        <DocumentTextIcon className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-5 shadow">
                      <dt className="truncate text-sm font-medium text-gray-400">Memory Usage</dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                        {formatBytes(systemStats.stats.system.memory.heapUsed)}
                      </dd>
                      <div className="absolute bottom-0 right-0 p-3">
                        <ServerIcon className="h-4 w-4 text-yellow-400" />
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-5 shadow">
                      <dt className="truncate text-sm font-medium text-gray-400">Uptime</dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                        {formatUptime(systemStats.stats.system.uptime)}
                      </dd>
                      <div className="absolute bottom-0 right-0 p-3">
                        <CheckCircleIcon className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Search</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Search your vector database..."
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <button className="w-full rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
                        Search Vectors
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
            <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Vector Engine</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">Operational</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">0G Storage</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Embedding Service</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">Running</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Collections */}
                {systemStats && (
                  <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white">Collections</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {collections.length > 0 ? collections.map((collection) => (
                          <div key={collection.id} className="flex items-center justify-between rounded-md bg-white/5 p-4 border border-white/10">
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
                          <div className="text-center py-8 text-gray-400">
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
                      className="rounded-md bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-400 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* File Upload Area */}
                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
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
                      <p className="text-sm text-gray-400 mb-4">
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
                        className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white/10 border border-white/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-8 w-8 text-indigo-400" />
                          <div>
                            <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                            <p className="text-xs text-gray-400">
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
                    <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Chunking Strategy</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
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
                          <p className="text-xs text-gray-400 mt-1">
                            {uploadConfig.chunkingStrategy.type === 'sentence' && 'Split at sentence boundaries with size limits'}
                            {uploadConfig.chunkingStrategy.type === 'fixed' && 'Split into fixed-size chunks with overlap'}
                            {uploadConfig.chunkingStrategy.type === 'paragraph' && 'Split at paragraph boundaries'}
                            {uploadConfig.chunkingStrategy.type === 'semantic' && 'Group semantically similar content'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
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
                          <p className="text-xs text-gray-400 mt-1">
                            Maximum characters per chunk (100-5000)
                          </p>
                        </div>

                        {uploadConfig.chunkingStrategy.type !== 'paragraph' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
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
                            <p className="text-xs text-gray-400 mt-1">
                              Characters to overlap between chunks
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Processing Options */}
                    <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Processing Options</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-white">Generate Embeddings</label>
                            <p className="text-xs text-gray-400">Create vector embeddings for semantic search</p>
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
                            <p className="text-xs text-gray-400">Process embeddings on 0G network (experimental)</p>
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
                    <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Collection Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-white">Create New Collection</label>
                            <p className="text-xs text-gray-400">Create a new collection for this document</p>
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
                              <label className="block text-sm font-medium text-gray-400 mb-2">
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
                              <label className="block text-sm font-medium text-gray-400 mb-2">
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
                            <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
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
                              <p className="text-gray-400">Document:</p>
                              <p className="text-white">{uploadResult.document.filename}</p>
                              <p className="text-gray-400">Size: {formatBytes(uploadResult.document.originalSize)}</p>
                              <p className="text-gray-400">Processing time: {uploadResult.document.processingTime}ms</p>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-gray-400">Results:</p>
                              <p className="text-white">{uploadResult.processing.totalChunks} chunks created</p>
                              <p className="text-white">{uploadResult.processing.insertedVectors} vectors inserted</p>
                              <p className="text-gray-400">Collection: {uploadResult.collection.name}</p>
                            </div>
                          </div>

                          <div className="flex space-x-4">
                            <button
                              onClick={() => setCurrentSection('collections')}
                              className="flex-1 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
                            >
                              View Collection
                            </button>
                            <button
                              onClick={resetUpload}
                              className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500 transition-colors"
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
                  <button className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
                    Create Collection
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <FolderIcon className="h-8 w-8 text-indigo-400" />
                        <span className={classNames(
                          getCollectionStatus(collection) === 'active' ? 'bg-green-400/20 text-green-400' :
                          'bg-gray-400/20 text-gray-400',
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium'
                        )}>
                          {getCollectionStatus(collection)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>Vectors:</span>
                          <span className="text-white">{collection.count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dimension:</span>
                          <span className="text-white">{collection.dimension}d</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Updated:</span>
                          <span className="text-white">{getTimeAgo(collection.updated)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 rounded-md bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/30 transition-colors">
                          Search
                        </button>
                        <button className="flex-1 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors">
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentSection === 'search' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Semantic Search</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Search Query
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="Enter your search query or paste text to find similar vectors..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Collection
                        </label>
                        <select className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option>All Collections</option>
                          <option>AI Research Papers</option>
                          <option>Product Documents</option>
                          <option>Knowledge Base</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Results
                        </label>
                        <select className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option>10 results</option>
                          <option>25 results</option>
                          <option>50 results</option>
                          <option>100 results</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          defaultValue="0.7"
                          className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    </div>
                    <button className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
                      Search Vectors
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
                  <div className="text-center py-8 text-gray-400">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Enter a search query to find similar vectors</p>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'network' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">0G Storage Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Connection Status</span>
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Network</span>
                        <span className="text-sm text-white">0G Testnet</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Storage Nodes</span>
                        <span className="text-sm text-white">24 Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Avg Latency</span>
                        <span className="text-sm text-white">142ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Wallet Info</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Address</span>
                        <span className="text-sm text-white font-mono">0x742d...a4b2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Balance</span>
                        <span className="text-sm text-white">1.2456 0G</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Storage Used</span>
                        <span className="text-sm text-white">1.2 GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Storage Cost</span>
                        <span className="text-sm text-white">0.0045 0G</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                  <div className="space-y-3">
                    {[
                      { type: 'Upload', collection: 'AI Research Papers', size: '245 KB', cost: '0.0012 0G', time: '2 minutes ago' },
                      { type: 'Query', collection: 'Product Documents', size: '-', cost: '0.0001 0G', time: '15 minutes ago' },
                      { type: 'Upload', collection: 'Knowledge Base', size: '1.2 MB', cost: '0.0087 0G', time: '1 hour ago' },
                    ].map((tx, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md bg-white/5 p-3 border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className={`h-2 w-2 rounded-full ${tx.type === 'Upload' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                          <div>
                            <p className="text-sm font-medium text-white">{tx.type} • {tx.collection}</p>
                            <p className="text-xs text-gray-400">{tx.size !== '-' ? `${tx.size} • ` : ''}{tx.time}</p>
                          </div>
                        </div>
                        <span className="text-sm text-white">{tx.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'settings' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Vector Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Default Dimension
                      </label>
                      <input
                        type="number"
                        defaultValue="768"
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        HNSW M Parameter
                      </label>
                      <input
                        type="number"
                        defaultValue="16"
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        EF Construction
                      </label>
                      <input
                        type="number"
                        defaultValue="200"
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        EF Search
                      </label>
                      <input
                        type="number"
                        defaultValue="50"
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">0G Network Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        RPC Endpoint
                      </label>
                      <input
                        type="text"
                        defaultValue="https://evmrpc-testnet.0g.ai"
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Storage URL
                      </label>
                      <input
                        type="text"
                        defaultValue="https://storage-testnet.0g.ai"
                        className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'developer' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">API Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Collections API</h4>
                        <code className="text-sm text-gray-400">GET /api/v1/collections</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Search Vectors</h4>
                        <code className="text-sm text-gray-400">POST /api/v1/collections/:id/search</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Insert Vector</h4>
                        <code className="text-sm text-gray-400">POST /api/v1/collections/:id/vectors</code>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">System Health</h4>
                        <code className="text-sm text-gray-400">GET /api/v1/health</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">System Stats</h4>
                        <code className="text-sm text-gray-400">GET /api/v1/stats</code>
                      </div>
                      <div className="rounded-md bg-white/10 p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2">Configuration</h4>
                        <code className="text-sm text-gray-400">GET /api/v1/config</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">SDK Examples</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">JavaScript/TypeScript</h4>
                      <pre className="rounded-md bg-gray-800/50 p-4 text-sm text-gray-300 overflow-x-auto">
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
