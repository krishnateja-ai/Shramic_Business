'use client'

import { useState } from 'react'

export default function HomePage() {
  const [activeStep, setActiveStep] = useState<'mobile' | 'otp'>('mobile')
  const [mobileNumber, setMobileNumber] = useState('')
  const [sentToNumber, setSentToNumber] = useState('')

  const handleSendOtp = () => {
    if (mobileNumber.length === 10) {
      setSentToNumber(mobileNumber)
      setActiveStep('otp')
    }
  }

  const handleVerifyOtp = () => {
    // OTP verification logic will be implemented later
    window.location.href = '/dashboard'
  }

  const handleChangeNumber = () => {
    setActiveStep('mobile')
    setMobileNumber('')
  }

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <i className="fas fa-store-alt text-4xl text-blue-600 mb-3"></i>
          <h1 className="text-3xl font-bold text-gray-900">Seller Portal</h1>
          <p className="text-gray-600 mt-2">Login or Register to continue.</p>
        </div>

        {/* Message Area */}
        <div id="messageArea" className="hidden p-3 mt-6 text-sm rounded-lg text-center" role="alert"></div>
        <div id="recaptcha-container" className="my-4"></div>

        {/* Auth Form */}
        <form className="mt-6">
          {/* Mobile Number Step */}
          <div className={`form-step ${activeStep === 'mobile' ? 'active' : 'hidden'}`}>
            <label htmlFor="mobileNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                +91
              </span>
              <input
                type="tel"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 border border-gray-300 text-gray-900 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10-digit mobile number"
                required
                maxLength={10}
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={mobileNumber.length !== 10}
              className="w-full mt-6 py-3 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 transition-all"
            >
              Send OTP
            </button>
          </div>

          {/* OTP Step */}
          <div className={`form-step ${activeStep === 'otp' ? 'active' : 'hidden'}`}>
            <p className="text-center text-gray-600">
              Enter the code sent to <strong className="text-gray-800">{sentToNumber}</strong>
            </p>
            <div className="flex justify-center gap-2 my-4">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  className="otp-input w-12 h-12 text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  maxLength={1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full mt-4 py-3 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
            >
              Verify & Proceed
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={handleChangeNumber}
              >
                Change Number
              </button>
            </div>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">New to the portal?</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Register Button */}
        <a
          href="/register"
          className="w-full block text-center py-3 px-5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all"
        >
          Sign Up / Register
        </a>
      </div>

      <style jsx>{`
        .form-step {
          display: none;
        }
        .form-step.active {
          display: block;
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}