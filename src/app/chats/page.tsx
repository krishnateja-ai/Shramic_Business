'use client'

import { useEffect, useState, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc, 
  increment,
  setDoc,
  getDocs,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore'

// Type Definitions
interface ChatData {
  id: string
  storeId: string
  customerId: string
  customerName: string
  lastMessage: string
  timestamp: Timestamp
  unreadByStoreCount: number
  unreadByCustomerCount: number
  lastSender: string
}

interface Message {
  id: string
  text: string
  sender: 'store' | 'customer'
  timestamp: Timestamp
}

interface User {
  id: string
  name: string
  type: 'store' | 'customer'
}

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYEG2XdbuQlGflMwppjtj54ur4jKs89-A",
  authDomain: "kaamon6363.firebaseapp.com",
  projectId: "kaamon6363",
  storageBucket: "kaamon6363.firebasestorage.app",
  messagingSenderId: "582122881331",
  appId: "1:582122881331:web:8fac47d3e8646e56a47e46",
  measurementId: "G-7GFJK5G724"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export default function ChatsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatData[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatRecipient, setNewChatRecipient] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeChatsRef = useRef<Unsubscribe | null>(null)
  const unsubscribeMessagesRef = useRef<Unsubscribe | null>(null)

  // Auth Guard Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const storeDocRef = doc(db, "stores", user.uid)
          const storeDoc = await getDoc(storeDocRef)
          
          if (storeDoc.exists()) {
            const status = storeDoc.data().status
            if (['rejected', 'suspended', 'pending_review'].includes(status)) {
              throw new Error('Invalid account status.')
            }
            setCurrentStoreId(user.uid)
            setIsLoading(false)
          } else {
            throw new Error('Store profile not found.')
          }
        } catch (error) {
          console.error("Auth Guard Error:", error instanceof Error ? error.message : 'Unknown error')
          await signOut(auth)
          window.location.href = '/login'
        }
      } else {
        console.log("No user found, redirecting to login.")
        window.location.href = '/login'
      }
    })

    return () => unsubscribe()
  }, [])

  // Load All Chats Effect
  useEffect(() => {
    if (!currentStoreId) return

    const q = query(
      collection(db, 'storeChats'), 
      where('storeId', '==', currentStoreId), 
      orderBy('timestamp', 'desc')
    )
    
    unsubscribeChatsRef.current = onSnapshot(q, (snapshot) => {
      const chatsList: ChatData[] = []
      snapshot.forEach((docSnap) => {
        chatsList.push({ id: docSnap.id, ...docSnap.data() } as ChatData)
      })
      setChats(chatsList)
    })

    return () => {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current()
      }
    }
  }, [currentStoreId])

  // Load Messages Effect
  useEffect(() => {
    if (!currentChatId) return

    const messagesRef = collection(db, 'storeChats', currentChatId, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'))
    
    unsubscribeMessagesRef.current = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = []
      snapshot.forEach((docSnap) => {
        messagesList.push({ id: docSnap.id, ...docSnap.data() } as Message)
      })
      setMessages(messagesList)
    })

    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current()
      }
    }
  }, [currentChatId])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load available users/stores for new chat
  const loadAvailableUsers = async () => {
    try {
      // Load other stores
      const storesQuery = query(collection(db, 'stores'), where('status', '==', 'active'))
      const storesSnapshot = await getDocs(storesQuery)
      const users: User[] = []
      
      storesSnapshot.forEach((docSnap) => {
        if (docSnap.id !== currentStoreId) {
          const data = docSnap.data()
          users.push({
            id: docSnap.id,
            name: data.storeName || data.ownerName || 'Store',
            type: 'store'
          })
        }
      })
      
      setAvailableUsers(users)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const openNewChatModal = () => {
    setShowNewChatModal(true)
    loadAvailableUsers()
  }

  const createNewChat = async (recipientId: string, recipientName: string) => {
    try {
      // Check if chat already exists
      const existingChatQuery = query(
        collection(db, 'storeChats'),
        where('storeId', '==', currentStoreId),
        where('customerId', '==', recipientId)
      )
      const existingChats = await getDocs(existingChatQuery)
      
      if (!existingChats.empty) {
        // Open existing chat
        const existingChat = existingChats.docs[0]
        openChat(existingChat.id, existingChat.data() as ChatData)
        setShowNewChatModal(false)
        setNewChatRecipient('')
        return
      }

      // Create new chat
      const newChatRef = doc(collection(db, 'storeChats'))
      await setDoc(newChatRef, {
        storeId: currentStoreId,
        customerId: recipientId,
        customerName: recipientName,
        lastMessage: '',
        timestamp: serverTimestamp(),
        unreadByStoreCount: 0,
        unreadByCustomerCount: 0,
        lastSender: ''
      })

      // Open the new chat
      const newChatData: ChatData = {
        id: newChatRef.id,
        storeId: currentStoreId || '',
        customerId: recipientId,
        customerName: recipientName,
        lastMessage: '',
        timestamp: Timestamp.now(),
        unreadByStoreCount: 0,
        unreadByCustomerCount: 0,
        lastSender: ''
      }
      openChat(newChatRef.id, newChatData)

      setShowNewChatModal(false)
      setNewChatRecipient('')
    } catch (error) {
      console.error("Error creating new chat:", error)
      alert("Failed to create chat. Please try again.")
    }
  }

  const openChat = async (chatId: string, chatData: ChatData) => {
    setCurrentChatId(chatId)
    setSelectedChat(chatData)

    // Reset unread count when chat is opened
    if (chatData.unreadByStoreCount > 0) {
      try {
        const chatDocRef = doc(db, 'storeChats', chatId)
        await updateDoc(chatDocRef, {
          unreadByStoreCount: 0
        })
      } catch (error) {
        console.error("Error clearing unread count:", error)
      }
    }
  }

  const sendMessage = async () => {
    const text = messageInput.trim()
    if (!text || !currentChatId) return

    setMessageInput('')
    try {
      await addDoc(collection(db, 'storeChats', currentChatId, 'messages'), {
        text, 
        sender: 'store', 
        timestamp: serverTimestamp()
      })
      
      await updateDoc(doc(db, 'storeChats', currentChatId), {
        lastMessage: text,
        timestamp: serverTimestamp(),
        unreadByCustomerCount: increment(1),
        lastSender: 'store'
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setMessageInput(text)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error', error)
    }
  }

  const formatTimestamp = (ts: Timestamp | null | undefined): string => {
    if (!ts || !ts.toDate) return ''
    return ts.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const filteredChats = chats.filter(chat => 
    (chat.customerName || 'Customer').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">Loading your chats...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-800 text-white flex-shrink-0 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 text-xl font-bold border-b border-gray-700">
          <div className="flex items-center">
            <i className="fas fa-store-alt mr-3"></i>
            <span>Seller Central</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <a href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-tachometer-alt w-6 mr-3"></i>
            <span>Overview</span>
          </a>
          <a href="/chats" className="flex items-center p-3 rounded-lg bg-gray-900 text-white transition-colors">
            <i className="fas fa-comments w-6 mr-3"></i>
            <span>Store Chats</span>
          </a>
          <a href="/quotations" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-file-invoice-dollar w-6 mr-3"></i>
            <span>Quotations</span>
          </a>
          <a href="/settings" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-cog w-6 mr-3"></i>
            <span>Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <i className="fas fa-sign-out-alt w-6 mr-3"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header with mobile menu button */}
        <header className="flex justify-between items-center p-4 lg:p-6 bg-white shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-600 hover:text-gray-800"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Customer Conversations</h1>
          </div>
          <button
            onClick={openNewChatModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </header>
        
        <div className="flex-1 bg-white m-4 lg:m-6 rounded-lg shadow-md flex flex-col lg:flex-row overflow-hidden">
          {/* Chat List Sidebar */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-64 lg:max-h-full">
            <div className="p-4 border-b">
              <input 
                type="text" 
                placeholder="Search chats by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <ul className="overflow-y-auto flex-1">
              {filteredChats.length === 0 ? (
                <p className="text-center text-gray-500 p-4">No conversations yet.</p>
              ) : (
                filteredChats.map((chat) => {
                  const unreadCount = chat.unreadByStoreCount || 0
                  const isActive = chat.id === currentChatId
                  
                  return (
                    <li 
                      key={chat.id}
                      onClick={() => openChat(chat.id, chat)}
                      className={`flex items-center p-3 lg:p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${isActive ? 'bg-blue-50' : ''}`}
                    >
                      <img 
                        src={`https://ui-avatars.com/api/?name=${chat.customerName || 'C'}&background=random`} 
                        alt="User" 
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 overflow-hidden min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-800 truncate text-sm lg:text-base">
                            {chat.customerName || 'Customer'}
                          </h4>
                          <p className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {formatTimestamp(chat.timestamp)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-xs lg:text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
                            {chat.lastMessage || '...'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col min-h-0">
            {!currentChatId ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <i className="fas fa-comments text-5xl lg:text-6xl mb-4"></i>
                <p className="text-lg lg:text-xl text-center">Select a conversation to begin</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div className="p-3 lg:p-4 border-b flex items-center bg-gray-50">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${selectedChat?.customerName || 'C'}&background=random`} 
                    alt="User" 
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-full mr-3"
                  />
                  <h3 className="font-semibold text-base lg:text-lg text-gray-800">
                    {selectedChat?.customerName || 'Customer'}
                  </h3>
                </div>
                
                <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-gray-100">
                  {messages.map((message) => {
                    const isStore = message.sender === 'store'
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex mb-3 lg:mb-4 ${isStore ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] lg:max-w-md px-3 lg:px-4 py-2 lg:py-3 rounded-xl ${isStore ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                          <p className="text-sm lg:text-base break-words">{message.text}</p>
                          <span className={`text-xs block mt-1 text-right ${isStore ? 'opacity-75' : 'text-gray-500'}`}>
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-3 lg:p-4 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your message here..." 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 p-2 lg:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex-shrink-0"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 lg:p-6 border-b flex justify-between items-center">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Start New Conversation</h2>
              <button 
                onClick={() => {
                  setShowNewChatModal(false)
                  setNewChatRecipient('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-4 lg:p-6">
              <input
                type="text"
                placeholder="Search for vendors or customers..."
                value={newChatRecipient}
                onChange={(e) => setNewChatRecipient(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Available Contacts</h3>
              {availableUsers.filter(user => 
                user.name.toLowerCase().includes(newChatRecipient.toLowerCase())
              ).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No contacts found</p>
              ) : (
                <ul className="space-y-2">
                  {availableUsers
                    .filter(user => user.name.toLowerCase().includes(newChatRecipient.toLowerCase()))
                    .map((user) => (
                      <li 
                        key={user.id}
                        onClick={() => createNewChat(user.id, user.name)}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <img 
                          src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-800">{user.name}</h4>
                          <p className="text-xs text-gray-500 capitalize">{user.type}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}