'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  {name: 'Home', href: '/'},
  { name: 'Dashboard', href: '/admin-dashboard' },
  { name: 'About', href: '/about' },
]

export default function Example() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="bg-black">
      <header className="absolute inset-x-0 top-0 z-50 flex justify-center">
        <nav aria-label="Global" className="mt-6 flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg">
          <div className="flex gap-x-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="px-4 py-2 text-sm font-semibold text-white/50 hover:text-white rounded-full transition-all duration-200 ease-in-out">
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex lg:hidden ml-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-full p-2 text-gray-200 hover:bg-white/10"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </nav>
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-black/80 backdrop-blur-xl border-l border-white/20 p-6 sm:max-w-sm">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2.5 text-gray-200 hover:bg-white/10"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="space-y-3 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-200 ease-in-out"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        <div className="mx-auto max-w-7xl py-32 sm:py-48 lg:py-36">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-left">
              <h1 className="text-5xl font-bold tracking-tight text-balance text-white leading-tight font-sans">
                Vect0r: 
                <span className="text-5xl font-bold tracking-tight text-balance text-white leading-tight font-sans"> 0G's own vector database</span>
              </h1>
              <p className="mt-8 text-lg font-normal text-pretty text-white/50 sm:text-xl leading-relaxed font-mono">
                Make your deAI apps truly decentralized with our vector database. <br/> No vendor lock-in. Complete data sovereignty. <br/>
                Built on 0G Storage Layer.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <Link
                  href="/admin-dashboard"
                  className=" bg-white px-8 py-4 text-base font-semibold text-black shadow-lg hover:bg-white/80 transition-all duration-300 transform hover:scale-105 font-mono"
                >
                  Get Started
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <Image
                src="/hero.png"
                alt="Zero Vector Hero"
                width={600}
                height={600}
                className="w-full max-w-lg h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Key Value Propositions */}
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="max-w-3xl text-left mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4 font-sans">
              Why Vect0r?
            </h2>
            <p className="text-xl text-white font-mono leading-relaxed">
              The first vector database that puts you in complete control of your data.
            </p>
          </div>
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 flex items-center justify-center text-2xl shadow-lg">
                  🔒
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 font-sans">Truly Decentralized</h3>
                  <p className="text-white/50 font-mono leading-relaxed">Your data stays under your control. Built on 0G Chain with smart contract governance and distributed storage - no central authority can lock you out.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 flex items-center justify-center text-2xl shadow-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 font-sans">Lightning Fast</h3>
                  <p className="text-white/50 font-mono leading-relaxed">HNSW indexing delivers millisecond vector search at scale. Handle millions of embeddings with real-time similarity search and batch operations.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 flex items-center justify-center text-2xl shadow-lg">
                  🚀
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 font-sans">Developer First</h3>
                  <p className="text-white/50 font-mono leading-relaxed">RESTful APIs, automatic embedding generation, and intelligent document processing. Get from prototype to production in minutes.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 flex items-center justify-center text-2xl shadow-lg">
                  🌐
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 font-sans">Zero Vendor Lock-in</h3>
                  <p className="text-white/50 font-mono leading-relaxed">Deploy anywhere, migrate easily. Open standards and portable infrastructure mean your vector data is never trapped.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Features */}
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8 bg-gradient-to-b from-black/50 to-black/30 rounded-3xl mx-4 my-12">
          <div className="max-w-3xl text-left mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4 font-sans">
              Technical Excellence
            </h2>
            <p className="text-xl text-white font-mono leading-relaxed">
              Built for scale, designed for developers
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 h-full hover:border-indigo-400/50 transition-all duration-300">
                <div className="rounded-2xl p-4 w-16 h-16 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125-.504-1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 font-sans">Smart Document Processing</h3>
                <p className="text-white font-mono leading-relaxed">
                  Multi-format support for PDF, text, and documents. Intelligent chunking strategies and automatic text-to-embedding generation.
                </p>
              </div>
            </div>
            
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 h-full hover:border-emerald-400/50 transition-all duration-300">
                <div className="rounded-2xl p-4 w-16 h-16 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 font-sans">Advanced Vector Operations</h3>
                <p className="text-white font-mono leading-relaxed">
                  Configurable vector dimensions, semantic similarity search with filtering, and real-time collection management.
                </p>
              </div>
            </div>
            
            <div className="group">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 h-full hover:border-blue-400/50 transition-all duration-300">
                <div className="rounded-2xl p-4 w-16 h-16 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 font-sans">Blockchain Integration</h3>
                <p className="text-white font-mono leading-relaxed">
                  On-chain metadata and access control with immutable collection registry and 0G Network smart contract governance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mx-auto max-w-7xl px-6 py-16 pb-8 lg:px-8">
          <div className="max-w-3xl text-left mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4 font-sans">
              Built for Modern AI Applications
            </h2>
            <p className="text-xl text-white font-mono leading-relaxed">
              From search to recommendations, power your next AI breakthrough
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-6 hover:border-indigo-400/50 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-xl border border-indigo-400/20">
                  🤖
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">AI-Powered Search</h3>
                  <p className="text-white font-mono leading-relaxed">
                    Build semantic search across documents, knowledge bases, and content libraries with natural language queries.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-6 hover:border-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-xl border border-emerald-400/20">
                  💬
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">RAG Applications</h3>
                  <p className="text-white font-mono leading-relaxed">
                    Power chatbots and AI assistants with retrieval-augmented generation using your own knowledge base.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-6 hover:border-orange-400/50 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 text-xl border border-orange-400/20">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">Recommendation Systems</h3>
                  <p className="text-white font-mono leading-relaxed">
                    Create intelligent recommendations based on content similarity and user behavior patterns.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 text-xl border border-blue-400/20">
                  📚
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">Document Intelligence</h3>
                  <p className="text-white font-mono leading-relaxed">
                    Process and analyze large document collections with automatic categorization and clustering.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 transform hover:-translate-y-1 md:col-span-2 lg:col-span-1 lg:col-start-1 xl:col-span-2 xl:max-w-md xl:mx-auto">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex items-center justify-center text-xl border border-purple-400/20">
                  🔬
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">Research & Analytics</h3>
                  <p className="text-white font-mono leading-relaxed">
                    Search academic papers, research data, and technical documentation with semantic understanding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
