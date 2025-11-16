'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged
} from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  getDoc
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

export default function LoginPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<'mobile' | 'otp'>('mobile')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const recaptchaRef = useRef<HTMLDivElement>(null)
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null)
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Check if user is already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Check if user has a valid store profile
          try {
            const storeDocRef = doc(db, 'stores', user.uid)
            const storeDoc = await getDoc(storeDocRef)
            
            if (storeDoc.exists()) {
              const status = storeDoc.data().status
              
              // Redirect based on status
              if (status === 'approved' || status === 'active') {
                router.push('/dashboard')
              } else if (status === 'pending_review') {
                showMessage('info', 'Your application is under review.')
              } else {
                showMessage('error', `Account status: ${status}. Please contact support.`)
              }
            }
          } catch (error) {
            console.error('Error checking user status:', error)
          }
        }
      })
      return () => unsubscribe()
    }
  }, [router])

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const initializeRecaptcha = () => {
    if (!recaptchaVerifier.current && recaptchaRef.current && auth) {
      try {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {}
        })
      } catch (error) {
        console.error('Recaptcha initialization error:', error)
      }
    }
  }

  const sendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      showMessage('error', 'Please enter a valid Indian mobile number')
      return
    }

    setLoading(true)
    const fullNumber = '+91' + phoneNumber

    try {
      // Check if user exists in stores collection
      const storesSnapshot = await getDoc(doc(db, 'stores', 'temp'))
      // Note: We can't query by phoneNumber directly without proper indexing
      // For now, we'll attempt login and handle errors

      initializeRecaptcha()
      if (!recaptchaVerifier.current) {
        showMessage('error', 'Recaptcha failed to initialize. Please refresh the page.')
        setLoading(false)
        return
      }

      const result = await signInWithPhoneNumber(auth, fullNumber, recaptchaVerifier.current)
      setConfirmationResult(result)
      setCountdown(60)
      showMessage('success', 'Verification code sent!')
      setActiveStep('otp')
    } catch (error: any) {
      console.error('OTP Error:', error)
      if (error.code === 'auth/too-many-requests') {
        showMessage('error', 'Too many requests. Please try again later.')
      } else {
        showMessage('error', error.message || 'Failed to send OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      showMessage('error', 'Please enter the 6-digit code')
      return
    }

    setLoading(true)
    try {
      if (!confirmationResult) {
        showMessage('error', 'Please request OTP first')
        return
      }
      
      const result = await confirmationResult.confirm(otpCode)
      
      if (result?.user) {
        // Check if user has a store profile
        const storeDocRef = doc(db, 'stores', result.user.uid)
        const storeDoc = await getDoc(storeDocRef)
        
        if (storeDoc.exists()) {
          const storeData = storeDoc.data()
          const status = storeData.status
          const profileCompleted = storeData.profileCompleted || 0
          
          if (status === 'approved' || status === 'active') {
            // Allow access regardless of profile completion
            if (profileCompleted < 100) {
              showMessage('success', 'Login successful! Please complete your profile.')
            } else {
              showMessage('success', 'Login successful! Redirecting...')
            }
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          } else if (status === 'pending_review') {
            showMessage('info', 'Your application is under review. You can access your dashboard once approved.')
          } else if (status === 'rejected' || status === 'suspended') {
            showMessage('error', `Your account is ${status}. Please contact support.`)
          }
        } else {
          // User verified phone but hasn't registered as a store
          showMessage('info', 'Please complete your registration.')
          setTimeout(() => {
            router.push('/register')
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error('Verification Error:', error)
      showMessage('error', 'Invalid verification code')
      setOtp(['', '', '', '', '', ''])
      otpInputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      setTimeout(() => verifyOTP(), 500)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      setTimeout(() => verifyOTP(), 500)
    }
  }

  const handleChangeNumber = () => {
    setActiveStep('mobile')
    setPhoneNumber('')
    setOtp(['', '', '', '', '', ''])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeStep === 'mobile') {
        sendOTP()
      } else {
        verifyOTP()
      }
    }
  }

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div ref={recaptchaRef}></div>

        <div className="text-center">
          <i className="fas fa-store-alt text-4xl text-blue-600 mb-3"></i>
          <h1 className="text-3xl font-bold text-gray-900">Seller Portal</h1>
          <p className="text-gray-600 mt-2">Login to continue</p>
        </div>

        {/* Alert Message */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 
            message.type === 'info' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`} role="alert">
            <div className="flex items-center text-sm">
              {message.type === 'success' && <i className="fas fa-check-circle mr-2"></i>}
              {message.type === 'error' && <i className="fas fa-exclamation-circle mr-2"></i>}
              {message.type === 'info' && <i className="fas fa-info-circle mr-2"></i>}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="mt-6">
          {/* Mobile Number Step */}
          <div className={activeStep === 'mobile' ? 'block' : 'hidden'}>
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                +91
              </span>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyPress={handleKeyPress}
                className="w-full p-2.5 border border-gray-300 text-gray-900 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="10-digit mobile number"
                required
                maxLength={10}
              />
            </div>
            <button
              onClick={sendOTP}
              disabled={phoneNumber.length !== 10 || loading}
              className="w-full mt-6 py-3 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span> Sending...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>

          {/* OTP Step */}
          <div className={activeStep === 'otp' ? 'block' : 'hidden'}>
            <p className="text-center text-gray-600 mb-4">
              Enter the code sent to <strong className="text-gray-800">+91 {phoneNumber}</strong>
            </p>
            <div className="flex justify-center gap-2 my-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => {
                    otpInputsRef.current[index] = el
                  }}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  maxLength={1}
                />
              ))}
            </div>
            <button
              onClick={verifyOTP}
              disabled={loading}
              className="w-full mt-4 py-3 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Verifying...' : 'Verify & Proceed'}
            </button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
              <button
                onClick={sendOTP}
                disabled={countdown > 0}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={handleChangeNumber}
                className="text-sm text-blue-600 hover:underline"
              >
                <i className="fas fa-arrow-left mr-1"></i> Change Number
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">New to the portal?</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <a
          href="/register"
          className="w-full block text-center py-3 px-5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all"
        >
          <i className="fas fa-user-plus mr-2"></i> Sign Up / Register
        </a>
      </div>
    </div>
  )
}