export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Company</h1>
        <p className="text-lg text-gray-300 mb-8">
          Learn about our mission to democratize AI infrastructure.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Our Story</h2>
            <p className="text-gray-400 mb-4">
              Founded by AI researchers and blockchain engineers, we recognized the need for 
              a truly decentralized vector database that puts control back in the hands of developers.
            </p>
            <p className="text-gray-400 mb-4">
              Our mission is to make AI infrastructure more accessible, affordable, and free 
              from vendor lock-in constraints.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6">Our Values</h2>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium text-indigo-400 mb-2">Decentralization</h4>
                <p className="text-gray-400">Power should be distributed, not concentrated.</p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-indigo-400 mb-2">Accessibility</h4>
                <p className="text-gray-400">AI tools should be available to everyone, everywhere.</p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-indigo-400 mb-2">Innovation</h4>
                <p className="text-gray-400">Pushing the boundaries of what's possible with technology.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
