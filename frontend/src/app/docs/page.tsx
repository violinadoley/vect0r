export default function ProductPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Product</h1>
        <p className="text-lg text-gray-300 mb-6">
          Discover our innovative decentralized Vector DB solution.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Decentralized Architecture</h3>
            <p className="text-gray-400">Built on cutting-edge blockchain technology for maximum reliability.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">High Performance</h3>
            <p className="text-gray-400">Optimized for speed and scalability without compromising security.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Cost Effective</h3>
            <p className="text-gray-400">Reduce your infrastructure costs while maintaining enterprise-grade performance.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
