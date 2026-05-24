import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { FaSpinner } from 'react-icons/fa'
import axios from 'axios'
import { api } from '../utils/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [showOtpScreen, setShowOtpScreen] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      })

      localStorage.setItem('token', res.data.token)
      // Save user info as well if your backend returns it!
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }

      setIsLoading(false)
      navigate('/dashboard') 
    } catch (err) {
      console.error(err)
      
      if (err.response?.status === 403) {
        setError('Your email is not verified yet. Please enter the OTP sent to your email.')
        setShowOtpScreen(true) // Switch the UI to the OTP screen
      } else {
        // Handle standard errors (wrong password, etc.)
        setError(err.response?.data?.message || err.response?.data?.msg || 'Login failed')
      }
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      await api.post('/auth/verify-otp', { email, otp })
      
      alert('Email verified! You can now log in.')
      setShowOtpScreen(false) // Send them back to the login form
      setOtp('') // Clear the OTP field
      setPassword('') // Clear password for security
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    console.log('Google login clicked')
  }

  if (showOtpScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-10 px-4 py-12">
        <div className="w-full max-w-md bg-yellow-50 shadow-xl rounded-xl p-8">
          <h2 className="text-3xl font-bold text-center text-blue-800 pt-3 mb-3">Verify Email</h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            Please enter the 6-digit code sent to <br /><strong>{email}</strong>
          </p>

          {error && (
            <div className="bg-red-100 text-red-600 p-2 mb-4 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none text-center tracking-widest text-lg font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 bg-yellow-400 text-black font-semibold py-2 rounded-md hover:bg-yellow-500 transition ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" /> Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => {
                  setShowOtpScreen(false)
                  setError('')
                }} 
                className="text-sm text-blue-600 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-10 px-4 py-12">
      <div className="w-full max-w-md bg-yellow-50 shadow-xl rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center text-blue-800 pt-3 mb-3">Welcome Back </h2>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Login to your Instapal account using your NITJSR email.
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-4 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              College Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="•••••••@nitjsr.ac.in"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 bg-yellow-400 text-black font-semibold py-2 rounded-md hover:bg-yellow-500 transition ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" /> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Get Started
          </Link>
        </p>
      </div>
    </div>
  )
}