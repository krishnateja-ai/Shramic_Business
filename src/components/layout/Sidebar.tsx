export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
        <i className="fas fa-store-alt mr-3"></i> Seller Central
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <a href="/dashboard" className="flex items-center p-3 rounded-lg bg-gray-900 text-white transition-colors">
          <i className="fas fa-tachometer-alt fa-fw w-6 mr-3"></i>
          <span>Overview</span>
        </a>
        <a href="/chats" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <i className="fas fa-comments fa-fw w-6 mr-3"></i>
          <span>Store Chats</span>
        </a>
        <a href="/quotations" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <i className="fas fa-file-invoice-dollar fa-fw w-6 mr-3"></i>
          <span>Quotations</span>
        </a>
        <a href="/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <i className="fas fa-user fa-fw w-6 mr-3"></i>
          <span>Profile</span>
        </a>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors">
          <i className="fas fa-sign-out-alt fa-fw w-6 mr-3"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}