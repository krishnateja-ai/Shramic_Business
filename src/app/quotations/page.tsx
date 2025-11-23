'use client'

import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore'
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'

// Type Definitions
interface QuotationItem {
  name: string
  quantity: string | number
}

interface QuotationData {
  id: string
  storeId: string
  customerId: string
  customerName: string
  items?: QuotationItem[]
  mediaUrls?: string[]
  sellerMediaUrls?: string[]
  notes?: string
  quotationAmount?: number
  status: 'pending' | 'responded' | 'approved' | 'rejected'
  timestamp: Timestamp
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
const storage = getStorage(app)

// Mock data for testing
const MOCK_QUOTATIONS: QuotationData[] = [
  {
    id: 'QT-001',
    storeId: 'mock-store-id',
    customerId: 'customer-1',
    customerName: 'Rajesh Kumar',
    items: [
      { name: 'Construction Materials', quantity: '100 units' },
      { name: 'Labor Services', quantity: '10 workers' }
    ],
    notes: 'Need urgent delivery by next week. Please include transportation costs.',
    quotationAmount: undefined,
    status: 'pending',
    timestamp: Timestamp.fromDate(new Date('2024-01-15'))
  },
  {
    id: 'QT-002',
    storeId: 'mock-store-id',
    customerId: 'customer-2',
    customerName: 'Priya Sharma',
    items: [
      { name: 'Electrical Supplies', quantity: '50 pieces' },
      { name: 'Installation Service', quantity: '1 project' }
    ],
    notes: 'Looking for quality materials with warranty.',
    quotationAmount: 18500,
    status: 'approved',
    timestamp: Timestamp.fromDate(new Date('2024-01-14'))
  },
  {
    id: 'QT-003',
    storeId: 'mock-store-id',
    customerId: 'customer-3',
    customerName: 'Business Corp',
    items: [
      { name: 'Office Furniture', quantity: '25 sets' },
      { name: 'Assembly Service', quantity: 'Full setup' }
    ],
    notes: 'Corporate order for new office setup. Need competitive pricing.',
    quotationAmount: 42000,
    status: 'rejected',
    timestamp: Timestamp.fromDate(new Date('2024-01-13'))
  }
]

export default function QuotationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)
  const [quotations, setQuotations] = useState<QuotationData[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [quotationAmount, setQuotationAmount] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [useMockData, setUseMockData] = useState(true)

  // Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const storeDocRef = doc(db, "stores", user.uid)
          const storeDoc = await (await import('firebase/firestore')).getDoc(storeDocRef)
          
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
          console.error("Auth Guard Error:", error)
          // For testing, allow mock data even without auth
          setCurrentStoreId('mock-store-id')
          setIsLoading(false)
        }
      } else {
        // For testing, allow mock data even without auth
        setCurrentStoreId('mock-store-id')
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch Quotations (with fallback to mock data)
  useEffect(() => {
    if (!currentStoreId) return

    // If using mock data, set it immediately
    if (useMockData || currentStoreId === 'mock-store-id') {
      setQuotations(MOCK_QUOTATIONS)
      setIsLoading(false)
      return
    }

    // Otherwise fetch from Firebase
    const quotationsRef = collection(db, "store_quotations")
    const q = query(quotationsRef, where("storeId", "==", currentStoreId))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quotationsList: QuotationData[] = []
      querySnapshot.forEach((docSnap) => {
        quotationsList.push({ id: docSnap.id, ...docSnap.data() } as QuotationData)
      })
      
      // If no data from Firebase, use mock data
      if (quotationsList.length === 0) {
        setQuotations(MOCK_QUOTATIONS)
      } else {
        quotationsList.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
        setQuotations(quotationsList)
      }
      setIsLoading(false)
    }, (error) => {
      console.error("Error fetching quotations:", error)
      // On error, use mock data
      setQuotations(MOCK_QUOTATIONS)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [currentStoreId, useMockData])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error', error)
    }
  }

  const openModal = (quotation: QuotationData) => {
    setSelectedQuotation(quotation)
    setQuotationAmount(quotation.quotationAmount?.toString() || '')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedQuotation(null)
    setQuotationAmount('')
    setSelectedFiles([])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const uploadFiles = async (quotationId: string, files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}-${file.name}`
      const fileRef = ref(storage, `quotation_media/${quotationId}/seller_response/${fileName}`)
      await uploadBytes(fileRef, file)
      return getDownloadURL(fileRef)
    })
    return Promise.all(uploadPromises)
  }

  const handleSubmitQuote = async () => {
    if (!selectedQuotation || !quotationAmount) return

    const amount = parseFloat(quotationAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    setIsSubmitting(true)
    try {
      // For mock data, just update locally
      if (useMockData || currentStoreId === 'mock-store-id') {
        setQuotations(prevQuotations => 
          prevQuotations.map(q => 
            q.id === selectedQuotation.id 
              ? { ...q, quotationAmount: amount, status: 'responded' as const }
              : q
          )
        )
        alert('Quote sent successfully! (Demo mode)')
        closeModal()
        setIsSubmitting(false)
        return
      }

      // For real data, upload to Firebase
      const newUrls = selectedFiles.length > 0 
        ? await uploadFiles(selectedQuotation.id, selectedFiles)
        : []
      
      const existingUrls = selectedQuotation.sellerMediaUrls || []
      const quotationRef = doc(db, "store_quotations", selectedQuotation.id)
      
      await updateDoc(quotationRef, {
        quotationAmount: amount,
        status: "responded",
        sellerMediaUrls: [...existingUrls, ...newUrls]
      })

      closeModal()
    } catch (error) {
      console.error("Error updating quotation:", error)
      alert('Failed to send the quote. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const stats = {
    total: quotations.length,
    pending: quotations.filter(q => q.status === 'pending').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    responded: quotations.filter(q => q.status === 'responded').length
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">Loading quotations...</p>
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

      {/* Sidebar */}
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
          <a href="/chats" className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
            <i className="fas fa-comments w-6 mr-3"></i>
            <span>Store Chats</span>
          </a>
          <a href="/quotations" className="flex items-center p-3 rounded-lg bg-gray-900 text-white transition-colors">
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
        {/* Header */}
        <header className="flex justify-between items-center p-4 lg:p-6 bg-white shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-600 hover:text-gray-800"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Received Quotations</h1>
          </div>
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">Demo Mode</span>
            <button
              onClick={() => setUseMockData(!useMockData)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useMockData ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useMockData ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 p-4 lg:p-6">
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
                <i className="fas fa-file-invoice text-blue-600 text-lg lg:text-xl"></i>
              </div>
              <div className="ml-3 lg:ml-4">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-600">Total</h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-yellow-100 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-lg lg:text-xl"></i>
              </div>
              <div className="ml-3 lg:ml-4">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-600">Pending</h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
                <i className="fas fa-reply text-blue-600 text-lg lg:text-xl"></i>
              </div>
              <div className="ml-3 lg:ml-4">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-600">Responded</h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.responded}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
                <i className="fas fa-check-circle text-green-600 text-lg lg:text-xl"></i>
              </div>
              <div className="ml-3 lg:ml-4">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-600">Approved</h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="flex-1 m-4 lg:m-6 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 lg:px-6 py-3">Customer</th>
                  <th className="px-4 lg:px-6 py-3 hidden sm:table-cell">Date</th>
                  <th className="px-4 lg:px-6 py-3">Amount</th>
                  <th className="px-4 lg:px-6 py-3 hidden md:table-cell">Status</th>
                  <th className="px-4 lg:px-6 py-3">Actions</th>
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
                  quotations.map((quotation) => (
                    <tr key={quotation.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 font-medium text-gray-900">
                        {quotation.customerName || 'N/A'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                        {formatDate(quotation.timestamp)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 font-semibold">
                        {quotation.quotationAmount 
                          ? `₹${quotation.quotationAmount.toLocaleString('en-IN')}`
                          : <span className="text-gray-400 text-xs">Not Quoted</span>
                        }
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(quotation.status)}`}>
                          {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <button 
                          onClick={() => openModal(quotation)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <i className="fas fa-eye mr-1"></i>
                          <span className="hidden sm:inline">View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 lg:p-5 border-b">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-800">Quotation Details</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl lg:text-2xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 lg:p-6 overflow-y-auto space-y-4 lg:space-y-6 flex-1">
              {/* Customer Info */}
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Customer</h4>
                <p className="text-gray-600">{selectedQuotation.customerName || 'N/A'}</p>
              </div>

              {/* Items */}
              {selectedQuotation.items && selectedQuotation.items.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Requested Items</h4>
                  <div className="space-y-2">
                    {selectedQuotation.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="text-gray-600">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Media */}
              {selectedQuotation.mediaUrls && selectedQuotation.mediaUrls.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Customer's Attached Files</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
                    {selectedQuotation.mediaUrls.map((url, index) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative block p-2 border rounded-lg hover:bg-gray-100 group"
                      >
                        {/\.(jpeg|jpg|gif|png|webp)$/i.test(url) ? (
                          <img src={url} alt="Attachment" className="w-full h-20 lg:h-24 object-cover rounded-md" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-20 lg:h-24">
                            <i className="fas fa-file-alt text-2xl lg:text-3xl text-blue-500 mb-2"></i>
                            <span className="text-xs text-center text-gray-600">View File</span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller Media */}
              {selectedQuotation.sellerMediaUrls && selectedQuotation.sellerMediaUrls.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Your Sent Files</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
                    {selectedQuotation.sellerMediaUrls.map((url, index) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative block p-2 border rounded-lg hover:bg-gray-100"
                      >
                        {/\.(jpeg|jpg|gif|png|webp)$/i.test(url) ? (
                          <img src={url} alt="Sent file" className="w-full h-20 lg:h-24 object-cover rounded-md" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-20 lg:h-24">
                            <i className="fas fa-file-alt text-2xl lg:text-3xl text-blue-500 mb-2"></i>
                            <span className="text-xs text-center text-gray-600">View File</span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedQuotation.notes && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Customer Notes</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{selectedQuotation.notes}</p>
                </div>
              )}

              {/* Response Form */}
              <div className="border-t pt-4 lg:pt-6">
                <h4 className="font-bold text-gray-700 mb-4">Send Your Quote</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Total Amount (₹)
                    </label>
                    <input 
                      type="number" 
                      value={quotationAmount}
                      onChange={(e) => setQuotationAmount(e.target.value)}
                      placeholder="e.g., 15000"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the total price for all items requested.</p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Attach Files (Optional)
                    </label>
                    <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-block">
                      <i className="fas fa-upload mr-2"></i> Choose Files
                      <input 
                        type="file" 
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative p-2 border rounded-lg">
                            <p className="text-xs text-gray-700 truncate">{file.name}</p>
                            <button 
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center p-4 lg:p-5 border-t bg-gray-50">
              <button 
                onClick={handleSubmitQuote}
                disabled={isSubmitting || !quotationAmount}
                className="bg-green-600 text-white font-bold py-2 px-4 lg:px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Response
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}