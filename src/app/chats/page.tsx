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
  increment
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
  isAIAssistant?: boolean
}

interface Message {
  id: string
  text: string
  sender: string
  timestamp: any
  options?: string[]
}

interface StoreData {
  ownerName?: string
  businessName?: string
  [key: string]: any
}

const AI_RESPONSES = {
  welcome: (name: string) => `Hello ${name}! 👋 Welcome to your Business Assistant.`,
  services: `I can help you with:\n\n1. 📊 Analytics\n2. 💬 Customers\n3. 📝 Quotations\n4. ⚙️ Settings\n5. ❓ Support`,
  analytics: `📊 Your store is performing well! Total Impressions: 1,402 (+12%)`,
  default: `I'm here to help! Ask me about analytics, customers, quotations, or settings.`
}

const QUICK_REPLIES = {
  main: ['📊 Analytics', '💬 Customers', '📝 Quotations', '⚙️ Settings', '❓ Support']
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
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          try {
            const storeDocRef = doc(db, 'stores', user.uid)
            const storeDoc = await getDoc(storeDocRef)
            
            if (storeDoc.exists()) {
              const data = storeDoc.data()
              if (['rejected', 'suspended', 'pending_review'].includes(data.status || '')) {
                throw new Error('Invalid account status.')
              }
              setCurrentStoreId(user.uid)
              setStoreData(data)
              await initializeAIAssistant(user.uid, data)
              setLoading(false)
            } else {
              throw new Error('Store profile not found.')
            }
          } catch (error: any) {
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

  const initializeAIAssistant = async (storeId: string, storeData: any) => {
    try {
      const aiChatsQuery = query(
        collection(db, 'storeChats'),
        where('storeId', '==', storeId),
        where('isAIAssistant', '==', true)
      )
      
      const snapshot = await new Promise<any>((resolve) => {
        const unsub = onSnapshot(aiChatsQuery, (snap) => {
          unsub()
          resolve(snap)
        })
      })

      if (snapshot.empty) {
        const aiChatRef = await addDoc(collection(db, 'storeChats'), {
          storeId,
          customerName: '🤖 AI Assistant',
          lastMessage: 'Welcome!',
          timestamp: serverTimestamp(),
          isAIAssistant: true,
          unreadByStoreCount: 0
        })

        await addDoc(collection(db, 'storeChats', aiChatRef.id, 'messages'), {
          text: AI_RESPONSES.welcome(storeData.ownerName || 'there'),
          sender: 'assistant',
          timestamp: serverTimestamp()
        })

        await addDoc(collection(db, 'storeChats', aiChatRef.id, 'messages'), {
          text: AI_RESPONSES.services,
          sender: 'assistant',
          timestamp: serverTimestamp(),
          options: QUICK_REPLIES.main
        })
      }
    } catch (error) {
      console.error('AI init error:', error)
    }
  }

  useEffect(() => {
    if (!currentStoreId || !db) return

    const q = query(
      collection(db, 'storeChats'),
      where('storeId', '==', currentStoreId),
      orderBy('timestamp', 'desc')
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const chatsList: any[] = []
      snapshot.forEach((doc) => {
        chatsList.push({ id: doc.id, ...doc.data() })
      })
      setChats(chatsList)
    })

    return () => unsub()
  }, [currentStoreId])

  useEffect(() => {
    if (!currentChatId || !db) return

    const messagesRef = collection(db, 'storeChats', currentChatId, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'))

    const unsub = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = []
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() } as Message)
      })
      setMessages(messagesList)
      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 100)
    })

    return () => unsub()
  }, [currentChatId])

  const openChat = async (chatId: string, chatData: ChatData) => {
    setCurrentChatId(chatId)
    setCurrentChatData(chatData)
    
    if (isMobile) {
      setShowChatList(false)
    }

    if (chatData.unreadByStoreCount && chatData.unreadByStoreCount > 0) {
      try {
        await updateDoc(doc(db, 'storeChats', chatId), {
          unreadByStoreCount: 0
        })
      } catch (error) {
        console.error('Error clearing unread:', error)
      }
    }
  }

  const handleAIResponse = async (userMessage: string) => {
    const lower = userMessage.toLowerCase()
    let response = AI_RESPONSES.default

    if (lower.includes('analytic') || lower.includes('📊')) {
      response = AI_RESPONSES.analytics
    } else if (lower.includes('thank')) {
      response = "You're welcome! 😊"
    }

    await addDoc(collection(db, 'storeChats', currentChatId!, 'messages'), {
      text: response,
      sender: 'assistant',
      timestamp: serverTimestamp(),
      options: QUICK_REPLIES.main
    })

    await updateDoc(doc(db, 'storeChats', currentChatId!), {
      lastMessage: response.substring(0, 50),
      timestamp: serverTimestamp()
    })
  }

  const sendMessage = async (text?: string) => {
    const messageText = text || messageInput.trim()
    if (!messageText || !currentChatId || !db) return

    setMessageInput('')

    try {
      await addDoc(collection(db, 'storeChats', currentChatId, 'messages'), {
        text: messageText,
        sender: 'store',
        timestamp: serverTimestamp()
      })

      await updateDoc(doc(db, 'storeChats', currentChatId), {
        lastMessage: messageText,
        timestamp: serverTimestamp(),
        unreadByCustomerCount: increment(1),
        lastSender: 'store'
      })

      if (currentChatData?.isAIAssistant) {
        setTimeout(() => handleAIResponse(messageText), 1000)
      }
    } catch (error) {
      console.error('Send error:', error)
      setMessageInput(messageText)
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
        <p className="mt-4 text-lg text-gray-600">Loading chats...</p>
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
            {sidebarExpanded && <span>Chats</span>}
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

      {/* Main Content - Simplified version due to character limit */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 bg-white border-b">
          <h1 className="text-3xl font-bold text-gray-800">Customer Conversations</h1>
        </header>

        <div className="flex-1 bg-white m-6 rounded-lg shadow-md overflow-hidden flex">
          {/* Chat List */}
          <div className="w-1/3 border-r flex-col">
            <div className="p-4 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats..."
                className="w-full p-2 border rounded-lg"
              />
            </div>
            
            <ul className="overflow-y-auto flex-1">
              {filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => openChat(chat.id, chat)}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                >
                  <h4 className="font-semibold">{chat.customerName}</h4>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          <div className="w-2/3 flex flex-col">
            {!currentChatId ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Select a conversation</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{currentChatData?.customerName}</h3>
                </div>

                <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto bg-gray-100">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-4 ${msg.sender === 'store' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-2 rounded-lg ${
                        msg.sender === 'store' ? 'bg-blue-600 text-white' : 'bg-white'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t">
                  <div className="flex">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 p-3 border rounded-l-lg"
                    />
                    <button
                      onClick={() => sendMessage()}
                      className="bg-blue-600 text-white px-6 rounded-r-lg"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}