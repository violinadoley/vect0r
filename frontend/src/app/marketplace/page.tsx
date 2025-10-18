export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Marketplace</h1>
        <p className="text-lg text-gray-300 mb-8">
          Connect with our ecosystem of partners and integrations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Developer Tools</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span>Python SDK</span>
                <span className="text-indigo-400">Free</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span>JavaScript SDK</span>
                <span className="text-indigo-400">Free</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span>REST API</span>
                <span className="text-indigo-400">Free</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Enterprise Solutions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span>Managed Hosting</span>
                <span className="text-green-400">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span>24/7 Support</span>
                <span className="text-green-400">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span>Custom Integration</span>
                <span className="text-green-400">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
