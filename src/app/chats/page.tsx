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
  isAIAssistant?: boolean
}

interface Message {
  id: string
  text: string
  sender: string
  timestamp: any
  isQuickReply?: boolean
  options?: string[]
}

interface StoreData {
  ownerName?: string
  businessName?: string
  [key: string]: any
}

// AI Assistant responses
const AI_RESPONSES = {
  welcome: (name: string) => `Hello ${name}! 👋 Welcome to your Business Assistant. I'm here to help you manage your store and assist customers. How can I help you today?`,
  services: `I can help you with:\n\n1. 📊 View Business Analytics\n2. 💬 Manage Customer Conversations\n3. 📝 Create Quotations\n4. ⚙️ Update Store Settings\n5. 📋 Complete Profile\n6. ❓ FAQs & Support\n\nPlease select an option or ask me anything!`,
  analytics: `📊 Business Analytics:\n\n• Total Impressions: 1,402 (+12%)\n• Profile Views: 356 (+8%)\n• New Leads: 23 (+5%)\n\nYour store is performing well! Would you like tips to improve visibility?`,
  quotations: `📝 Quotation Management:\n\nYou can create professional quotations for your customers directly from the Quotations page. Would you like me to guide you through creating your first quotation?`,
  profile: `📋 Profile Completion:\n\nCompleting your profile helps customers find you better! Missing items:\n• Business hours\n• Service descriptions\n• Photos/Gallery\n\nShall I help you complete these?`,
  settings: `⚙️ Store Settings:\n\nYou can manage:\n• Business information\n• Notification preferences\n• Privacy settings\n• Account security\n\nWhat would you like to update?`,
  support: `❓ Frequently Asked Questions:\n\n• How do I respond to customer inquiries?\n• How to create a quotation?\n• How to update my business hours?\n• How to add services/products?\n• How to improve my store visibility?\n\nSelect a question or type your own!`,
  thanks: `You're welcome! 😊 Is there anything else I can help you with?`,
  default: `I'm here to help! You can ask me about:\n• Business analytics\n• Managing customers\n• Creating quotations\n• Store settings\n• Profile completion\n\nWhat would you like to know?`
}

const QUICK_REPLIES = {
  main: ['📊 Analytics', '💬 Customers', '📝 Quotations', '⚙️ Settings', '❓ Support'],
  analytics: ['📈 Tips to Improve', '📊 Detailed Report', '🔙 Back to Menu'],
  quotations: ['✨ Create Quotation', '📋 View Templates', '🔙 Back to Menu'],
  profile: ['✅ Complete Now', '⏰ Remind Me Later', '🔙 Back to Menu'],
  settings: ['🔔 Notifications', '🔒 Privacy', '🔙 Back to Menu'],
  support: ['💬 Contact Support', '📚 Documentation', '🔙 Back to Menu']
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
  const [aiChatId, setAiChatId] = useState<string | null>(null)
  const [showQuickReplies, setShowQuickReplies] = useState<string[]>(QUICK_REPLIES.main)
  const [chatFilter, setChatFilter] = useState<'all' | 'customers' | 'assistant'>('all')
  
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

  // Auth guard and initialize AI assistant
  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          try {
            const storeDocRef = doc(db, 'stores', user.uid)
            const storeDoc = await getDoc(storeDocRef)
            
            if (storeDoc.exists()) {
              const data = storeDoc.data()
              const status = data.status
              if (['rejected', 'suspended', 'pending_review'].includes(status || '')) {
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

  // Initialize AI Assistant chat
  const initializeAIAssistant = async (storeId: string, storeData: any) => {
    try {
      // Check if AI assistant chat exists
      const aiChatsQuery = query(
        collection(db, 'storeChats'),
        where('storeId', '==', storeId),
        where('isAIAssistant', '==', true)
      )
      
      const snapshot = await new Promise<any>((resolve) => {
        const unsubscribe = onSnapshot(aiChatsQuery, (snap) => {
          unsubscribe()
          resolve(snap)
        })
      })

      if (snapshot.empty) {
        // Create AI assistant chat
        const aiChatRef = await addDoc(collection(db, 'storeChats'), {
          storeId: storeId,
          customerName: '🤖 AI Assistant',
          lastMessage: 'Welcome! How can I help you today?',
          timestamp: serverTimestamp(),
          isAIAssistant: true,
          unreadByStoreCount: 0
        })

        // Add welcome message
        await addDoc(collection(db, 'storeChats', aiChatRef.id, 'messages'), {
          text: AI_RESPONSES.welcome(storeData.ownerName || 'there'),
          sender: 'assistant',
          timestamp: serverTimestamp()
        })

        // Add services message
        await addDoc(collection(db, 'storeChats', aiChatRef.id, 'messages'), {
          text: AI_RESPONSES.services,
          sender: 'assistant',
          timestamp: serverTimestamp(),
          options: QUICK_REPLIES.main
        })

        setAiChatId(aiChatRef.id)
      } else {
        setAiChatId(snapshot.docs[0].id)
      }
    } catch (error) {
      console.error('Error initializing AI assistant:', error)
    }
  }

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
    
    if (isMobile) {
      setShowChatList(false)
    }

    // Set quick replies based on chat type
    if (chatData.isAIAssistant) {
      setShowQuickReplies(QUICK_REPLIES.main)
    } else {
      setShowQuickReplies([])
    }

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

  const handleAIResponse = async (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase()
    let response = AI_RESPONSES.default
    let newQuickReplies = QUICK_REPLIES.main

    // Determine response based on user input
    if (lowerMessage.includes('analytic') || lowerMessage.includes('📊')) {
      response = AI_RESPONSES.analytics
      newQuickReplies = QUICK_REPLIES.analytics
    } else if (lowerMessage.includes('quotation') || lowerMessage.includes('📝') || lowerMessage.includes('quote')) {
      response = AI_RESPONSES.quotations
      newQuickReplies = QUICK_REPLIES.quotations
    } else if (lowerMessage.includes('profile') || lowerMessage.includes('📋') || lowerMessage.includes('complete')) {
      response = AI_RESPONSES.profile
      newQuickReplies = QUICK_REPLIES.profile
    } else if (lowerMessage.includes('setting') || lowerMessage.includes('⚙️')) {
      response = AI_RESPONSES.settings
      newQuickReplies = QUICK_REPLIES.settings
    } else if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('❓') || lowerMessage.includes('faq')) {
      response = AI_RESPONSES.support
      newQuickReplies = QUICK_REPLIES.support
    } else if (lowerMessage.includes('customer') || lowerMessage.includes('💬')) {
      response = `💬 Customer Management:\n\nYou can view and respond to customer inquiries in real-time. All customer conversations will appear in your chat list.\n\nWould you like tips on providing great customer service?`
      newQuickReplies = QUICK_REPLIES.main
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      response = AI_RESPONSES.thanks
      newQuickReplies = QUICK_REPLIES.main
    } else if (lowerMessage.includes('back') || lowerMessage.includes('menu') || lowerMessage.includes('🔙')) {
      response = AI_RESPONSES.services
      newQuickReplies = QUICK_REPLIES.main
    }

    setShowQuickReplies(newQuickReplies)

    // Add AI response
    await addDoc(collection(db, 'storeChats', currentChatId!, 'messages'), {
      text: response,
      sender: 'assistant',
      timestamp: serverTimestamp(),
      options: newQuickReplies
    })

    await updateDoc(doc(db, 'storeChats', currentChatId!), {
      lastMessage: response.substring(0, 50) + '...',
      timestamp: serverTimestamp()
    })
  }

  const sendMessage = async (text?: string) => {
    const messageText = text || messageInput.trim()
    if (!messageText || !currentChatId || !db) return

    setMessageInput('')

    try {
      // Add user message
      await addDoc(collection(db, 'storeChats', currentChatId, 'messages'), {
        text: messageText,
        sender: currentChatData?.isAIAssistant ? 'store' : 'store',
        timestamp: serverTimestamp()
      })

      await updateDoc(doc(db, 'storeChats', currentChatId), {
        lastMessage: messageText,
        timestamp: serverTimestamp(),
        unreadByCustomerCount: increment(1),
        lastSender: 'store'
      })

      // If AI assistant, generate response
      if (currentChatData?.isAIAssistant) {
        setTimeout(() => handleAIResponse(messageText), 1000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessageInput(messageText)
    }
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
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

  const filteredChats = chats.filter(chat => {
    const matchesSearch = (chat.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      chatFilter === 'all' ? true :
      chatFilter === 'assistant' ? chat.isAIAssistant :
      !chat.isAIAssistant
    return matchesSearch && matchesFilter
  })

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
            {!showChatList && currentChatData ? currentChatData.customerName : 'Conversations'}
          </h1>
          {!showChatList && (
            <button onClick={backToChatList} className="text-blue-600">
              <i className="fas fa-arrow-left mr-2"></i> Back
            </button>
          )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block p-6 bg-white border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Customer Conversations</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Welcome, {storeData?.ownerName || 'Seller'}!</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-white m-4 md:m-6 rounded-lg shadow-md overflow-hidden flex">
            {/* Chat List */}
            <div className={`${showChatList || !isMobile ? 'flex' : 'hidden'} w-full md:w-1/3 border-r border-gray-200 flex-col`}>
              {/* Search and Filter */}
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
                
                {/* Filter Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChatFilter('all')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      chatFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter('assistant')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      chatFilter === 'assistant' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🤖 AI
                  </button>
                  <button
                    onClick={() => setChatFilter('customers')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      chatFilter === 'customers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👥 Customers
                  </button>
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
                        chat.id === currentChatId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      } ${chat.isAIAssistant ? 'bg-gradient-to-r from-purple-50 to-blue-50' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={`https://ui-avatars.com/api/?name=${chat.customerName || 'C'}&background=${chat.isAIAssistant ? '6366f1' : 'random'}`}
                          alt="User"
                          className="w-12 h-12 rounded-full mr-3"
                        />
                        {chat.isAIAssistant && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <i className="fas fa-robot text-white text-xs"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-800 truncate flex items-center">
                            {chat.customerName || 'Customer'}
                            {chat.isAIAssistant && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">AI</span>}
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
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <i className="fas fa-comments text-6xl mb-4"></i>
                  <p className="text-xl mb-4">Select a conversation to begin</p>
                  <p className="text-sm text-center text-gray-500 max-w-md">
                    Start chatting with the AI Assistant for help, or wait for customer inquiries to appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 border-b flex items-center ${
                    currentChatData?.isAIAssistant ? 'bg-gradient-to-r from-purple-50 to-blue-50' : 'bg-gray-50'
                  }`}>
                    {isMobile && (
                      <button onClick={backToChatList} className="mr-3 text-blue-600">
                        <i className="fas fa-arrow-left"></i>
                      </button>
                    )}
                    <div className="relative">
                      <img
                        src={`https://ui-avatars.com/api/?name=${currentChatData?.customerName || 'C'}&background=${currentChatData?.isAIAssistant ? '6366f1' : 'random'}`}
                        alt="User"
                        className="w-10 h-10 rounded-full mr-4"
                      />
                      {currentChatData?.isAIAssistant && (
                        <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                        {currentChatData?.customerName || 'Customer'}
                        {currentChatData?.isAIAssistant && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">AI Assistant</span>
                        )}
                      </h3>
                      {currentChatData?.isAIAssistant && (
                        <p className="text-xs text-gray-600">Always available to help</p>
                      )}
                    </div>
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
                          const isAssistant = message.sender === 'assistant'
                          
                          return (
                            <div key={message.id}>
                              <div
                                className={`flex mb-4 ${isStore ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] md:max-w-md px-4 py-3 rounded-xl ${
                                    isStore
                                      ? 'bg-blue-600 text-white rounded-br-none'
                                      : isAssistant
                                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-bl-none border border-purple-200'
                                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                                  }`}
                                >
                                  {isAssistant && (
                                    <div className="flex items-center mb-2">
                                      <i className="fas fa-robot text-purple-600 mr-2"></i>
                                      <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                                    </div>
                                  )}
                                  <p className="break-words whitespace-pre-line">{message.text}</p>
                                  <span
                                    className={`text-xs block mt-1 text-right ${
                                      isStore ? 'opacity-75' : 'text-gray-400'
                                    }`}
                                  >
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Quick Reply Options */}
                              {isAssistant && message.options && message.options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4 justify-start ml-4">
                                  {message.options.map((option, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleQuickReply(option)}
                                      className="px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm"
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Replies Bar (for AI Assistant) */}
                  {currentChatData?.isAIAssistant && showQuickReplies.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-purple-100">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Quick Actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {showQuickReplies.map((reply, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickReply(reply)}
                            className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full text-sm hover:bg-purple-50 hover:border-purple-300 transition-all"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={currentChatData?.isAIAssistant ? "Ask me anything..." : "Type your message here..."}
                        className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!messageInput.trim()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                    {currentChatData?.isAIAssistant && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        💡 Tip: Use quick actions above or type your question
                      </p>
                    )}
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
}'use client'

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