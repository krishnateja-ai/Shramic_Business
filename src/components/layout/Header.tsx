export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-store-alt text-2xl text-blue-600"></i>
            <span className="text-xl font-bold text-gray-900">Seller Portal</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</a>
            <a href="/chats" className="text-gray-700 hover:text-blue-600">Chats</a>
            <a href="/quotations" className="text-gray-700 hover:text-blue-600">Quotations</a>
            <a href="/profile" className="text-gray-700 hover:text-blue-600">Profile</a>
            <button className="text-gray-700 hover:text-red-600">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}