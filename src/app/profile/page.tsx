'use client'

import { useState } from 'react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    businessName: 'ABC Construction',
    ownerName: 'John Doe',
    businessType: 'Construction Services',
    email: 'john@abcconstruction.com',
    address: '123 Business Street, Mumbai, Maharashtra',
    phone: '9876543210',
    storeHours: [
      { day: 'Monday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Thursday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Friday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Saturday', hours: '10:00 AM - 4:00 PM' },
      { day: 'Sunday', hours: 'Closed' }
    ]
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 bg-gray-800 text-white flex flex-col overflow-hidden hover:w-64 transition-all duration-300 group">
        <div className="p-4 border-b border-gray-700 flex items-center">
          <i className="fas fa-store w-8 h-8 text-2xl"></i>
          <h1 className="text-2xl font-bold ml-2 hidden group-hover:block">Seller</h1>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          <a href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-tachometer-alt w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Overview</span>
          </a>
          <a href="/chats" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-comments w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Chats</span>
          </a>
          <a href="/quotations" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-file-invoice-dollar w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Quotations</span>
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg hover:bg-gray-600 transition-colors">
            <i className="fas fa-cog w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <a href="/profile" className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors mb-2">
            <i className="fas fa-user-circle w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Profile</span>
          </a>
          <button className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors">
            <i className="fas fa-sign-out-alt w-6 h-6 mr-3"></i>
            <span className="hidden group-hover:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Business Profile</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center"
          >
            <i className="fas fa-edit mr-2"></i> 
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </header>

        {/* Profile Content */}
        <div className="space-y-8">

          {/* Business Details */}
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="flex items-center mb-6">
              <img 
                src="https://placehold.co/80x80/E2E8F0/4A5568?text=Logo" 
                alt="Store Logo" 
                className="w-20 h-20 rounded-full mr-6"
              />
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({...profileData, businessName: e.target.value})}
                    className="text-2xl font-bold text-gray-800 border border-gray-300 rounded px-3 py-1 mb-1"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800">{profileData.businessName}</h3>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.businessType}
                    onChange={(e) => setProfileData({...profileData, businessType: e.target.value})}
                    className="text-gray-500 border border-gray-300 rounded px-3 py-1"
                  />
                ) : (
                  <p className="text-gray-500">{profileData.businessType}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              <p>
                <strong>Owner:</strong>{' '}
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.ownerName}
                    onChange={(e) => setProfileData({...profileData, ownerName: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 ml-2"
                  />
                ) : (
                  <span>{profileData.ownerName}</span>
                )}
              </p>
              <p>
                <strong>Email:</strong>{' '}
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 ml-2"
                  />
                ) : (
                  <span>{profileData.email}</span>
                )}
              </p>
              <p>
                <strong>Address:</strong>{' '}
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 ml-2 w-64"
                  />
                ) : (
                  <span>{profileData.address}</span>
                )}
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 ml-2"
                    maxLength={10}
                  />
                ) : (
                  <span>+91 {profileData.phone}</span>
                )}
              </p>
            </div>
          </div>

          {/* Store Timings */}
          <div className="bg-white p-8 rounded-lg shadow">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Store Hours</h4>
            <ul className="space-y-2 text-gray-600">
              {profileData.storeHours.map((schedule, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="font-medium">{schedule.day}</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={schedule.hours}
                      onChange={(e) => {
                        const newHours = [...profileData.storeHours]
                        newHours[index].hours = e.target.value
                        setProfileData({...profileData, storeHours: newHours})
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-right"
                    />
                  ) : (
                    <span>{schedule.hours}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Business Description */}
          <div className="bg-white p-8 rounded-lg shadow">
            <h4 className="text-xl font-bold text-gray-800 mb-4">About Business</h4>
            {isEditing ? (
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Describe your business services and expertise..."
              />
            ) : (
              <p className="text-gray-600 leading-relaxed">
                Professional construction services specializing in residential and commercial projects. 
                With over 10 years of experience, we deliver quality workmanship and timely project completion. 
                Our services include new construction, renovations, and interior finishing.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}