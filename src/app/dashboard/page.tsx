'use client'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Collapsible Sidebar */}
      <aside className="w-16 bg-gray-800 text-white flex flex-col overflow-hidden hover:w-64 transition-all duration-300 group">
        <div className="p-4 border-b border-gray-700 flex items-center">
          <i className="fas fa-store w-8 h-8 text-2xl"></i>
          <h1 className="text-2xl font-bold ml-2 hidden group-hover:block">Seller</h1>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          <a href="/dashboard" className="flex items-center p-3 rounded-lg bg-gray-700 transition-colors">
            <i className="fas fa-tachometer-alt w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Overview</span>
          </a>
          <a href="/chats" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-comments w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Chats</span>
          </a>
          <a href="/quotations" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-file-invoice-dollar w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Quotations</span>
          </a>
          <a href="/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-user w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Profile</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors">
            <i className="fas fa-sign-out-alt w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="text-gray-600">Welcome back, Seller!</div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-gray-500 font-medium">Impressions</h4>
            <p className="text-3xl font-bold mt-2">1,402</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-gray-500 font-medium">Profile Views</h4>
            <p className="text-3xl font-bold mt-2">356</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-gray-500 font-medium">New Leads</h4>
            <p className="text-3xl font-bold mt-2">23</p>
          </div>
        </div>

        {/* Profile Progress */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Your Profile</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
          </div>
          <p className="text-right text-sm mt-2 font-semibold text-gray-700">75% Complete</p>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-eye text-blue-600 mr-3"></i>
                  <span>Profile viewed by customer</span>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-comment text-green-600 mr-3"></i>
                  <span>New chat message</span>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <a href="/quotations" className="p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <i className="fas fa-file-invoice-dollar text-blue-600 text-xl mb-2"></i>
                <p className="text-sm font-medium">Create Quote</p>
              </a>
              <a href="/chats" className="p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <i className="fas fa-comments text-green-600 text-xl mb-2"></i>
                <p className="text-sm font-medium">View Chats</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}