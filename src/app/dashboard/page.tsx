'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

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

interface StoreData {
  businessName?: string
  ownerName?: string
  shopAddress?: string
  businessType?: string
  shopCategory?: string
  businessEmail?: string
  gstNumber?: string
  status?: string
  [key: string]: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [profileProgress, setProfileProgress] = useState(0)
  const [pendingTasks, setPendingTasks] = useState<string[]>([])
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          try {
            const storeDocRef = doc(db, 'stores', user.uid)
            const storeDoc = await getDoc(storeDocRef)
            
            if (storeDoc.exists()) {
              const data = storeDoc.data() as StoreData
              const status = data.status

              // Allow approved/active users regardless of profile completion
              if (status === 'approved' || status === 'active') {
                setStoreData(data)
                calculateProfileCompletion(data)
                setLoading(false)
              } else if (status === 'pending_review') {
                // Pending users cannot access dashboard
                alert('Your application is under review. Please wait for approval.')
                await signOut(auth)
                router.push('/login')
              } else {
                // Rejected/suspended users cannot access
                throw new Error('Invalid account status.')
              }
            } else {
              throw new Error('Store profile not found.')
            }
          } catch (error: any) {
            console.error('Auth Guard Error:', error.message)
            await signOut(auth)
            router.push('/login')
          }
        } else {
          console.log('No user found, redirecting to login.')
          router.push('/login')
        }
      })

      return () => unsubscribe()
    }
  }, [router])

  const calculateProfileCompletion = (data: StoreData) => {
    const requiredFields = [
      { key: 'businessName', label: 'Add Business Name' },
      { key: 'shopAddress', label: 'Add Business Address' },
      { key: 'businessType', label: 'Select Business Type' },
      { key: 'ownerName', label: 'Add Owner Name' },
      { key: 'shopCategory', label: 'Select Shop Category' },
      { key: 'businessEmail', label: 'Add Business Email' },
      { key: 'gstNumber', label: 'Add GST Number' },
    ]

    let completedCount = 0
    const pending: string[] = []

    requiredFields.forEach(field => {
      if (data[field.key]) {
        completedCount++
      } else {
        pending.push(field.label)
      }
    })

    const percentage = Math.round((completedCount / requiredFields.length) * 100)
    setProfileProgress(percentage)
    setPendingTasks(pending)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">Verifying your session...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`${sidebarExpanded ? 'w-64' : 'w-16'} bg-gray-800 text-white flex-shrink-0 flex flex-col transition-all duration-300`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700 px-4">
          <i className="fas fa-store-alt mr-3"></i>
          {sidebarExpanded && <span>Seller Central</span>}
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <a 
            href="/dashboard" 
            className="flex items-center p-3 rounded-lg bg-gray-900 text-white transition-colors"
          >
            <i className="fas fa-tachometer-alt w-6 mr-3"></i>
            {sidebarExpanded && <span>Overview</span>}
          </a>
          <a 
            href="/chats" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-comments w-6 mr-3"></i>
            {sidebarExpanded && <span>Store Chats</span>}
          </a>
          <a 
            href="/quotations" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-file-invoice-dollar w-6 mr-3"></i>
            {sidebarExpanded && <span>Quotations</span>}
          </a>
          <a 
            href="/settings" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
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
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="text-gray-600">
            Welcome, {storeData?.ownerName || 'Seller'}!
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-gray-500 font-medium">Impressions</h4>
            <p className="text-3xl font-bold mt-2">1,402</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600">↑ 12%</span>
              <span className="text-gray-500 ml-2">vs last week</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-gray-500 font-medium">Profile Views</h4>
            <p className="text-3xl font-bold mt-2">356</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600">↑ 8%</span>
              <span className="text-gray-500 ml-2">vs last week</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-gray-500 font-medium">New Leads</h4>
            <p className="text-3xl font-bold mt-2">23</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600">↑ 5%</span>
              <span className="text-gray-500 ml-2">vs last week</span>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Your Profile</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${profileProgress}%` }}
            ></div>
          </div>
          <p className="text-right text-sm mt-2 font-semibold text-gray-700">
            {profileProgress}% Complete
          </p>
          
          {pendingTasks.length > 0 ? (
            <div className="mt-4 text-sm text-gray-600 border-t pt-4">
              <p className="font-medium mb-2">Pending tasks to improve visibility:</p>
              <ul className="list-disc list-inside space-y-1">
                {pendingTasks.map((task, index) => (
                  <li key={index} className="text-red-600">{task}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 text-sm border-t pt-4">
              <p className="text-green-600 font-semibold">
                <i className="fas fa-check-circle mr-2"></i>
                Your profile is complete! Well done.
              </p>
            </div>
          )}
        </div>

        {/* Store Information Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Store Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="font-medium">{storeData?.businessName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Business Type</p>
              <p className="font-medium">{storeData?.businessType || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{storeData?.shopCategory || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">GST Number</p>
              <p className="font-medium">{storeData?.gstNumber || 'Not set'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{storeData?.shopAddress || storeData?.address || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-eye text-blue-600 mr-3"></i>
                  <span className="text-sm">Profile viewed by customer</span>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-comment text-green-600 mr-3"></i>
                  <span className="text-sm">New chat message</span>
                </div>
                <span className="text-xs text-gray-500">5 hours ago</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-file-invoice text-purple-600 mr-3"></i>
                  <span className="text-sm">Quotation request received</span>
                </div>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <a 
                href="/quotations" 
                className="p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <i className="fas fa-file-invoice-dollar text-blue-600 text-2xl mb-2"></i>
                <p className="text-sm font-medium">Create Quote</p>
              </a>
              
              <a 
                href="/chats" 
                className="p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
              >
                <i className="fas fa-comments text-green-600 text-2xl mb-2"></i>
                <p className="text-sm font-medium">View Chats</p>
              </a>
              
              <a 
                href="/profile" 
                className="p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <i className="fas fa-user-edit text-purple-600 text-2xl mb-2"></i>
                <p className="text-sm font-medium">Edit Profile</p>
              </a>
              
              <a 
                href="/settings" 
                className="p-4 text-center bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
              >
                <i className="fas fa-cog text-orange-600 text-2xl mb-2"></i>
                <p className="text-sm font-medium">Settings</p>
              </a>
            </div>
          </div>
        </div>

        {/* Impression Analytics Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Impression Analytics (Last 7 Days)</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center text-gray-500">
              <i className="fas fa-chart-line text-4xl mb-2"></i>
              <p>Chart visualization coming soon</p>
              <p className="text-sm mt-1">Install chart.js or recharts for analytics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}