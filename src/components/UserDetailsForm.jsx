import { useState, useEffect, useCallback } from 'react'
import logoImg from '../assets/HelaGoLogo.png'

function UserDetailsForm({ onSuccess, isCheckingStock, stockError }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const disabled = isCheckingStock

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const validate = () => {
    const n = name.trim()
    if (!n) {
      setError('Please enter your name.')
      return false
    }
    const digits = contact.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Contact number must be exactly 10 digits.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate() || disabled) return
    onSuccess?.({ name: name.trim(), contact: contact.replace(/\D/g, '') })
  }

  const handleContactChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
    setContact(v)
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center font-display overflow-hidden select-none relative">
      <button
        type="button"
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-20 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 15v4.5M9 15H4.5M15 9h4.5M15 9V4.5M15 15h4.5M15 15v4.5" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>
      <div className="flex flex-col items-center w-full max-w-md px-4 py-8">
        <div className="mb-6 flex justify-center">
          <img
            alt="HelaGo Logo"
            className="h-14 md:h-20 w-auto object-contain drop-shadow-md"
            src={logoImg}
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-black italic text-white tracking-wide drop-shadow-lg uppercase text-center mb-2">
          Spin The Wheel
        </h1>
        <p className="text-white/90 text-sm md:text-base text-center mb-8">
          Enter your details to continue
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-5"
        >
          <div>
            <label htmlFor="user-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Name
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              autoComplete="name"
              disabled={disabled}
            />
          </div>
          <div>
            <label htmlFor="user-contact" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Contact number <span className="text-gray-500 font-normal">(10 digits)</span>
            </label>
            <input
              id="user-contact"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={contact}
              onChange={handleContactChange}
              placeholder="07XXXXXXXX"
              maxLength={10}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              autoComplete="tel"
              disabled={disabled}
            />
          </div>
          {(error || stockError) && (
            <p className="text-red-600 dark:text-red-400 text-sm font-medium" role="alert">
              {stockError || error}
            </p>
          )}
          <button
            type="submit"
            disabled={disabled}
            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {isCheckingStock ? 'Checking availability…' : 'Continue to spin'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserDetailsForm
