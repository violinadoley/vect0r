export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Features</h1>
        <p className="text-lg text-gray-300 mb-8">
          Explore the powerful features that make our Vector DB stand out.
        </p>
        <div className="space-y-8">
          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-2xl font-semibold mb-3">No Vendor Lock-in</h3>
            <p className="text-gray-400">
              Deploy anywhere, migrate easily. Your data remains under your control.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-2xl font-semibold mb-3">Real-time Synchronization</h3>
            <p className="text-gray-400">
              Instant data consistency across all nodes in the decentralized network.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-2xl font-semibold mb-3">Advanced Security</h3>
            <p className="text-gray-400">
              End-to-end encryption and blockchain-based integrity verification.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-2xl font-semibold mb-3">AI-Optimized</h3>
            <p className="text-gray-400">
              Purpose-built for machine learning and AI workloads with optimized vector operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
