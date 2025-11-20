'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
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
} from 'firebase/firestore';
// Removed date-fns dependency - using native JS formatting

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYEG2XdbuQlGflMwppjtj54ur4jKs89-A",
  authDomain: "kaamon6363.firebaseapp.com",
  projectId: "kaamon6363",
  storageBucket: "kaamon6363.firebasestorage.app",
  messagingSenderId: "582122881331",
  appId: "1:582122881331:web:8fac47d3e8646e56a47e46",
  measurementId: "G-7GFJK5G724"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface Chat {
  id: string;
  customerName: string;
  lastMessage?: string;
  timestamp?: Timestamp;
  unreadByStoreCount?: number;
  unreadByCustomerCount?: number;
  lastSender?: string;
  isAIAssistant?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'store' | 'customer' | 'assistant';
  timestamp: Timestamp;
  options?: string[];
}

const AI_RESPONSES = {
  welcome: (name: string) => `Hello ${name}! 👋 Welcome to your Business Assistant.`,
  services: `I can help you with:\n\n1. 📊 Analytics\n2. 💬 Customers\n3. 📝 Quotations\n4. ⚙️ Settings\n5. ❓ Support`,
  analytics: `📊 Your store is performing well!\nTotal Impressions: 1,402 (+12%)\nRevenue: ₹48,920 (+18%)`,
  default: `I'm here to help! Ask me about analytics, customers, quotations, or settings.`
};

const QUICK_REPLIES = ['📊 Analytics', '💬 Customers', '📝 Quotations', '⚙️ Settings', '❓ Support'];

export default function ChatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('Seller');

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowChatList(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const storeDoc = await getDoc(doc(db, 'stores', user.uid));
        if (!storeDoc.exists()) {
          throw new Error('Store profile not found.');
        }
        
        const data = storeDoc.data();
        if (['rejected', 'suspended', 'pending_review'].includes(data?.status || '')) {
          throw new Error('Invalid account status.');
        }

        setUser(user);
        setStoreId(user.uid);
        setStoreName(data?.ownerName || data?.businessName || 'Seller');
        await ensureAIAssistantExists(user.uid, data?.ownerName || 'there');
        setLoading(false);
      } catch (err) {
        console.error('Auth Guard Error:', err);
        await signOut(auth);
        router.push('/login');
      }
    });

    return unsubscribe;
  }, [router]);

  // Ensure AI Assistant Chat Exists
  const ensureAIAssistantExists = async (storeId: string, ownerName: string) => {
    const q = query(
      collection(db, 'storeChats'),
      where('storeId', '==', storeId),
      where('isAIAssistant', '==', true)
    );

    const snapshot = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        unsub();
        resolve(snap);
      });
    });

    if (snapshot.empty) {
      const chatRef = await addDoc(collection(db, 'storeChats'), {
        storeId,
        customerName: '🤖 AI Assistant',
        lastMessage: 'Welcome!',
        timestamp: serverTimestamp(),
        unreadByStoreCount: 0,
        unreadByCustomerCount: 0,
        lastSender: 'assistant',
        isAIAssistant: true
      });

      await addDoc(collection(db, 'storeChats', chatRef.id, 'messages'), {
        text: AI_RESPONSES.welcome(ownerName),
        sender: 'assistant',
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, 'storeChats', chatRef.id, 'messages'), {
        text: AI_RESPONSES.services,
        sender: 'assistant',
        timestamp: serverTimestamp(),
        options: QUICK_REPLIES
      });
    }
  };

  // Load Chats
  useEffect(() => {
    if (!storeId) return;

    const q = query(
      collection(db, 'storeChats'),
      where('storeId', '==', storeId),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Chat[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Chat));
      setChats(list);
    });

    return unsub;
  }, [storeId]);

  // Load Messages
  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'storeChats', currentChatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Message[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Message));
      setMessages(list);
      setTimeout(scrollToBottom, 100);
    });

    return unsub;
  }, [currentChatId]);

  const openChat = async (chat: Chat) => {
    setCurrentChatId(chat.id);
    setCurrentChat(chat);
    if (isMobile) setShowChatList(false);

    // Reset unread count when chat is opened
    if (chat.unreadByStoreCount && chat.unreadByStoreCount > 0) {
      try {
        await updateDoc(doc(db, 'storeChats', chat.id), { 
          unreadByStoreCount: 0 
        });
      } catch (error) {
        console.error("Error clearing unread count:", error);
      }
    }
  };

  const handleAIResponse = async (userText: string) => {
    if (!currentChatId) return;

    let response = AI_RESPONSES.default;
    const lower = userText.toLowerCase();

    if (lower.includes('analytic') || lower.includes('📊')) {
      response = AI_RESPONSES.analytics;
    } else if (lower.includes('hi') || lower.includes('hello')) {
      response = `Hey ${storeName.split(' ')[0]}! How can I assist you today? 😊`;
    }

    await addDoc(collection(db, 'storeChats', currentChatId, 'messages'), {
      text: response,
      sender: 'assistant',
      timestamp: serverTimestamp(),
      options: QUICK_REPLIES
    });

    await updateDoc(doc(db, 'storeChats', currentChatId), {
      lastMessage: response.split('\n')[0],
      timestamp: serverTimestamp(),
      lastSender: 'assistant'
    });
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !currentChatId || !storeId) return;

    setMessageInput('');

    try {
      // Add message to the subcollection
      await addDoc(collection(db, 'storeChats', currentChatId, 'messages'), {
        text,
        sender: 'store',
        timestamp: serverTimestamp()
      });

      // Update the parent chat document
      await updateDoc(doc(db, 'storeChats', currentChatId), {
        lastMessage: text,
        timestamp: serverTimestamp(),
        unreadByCustomerCount: increment(1),
        lastSender: 'store'
      });

      // Handle AI Assistant response
      if (currentChat?.isAIAssistant) {
        setTimeout(() => handleAIResponse(text), 800);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(text); // Restore message on error
    }
  };

  const formatTime = (ts?: Timestamp) => {
    if (!ts?.toDate) return '';
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const filteredChats = chats.filter((chat) =>
    chat.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <i className="fas fa-spinner fa-spin fa-3x text-blue-600"></i>
        <p className="mt-4 text-lg text-gray-600">Loading your chats...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col hidden md:flex">
          <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
            <i className="fas fa-store-alt mr-3"></i> Seller Central
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <a href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-gray-700">
              <i className="fas fa-tachometer-alt w-6 mr-3"></i> Overview
            </a>
            <a href="/chats" className="flex items-center p-3 rounded-lg bg-gray-900">
              <i className="fas fa-comments w-6 mr-3"></i> Store Chats
            </a>
            <a href="/quotations" className="flex items-center p-3 rounded-lg hover:bg-gray-700">
              <i className="fas fa-file-invoice-dollar w-6 mr-3"></i> Quotations
            </a>
            <a href="/settings" className="flex items-center p-3 rounded-lg hover:bg-gray-700">
              <i className="fas fa-cog w-6 mr-3"></i> Settings
            </a>
          </nav>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => signOut(auth).then(() => router.push('/login'))}
              className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-900"
            >
              <i className="fas fa-sign-out-alt w-6 mr-3"></i> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm p-6 border-b">
            <h1 className="text-3xl font-bold text-gray-800">Customer Conversations</h1>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Chat List */}
            {(showChatList || !isMobile) && (
              <div className={`${isMobile ? 'fixed inset-0 z-40 bg-white' : 'w-96'} border-r border-gray-200 flex flex-col`}>
                <div className="p-4 border-b bg-white">
                  <input
                    type="text"
                    placeholder="Search chats by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <ul className="flex-1 overflow-y-auto">
                  {filteredChats.length === 0 ? (
                    <p className="text-center text-gray-500 p-8">No conversations yet.</p>
                  ) : (
                    filteredChats.map((chat) => {
                      const unread = chat.unreadByStoreCount || 0;
                      return (
                        <li
                          key={chat.id}
                          onClick={() => openChat(chat)}
                          className={`flex p-4 border-b hover:bg-gray-50 cursor-pointer transition ${currentChatId === chat.id ? 'bg-indigo-50' : ''}`}
                        >
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chat.customerName)}&background=random`}
                            alt=""
                            className="w-12 h-12 rounded-full mr-3"
                          />
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                              <h4 className={`font-semibold text-gray-800 truncate ${unread > 0 ? 'font-bold' : ''}`}>
                                {chat.customerName}
                              </h4>
                              <span className="text-xs text-gray-400">{formatTime(chat.timestamp)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
                                {chat.lastMessage || '...'}
                              </p>
                              {unread > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 ml-2">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-gray-100">
              {currentChatId ? (
                <>
                  <div className="bg-white p-4 border-b flex items-center">
                    {isMobile && (
                      <button onClick={() => setShowChatList(true)} className="mr-4">
                        <i className="fas fa-arrow-left text-xl"></i>
                      </button>
                    )}
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentChat?.customerName || 'C')}&background=random`}
                      alt=""
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <h3 className="font-semibold text-lg text-gray-800">{currentChat?.customerName}</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex mb-4 ${msg.sender === 'store' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-xl ${
                            msg.sender === 'store'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span className="text-xs opacity-75 block text-right mt-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {currentChat?.isAIAssistant && messages[messages.length - 1]?.sender === 'assistant' && (
                    <div className="px-6 pb-2 flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => setMessageInput(reply)}
                          className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="bg-white p-4 border-t">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="Type your message here..."
                        className="w-full p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <i className="fas fa-comments fa-5x mb-4"></i>
                    <p className="text-xl">Select a conversation to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}