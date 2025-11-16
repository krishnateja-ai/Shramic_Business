'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth'
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
  Timestamp
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAYEG2XdbuQlGflMwppjtj54ur4jKs89-A",
  authDomain: "kaamon6363.firebaseapp.com",
  projectId: "kaamon6363",
  storageBucket: "kaamon6363.firebasestorage.app",
  messagingSenderId: "582122881331",
  appId: "1:582122881331:web:8fac47d3e8646e56a47e46",
  measurementId: "G-7GFJK5G724"
}

let app: any
let auth: any
let db: any

if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

interface ChatData {
  customerName?: string
  lastMessage?: string
  timestamp?: any
  unreadByStoreCount?: number
  storeId?: string
}

interface Message {
  id: string
  text: string
  sender: string
  timestamp: any
}

export default function ChatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentChatData, setCurrentChatData] = useState<ChatData | null>(null)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showChatList, setShowChatList] = useState(true)
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesUnsubscribeRef = useRef<any>(null)
  const chatsUnsubscribeRef = useRef<any>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setShowChatList(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auth guard
  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          try {
            const storeDocRef = doc(db, 'stores', user.uid)
            const storeDoc = await getDoc(storeDocRef)
            
            if (storeDoc.exists()) {
              const status = storeDoc.data().status
              if (['rejected', 'suspended', 'pending_review'].includes(status || '')) {
                throw new Error('Invalid account status.')
              }
              setCurrentStoreId(user.uid)
              setLoading(false)
            } else {
              throw new Error('Store profile not found.')
            }
          } catch (error: any) {
            console.error('Auth Guard Error:', error.message)
            await signOut(auth)
            router.push('/login')
          }
        } else {
          router.push('/login')
        }
      })
      return () => unsubscribe()
    }
  }, [router])

  // Load all chats
  useEffect(() => {
    if (!currentStoreId || !db) return

    const q = query(
      collection(db, 'storeChats'),
      where('storeId', '==', currentStoreId),
      orderBy('timestamp', 'desc')
    )

    chatsUnsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const chatsList: any[] = []
      snapshot.forEach((doc) => {
        chatsList.push({ id: doc.id, ...doc.data() })
      })
      setChats(chatsList)
    })

    return () => {
      if (chatsUnsubscribeRef.current) {
        chatsUnsubscribeRef.current()
      }
    }
  }, [currentStoreId])

  // Load messages for current chat
  useEffect(() => {
    if (!currentChatId || !db) return

    const messagesRef = collection(db, 'storeChats', currentChatId, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'))

    messagesUnsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = []
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() } as Message)
      })
      setMessages(messagesList)
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 100)
    })

    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current()
      }
    }
  }, [currentChatId])

  const openChat = async (chatId: string, chatData: ChatData) => {
    setCurrentChatId(chatId)
    setCurrentChatData(chatData)
    
    // Hide chat list on mobile
    if (isMobile) {
      setShowChatList(false)
    }

    // Clear unread count
    if (chatData.unreadByStoreCount && chatData.unreadByStoreCount > 0) {
      try {
        const chatDocRef = doc(db, 'storeChats', chatId)
        await updateDoc(chatDocRef, {
          unreadByStoreCount: 0
        })
      } catch (error) {
        console.error('Error clearing unread count:', error)
      }
    }
  }

  const sendMessage = async () => {
    const text = messageInput.trim()
    if (!text || !currentChatId || !db) return

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (ts: any) => {
    if (!ts || !ts.toDate) return ''
    return ts.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const backToChatList = () => {
    setShowChatList(true)
    setCurrentChatId(null)
  }

  const filteredChats = chats.filter(chat => 
    (chat.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">Loading your chats...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`${sidebarExpanded ? 'w-64' : 'w-16'} bg-gray-800 text-white flex-shrink-0 flex-col transition-all duration-300 hidden md:flex`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700 px-4">
          <i className="fas fa-store-alt mr-3"></i>
          {sidebarExpanded && <span>Seller Central</span>}
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <a href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-tachometer-alt w-6 mr-3"></i>
            {sidebarExpanded && <span>Overview</span>}
          </a>
          <a href="/chats" className="flex items-center p-3 rounded-lg bg-gray-900 text-white transition-colors">
            <i className="fas fa-comments w-6 mr-3"></i>
            {sidebarExpanded && <span>Store Chats</span>}
          </a>
          <a href="/quotations" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-file-invoice-dollar w-6 mr-3"></i>
            {sidebarExpanded && <span>Quotations</span>}
          </a>
          <a href="/settings" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-cog w-6 mr-3"></i>
            {sidebarExpanded && <span>Settings</span>}
          </a>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <i className="fas fa-sign-out-alt w-6 mr-3"></i>
            {sidebarExpanded && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            {!showChatList && currentChatData ? currentChatData.customerName : 'Chats'}
          </h1>
          {!showChatList && (
            <button onClick={backToChatList} className="text-blue-600">
              <i className="fas fa-arrow-left mr-2"></i> Back
            </button>
          )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block p-6 bg-white border-b">
          <h1 className="text-3xl font-bold text-gray-800">Customer Conversations</h1>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-white m-4 md:m-6 rounded-lg shadow-md overflow-hidden flex">
            {/* Chat List */}
            <div className={`${showChatList || !isMobile ? 'flex' : 'hidden'} w-full md:w-1/3 border-r border-gray-200 flex-col`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search chats by name..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>
              
              <ul className="overflow-y-auto flex-1">
                {filteredChats.length === 0 ? (
                  <li className="text-center text-gray-500 p-8">
                    <i className="fas fa-comments text-4xl mb-2"></i>
                    <p>No conversations yet</p>
                  </li>
                ) : (
                  filteredChats.map((chat) => (
                    <li
                      key={chat.id}
                      onClick={() => openChat(chat.id, chat)}
                      className={`flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                        chat.id === currentChatId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <img
                        src={`https://ui-avatars.com/api/?name=${chat.customerName || 'C'}&background=random`}
                        alt="User"
                        className="w-12 h-12 rounded-full mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {chat.customerName || 'Customer'}
                          </h4>
                          <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTimestamp(chat.timestamp)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-sm truncate ${
                            chat.unreadByStoreCount > 0 ? 'font-bold text-gray-700' : 'text-gray-500'
                          }`}>
                            {chat.lastMessage || '...'}
                          </p>
                          {chat.unreadByStoreCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center ml-2 flex-shrink-0">
                              {chat.unreadByStoreCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Chat Window */}
            <div className={`${!showChatList || !isMobile ? 'flex' : 'hidden'} w-full md:w-2/3 flex-col`}>
              {!currentChatId ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <i className="fas fa-comments text-6xl mb-4"></i>
                  <p className="text-xl">Select a conversation to begin</p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center bg-gray-50">
                    {isMobile && (
                      <button onClick={backToChatList} className="mr-3 text-blue-600">
                        <i className="fas fa-arrow-left"></i>
                      </button>
                    )}
                    <img
                      src={`https://ui-avatars.com/api/?name=${currentChatData?.customerName || 'C'}&background=random`}
                      alt="User"
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <h3 className="font-semibold text-lg text-gray-800">
                      {currentChatData?.customerName || 'Customer'}
                    </h3>
                  </div>

                  {/* Messages Container */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 p-6 overflow-y-auto bg-gray-100"
                  >
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isStore = message.sender === 'store'
                          return (
                            <div
                              key={message.id}
                              className={`flex mb-4 ${isStore ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] md:max-w-md px-4 py-3 rounded-xl ${
                                  isStore
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                                }`}
                              >
                                <p className="break-words">{message.text}</p>
                                <span
                                  className={`text-xs block mt-1 text-right ${
                                    isStore ? 'opacity-75' : 'text-gray-400'
                                  }`}
                                >
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around py-2">
        <a href="/dashboard" className="flex flex-col items-center p-2 text-gray-600">
          <i className="fas fa-tachometer-alt text-xl"></i>
          <span className="text-xs mt-1">Overview</span>
        </a>
        <a href="/chats" className="flex flex-col items-center p-2 text-blue-600">
          <i className="fas fa-comments text-xl"></i>
          <span className="text-xs mt-1">Chats</span>
        </a>
        <a href="/quotations" className="flex flex-col items-center p-2 text-gray-600">
          <i className="fas fa-file-invoice-dollar text-xl"></i>
          <span className="text-xs mt-1">Quotes</span>
        </a>
        <button onClick={handleLogout} className="flex flex-col items-center p-2 text-gray-600">
          <i className="fas fa-sign-out-alt text-xl"></i>
          <span className="text-xs mt-1">Logout</span>
        </button>
      </nav>
    </div>
  )
}