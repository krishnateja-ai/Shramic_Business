'use client'

import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'

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
let storage: any

if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [applicationId, setApplicationId] = useState('')
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    businessEmail: '',
    businessType: '',
    shopCategory: '',
    numEmployees: '',
    numBranches: '1',
    gstNumber: '',
    experienceYears: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    agreeTerms: false,
    verifyInformation: false,
    agreeMarketing: false
  })

  const [files, setFiles] = useState({
    businessLicense: null as File | null,
    storeFront: null as File | null,
    ownerIdProof: null as File | null,
    bankDetails: null as File | null
  })

  const recaptchaRef = useRef<HTMLDivElement>(null)
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null)
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  const totalSteps = 6
  const steps = [
    { number: 1, title: 'Phone', icon: 'fa-mobile-alt' },
    { number: 2, title: 'OTP', icon: 'fa-shield-alt' },
    { number: 3, title: 'Business', icon: 'fa-building' },
    { number: 4, title: 'Documents', icon: 'fa-upload' },
    { number: 5, title: 'Review', icon: 'fa-check-circle' }
  ]

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && user.phoneNumber) {
          setVerifiedPhone(user.phoneNumber)
          
          // Check if user is already registered
          try {
            const storeDocRef = doc(db, 'stores', user.uid)
            const storeDoc = await getDoc(storeDocRef)
            
            if (storeDoc.exists()) {
              const storeData = storeDoc.data()
              const status = storeData.status
              
              // If registration is complete and approved, redirect to dashboard
              if (status === 'approved' || status === 'active') {
                showMessage('success', 'Welcome back! Redirecting to dashboard...')
                setTimeout(() => {
                  window.location.href = '/dashboard'
                }, 1500)
                return
              }
              
              // If pending review, show appropriate message
              if (status === 'pending_review') {
                showMessage('info', 'Your application is under review. Please wait for approval.')
                setTimeout(async () => {
                  await signOut(auth)
                  window.location.href = '/login'
                }, 3000)
                return
              }
              
              // If rejected or suspended
              if (status === 'rejected' || status === 'suspended') {
                showMessage('error', `Your account is ${status}. Please contact support.`)
                setTimeout(async () => {
                  await signOut(auth)
                  window.location.href = '/login'
                }, 3000)
                return
              }
              
              // If registration incomplete, restore data and continue
              if (storeData.profileCompleted && storeData.profileCompleted < 100) {
                showMessage('info', 'Welcome back! Continue your registration.')
                // Restore form data from Firestore
                setFormData({
                  businessName: storeData.businessName || '',
                  ownerName: storeData.ownerName || '',
                  businessEmail: storeData.businessEmail || '',
                  businessType: storeData.businessType || '',
                  shopCategory: storeData.shopCategory || '',
                  numEmployees: storeData.numEmployees?.toString() || '',
                  numBranches: storeData.numBranches?.toString() || '1',
                  gstNumber: storeData.gstNumber || '',
                  experienceYears: storeData.experienceYears?.toString() || '',
                  address: storeData.address || '',
                  city: storeData.city || '',
                  state: storeData.state || '',
                  pincode: storeData.pincode || '',
                  agreeTerms: false,
                  verifyInformation: false,
                  agreeMarketing: false
                })
                // Skip to business info step if phone is verified
                if (user.phoneNumber) {
                  setCurrentStep(3)
                }
              }
            }
          } catch (error) {
            console.error('Error checking registration status:', error)
          }
        }
      })
      return () => unsubscribe()
    }
  }, [])

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
      const storesRef = collection(db, 'stores')
      const q = query(storesRef, where('phoneNumber', '==', fullNumber))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        showMessage('error', 'This number is already registered. Please login.')
        setLoading(false)
        return
      }

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
      setCurrentStep(2)
    } catch (error: any) {
      console.error('OTP Error:', error)
      showMessage('error', error.message || 'Failed to send OTP')
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
        setVerifiedPhone(result.user.phoneNumber || '')
        showMessage('success', 'Phone number verified!')
        setTimeout(() => setCurrentStep(3), 1000)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({
        ...prev,
        [field]: e.target.files![0]
      }))
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 3:
        if (!formData.businessName || !formData.ownerName || !formData.businessType || 
            !formData.shopCategory || !formData.address || !formData.city || 
            !formData.state || !formData.pincode) {
          showMessage('error', 'Please fill all required fields')
          return false
        }
        break
      case 4:
        if (!files.businessLicense || !files.storeFront || !files.ownerIdProof) {
          showMessage('error', 'Please upload all required documents')
          return false
        }
        break
      case 5:
        if (!formData.agreeTerms || !formData.verifyInformation) {
          showMessage('error', 'Please agree to terms and verify information')
          return false
        }
        break
    }
    return true
  }

  const nextStep = () => {
    if (currentStep === 1) {
      sendOTP()
    } else if (currentStep === 2) {
      verifyOTP()
    } else if (currentStep < 5) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1)
      }
    } else if (currentStep === 5) {
      submitApplication()
    }
  }

  const prevStep = () => {
    if (currentStep > 1 && currentStep !== 6) {
      setCurrentStep(currentStep - 1)
    }
  }

  const submitApplication = async () => {
    if (!validateStep(5)) return

    setLoading(true)
    try {
      if (!auth.currentUser) {
        showMessage('error', 'Authentication error. Please try again.')
        return
      }

      const userUid = auth.currentUser.uid
      const uploadedFileUrls: Record<string, string> = {}

      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const storageRef = ref(storage, `documents/${userUid}/${key}-${file.name}`)
          const snapshot = await uploadBytes(storageRef, file)
          uploadedFileUrls[key] = await getDownloadURL(snapshot.ref)
        }
      }

      const storeData = {
        ...formData,
        phoneNumber: verifiedPhone,
        documents: uploadedFileUrls,
        status: 'pending_review',
        profileCompleted: 100,
        createdAt: serverTimestamp(),
        numEmployees: parseInt(formData.numEmployees) || 0,
        numBranches: parseInt(formData.numBranches) || 1,
        experienceYears: parseInt(formData.experienceYears) || 0
      }

      await setDoc(doc(db, 'stores', userUid), storeData)
      
      setApplicationId(userUid)
      setCurrentStep(6)
      showMessage('success', 'Application submitted successfully!')

    } catch (error: any) {
      console.error('Submission Error:', error)
      showMessage('error', error.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 -mx-4 px-4 mb-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-store text-white text-sm"></i>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Business Partner Portal</h2>
            </div>
            <div className="text-sm text-gray-500">
              Already have an account? 
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium ml-1">Sign in</a>
            </div>
          </div>
        </header>

        {/* Progress Steps */}
        {currentStep !== 6 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${currentStep > step.number ? 'bg-green-500 text-white' : 
                        currentStep === step.number ? 'bg-blue-600 text-white' : 
                        'bg-gray-200 text-gray-600'}
                    `}>
                      {currentStep > step.number ? 
                        <i className="fas fa-check text-xs"></i> : 
                        step.number
                      }
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 transition-colors ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Alert Message */}
        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 
            message.type === 'info' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`} role="alert">
            <div className="flex items-center">
              {message.type === 'success' && <i className="fas fa-check-circle mr-2"></i>}
              {message.type === 'error' && <i className="fas fa-exclamation-circle mr-2"></i>}
              {message.type === 'info' && <i className="fas fa-info-circle mr-2"></i>}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div ref={recaptchaRef}></div>

          {/* Step 1: Phone Number */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-mobile-alt text-blue-600 text-2xl"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verify your phone number</h2>
                <p className="text-gray-600">We'll send you a verification code to confirm your identity</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="flex">
                    <span className="inline-flex items-center px-4 py-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span> Sending...
                    </span>
                  ) : (
                    'Send verification code'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-green-600 text-2xl"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Enter verification code</h2>
                <p className="text-gray-600">
                  We've sent a 6-digit code to <span className="font-medium text-gray-900">+91 {phoneNumber}</span>
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="flex justify-center space-x-3 mb-6">
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
                      className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      maxLength={1}
                    />
                  ))}
                </div>

                <button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors mb-4"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                  <button
                    onClick={sendOTP}
                    disabled={countdown > 0}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-gray-600 hover:text-gray-800 text-sm px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <i className="fas fa-arrow-left mr-1"></i> Change number
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Information */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-building text-blue-600 text-2xl"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Business Information</h2>
                <p className="text-gray-600">Tell us about your business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="retail">Retail Store</option>
                    <option value="restaurant">Restaurant/Food Service</option>
                    <option value="services">Professional Services</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="wholesale">Wholesale/Distribution</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Category *</label>
                  <input
                    type="text"
                    name="shopCategory"
                    value={formData.shopCategory}
                    onChange={handleInputChange}
                    placeholder="e.g., Groceries, Electronics"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().slice(0, 15)
                      setFormData(prev => ({ ...prev, gstNumber: value }))
                    }}
                    maxLength={15}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                  <input
                    type="number"
                    name="numEmployees"
                    value={formData.numEmployees}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Branches</label>
                  <input
                    type="number"
                    name="numBranches"
                    value={formData.numBranches}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setFormData(prev => ({ ...prev, pincode: value }))
                    }}
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-upload text-purple-600 text-2xl"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
                <p className="text-gray-600">Please upload the required business documents</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'businessLicense', label: 'Business License/Registration *', icon: 'fa-certificate' },
                  { key: 'storeFront', label: 'Store Front Photo *', icon: 'fa-store' },
                  { key: 'ownerIdProof', label: 'Owner ID Proof *', icon: 'fa-id-card' },
                  { key: 'bankDetails', label: 'Bank Account Details', icon: 'fa-university' }
                ].map((doc) => (
                  <div key={doc.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{doc.label}</label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      onClick={() => document.getElementById(doc.key)?.click()}
                    >
                      <i className={`fas ${doc.icon} text-3xl text-gray-400 mb-2`}></i>
                      <p className="text-gray-600 text-sm">
                        {files[doc.key as keyof typeof files]?.name || 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">PDF, JPG, PNG up to 10MB</p>
                      <input
                        id={doc.key}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, doc.key as keyof typeof files)}
                        className="hidden"
                      />
                    </div>
                    {files[doc.key as keyof typeof files] && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <i className="fas fa-check-circle mr-1"></i>
                        Uploaded: {files[doc.key as keyof typeof files]?.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Submit</h2>
                <p className="text-gray-600">Please review your information before submitting</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Business Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {formData.businessName}</p>
                    <p><strong>Type:</strong> {formData.businessType}</p>
                    <p><strong>Category:</strong> {formData.shopCategory}</p>
                    <p><strong>Owner:</strong> {formData.ownerName}</p>
                    <p><strong>Employees:</strong> {formData.numEmployees || 'Not specified'}</p>
                    <p><strong>Branches:</strong> {formData.numBranches}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact & Location</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Phone:</strong> {verifiedPhone}</p>
                    <p><strong>Email:</strong> {formData.businessEmail || 'Not specified'}</p>
                    <p><strong>GST:</strong> {formData.gstNumber || 'Not specified'}</p>
                    <p><strong>Address:</strong> {formData.address}</p>
                    <p><strong>City:</strong> {formData.city}</p>
                    <p><strong>State:</strong> {formData.state}</p>
                    <p><strong>Pincode:</strong> {formData.pincode}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Terms & Conditions</h3>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms & Conditions</a> and <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                    </span>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeMarketing"
                      checked={formData.agreeMarketing}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to receive promotional emails and SMS updates about business opportunities
                    </span>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="verifyInformation"
                      checked={formData.verifyInformation}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I confirm that all the information provided is accurate and complete
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Back
                </button>
                <button
                  onClick={submitApplication}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span> Submitting...
                    </span>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i> Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Success Screen */}
          {currentStep === 6 && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <i className="fas fa-check-circle text-green-600 text-4xl"></i>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h2>
                <p className="text-lg text-gray-600 mb-6">Thank you for registering with our Business Partner Portal.</p>
                
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6 text-left max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">What happens next?</h3>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li className="flex items-center">
                      <i className="fas fa-clock text-blue-600 mr-2 w-4"></i> Review process: 2-3 business days
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-phone text-blue-600 mr-2 w-4"></i> Verification call within 48 hours
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-envelope text-blue-600 mr-2 w-4"></i> Account activation email
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-rocket text-blue-600 mr-2 w-4"></i> Start receiving orders!
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-8">
                  <p>Application ID: <span className="font-medium text-gray-900">{applicationId}</span></p>
                  <p>Registered Phone: <span className="font-medium text-gray-900">{verifiedPhone}</span></p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/dashboard"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  <i className="fas fa-tachometer-alt mr-2"></i> Go to Dashboard
                </a>
                <a
                  href="/login"
                  className="px-8 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i> Login Later
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}