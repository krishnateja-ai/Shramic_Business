'use client'

import Sidebar from '@/components/layout/Sidebar'

export default function ChatsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Customer Conversations</h1>
        </header>
        
        <div className="bg-white rounded-lg shadow-md h-[calc(100vh-150px)] flex">
          {/* Chat List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
              <input 
                type="text" 
                placeholder="Search chats by name..." 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <ul className="overflow-y-auto flex-1">
              {/* Chat List Items */}
              <li className="border-b hover:bg-gray-50 cursor-pointer bg-blue-50">
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="https://ui-avatars.com/api/?name=Customer&background=random" 
                      alt="Customer" 
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">Customer #1234</h3>
                      <p className="text-sm text-gray-500 truncate">Hello, I need construction services...</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">2h ago</span>
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 ml-auto"></div>
                    </div>
                  </div>
                </div>
              </li>
              
              <li className="border-b hover:bg-gray-50 cursor-pointer">
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="https://ui-avatars.com/api/?name=Business&background=random" 
                      alt="Business" 
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">Business Corp</h3>
                      <p className="text-sm text-gray-500 truncate">Can you provide a quotation?</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">1d ago</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Chat Window */}
          <div className="w-2/3 flex flex-col">
            {/* Active Chat */}
            <div className="flex-1 flex-col h-full">
              <div className="p-4 border-b flex items-center bg-gray-50">
                <img 
                  src="https://ui-avatars.com/api/?name=C&background=random" 
                  alt="User" 
                  className="w-10 h-10 rounded-full mr-4"
                />
                <h3 className="font-semibold text-lg text-gray-800">Customer #1234</h3>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
                {/* Messages */}
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-4 max-w-xs shadow-sm">
                      <p className="text-gray-800">Hello, I need construction services for my house</p>
                      <span className="text-xs text-gray-400 mt-2 block">10:30 AM</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg p-4 max-w-xs shadow-sm">
                      <p>Sure! I'd be happy to help. What type of construction do you need?</p>
                      <span className="text-xs text-blue-200 mt-2 block">10:32 AM</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-4 max-w-xs shadow-sm">
                      <p className="text-gray-800">It's for residential construction - building a new house</p>
                      <span className="text-xs text-gray-400 mt-2 block">10:33 AM</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t bg-white">
                <div className="flex items-center">
                  <input 
                    type="text" 
                    placeholder="Type your message here..." 
                    className="w-full p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}