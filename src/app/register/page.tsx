'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const steps = [
    { number: 1, title: 'Business Info' },
    { number: 2, title: 'Location' },
    { number: 3, title: 'Services' },
    { number: 4, title: 'Documents' }
  ]

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <i className="fas fa-store-alt text-4xl text-blue-600 mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-900">Store Registration</h1>
          <p className="text-gray-600 mt-2">Business Partner Portal</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                ${currentStep > step.number ? 'bg-green-500 text-white' : 
                  currentStep === step.number ? 'bg-blue-600 text-white' : 
                  'bg-gray-300 text-gray-600'}
              `}>
                {currentStep > step.number ? <i className="fas fa-check text-xs"></i> : step.number}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">{step.title}</span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-4 transition-colors duration-300 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Business Info */}
          <div className={`${currentStep === 1 ? 'block animate-fadeIn' : 'hidden'}`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder=" "
                />
                <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200 peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1">
                  Business Name
                </label>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder=" "
                />
                <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200">Owner Name</label>
              </div>
              
              <div className="relative md:col-span-2">
                <input 
                  type="email" 
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder=" "
                />
                <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200">Email Address</label>
              </div>
              
              <div className="relative">
                <div className="flex">
                  <span className="px-4 py-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">+91</span>
                  <input 
                    type="tel" 
                    className="w-full p-4 border border-gray-300 rounded-r-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
              </div>
              
              <div className="relative">
                <select className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="">Business Type</option>
                  <option value="construction">Construction</option>
                  <option value="retail">Retail</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Location */}
          <div className={`${currentStep === 2 ? 'block animate-fadeIn' : 'hidden'}`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Location</h2>
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder=" "
                />
                <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200">Full Address</label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder=" "
                  />
                  <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200">City</label>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder=" "
                  />
                  <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200">State</label>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder=" "
                  />
                  <label className="absolute top-4 left-4 text-gray-500 pointer-events-none transition-all duration-200">Pincode</label>
                </div>
              </div>
              
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Map will be integrated here</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button 
              onClick={prevStep}
              className="bg-white text-gray-600 px-8 py-3 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentStep === 1}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Previous
            </button>
            
            <button 
              onClick={nextStep}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentStep === totalSteps ? 'Complete Registration' : 'Next'}
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}