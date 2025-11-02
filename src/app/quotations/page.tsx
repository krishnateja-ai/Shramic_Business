'use client'

export default function QuotationsPage() {
  const quotations = [
    {
      id: 'QT-001',
      customerName: 'Rajesh Kumar',
      dateReceived: '2024-01-15',
      amount: '₹25,000',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'QT-002', 
      customerName: 'Priya Sharma',
      dateReceived: '2024-01-14',
      amount: '₹18,500',
      status: 'Approved',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'QT-003',
      customerName: 'Business Corp',
      dateReceived: '2024-01-13',
      amount: '₹42,000',
      status: 'Rejected',
      statusColor: 'bg-red-100 text-red-800'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col transition-all duration-300">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Seller Central</h1>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          <a href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-tachometer-alt w-6 h-6 mr-3"></i>
            <span>Overview</span>
          </a>
          <a href="/chats" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-comments w-6 h-6 mr-3"></i>
            <span>Chats</span>
          </a>
          <a href="/quotations" className="flex items-center p-3 rounded-lg bg-gray-700 transition-colors">
            <i className="fas fa-file-invoice-dollar w-6 h-6 mr-3"></i>
            <span>Quotations</span>
          </a>
          <a href="/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-user w-6 h-6 mr-3"></i>
            <span>Profile</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors">
            <i className="fas fa-sign-out-alt w-6 h-6 mr-3"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Received Quotations</h2>
        </header>

        {/* Quotations Table */}
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Customer Name</th>
                  <th scope="col" className="px-6 py-3">Date Received</th>
                  <th scope="col" className="px-6 py-3">Quoted Amount</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      <i className="fas fa-inbox text-4xl text-gray-400 mb-2"></i>
                      <p className="text-gray-600">No quotations received yet.</p>
                    </td>
                  </tr>
                ) : (
                  quotations.map((quote, index) => (
                    <tr key={quote.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {quote.customerName}
                      </td>
                      <td className="px-6 py-4">{quote.dateReceived}</td>
                      <td className="px-6 py-4 font-semibold">{quote.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${quote.statusColor}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <i className="fas fa-eye"></i> View
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="fas fa-file-invoice text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Quotations</h3>
                <p className="text-2xl font-bold text-gray-900">{quotations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Approved</h3>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}