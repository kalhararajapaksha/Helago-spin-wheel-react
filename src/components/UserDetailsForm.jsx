import { useState, useEffect, useCallback } from 'react'
import logoImg from '../assets/HelaGoLogo.png'
import submitBtnImg from '../assets/SubmitButton.png'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const LETTER_ROWS = [
  LETTERS.slice(0, 10),
  LETTERS.slice(10, 19),
  LETTERS.slice(19, 26),
  [' ', '⌫'],
]
const NUMBER_GRID = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [' ', '0', '⌫'],
]

function UserDetailsForm({ onSuccess, isCheckingStock, stockError }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeField, setActiveField] = useState('name')
  const disabled = isCheckingStock

  const handleKeyPress = useCallback(
    (key) => {
      if (disabled) return
      if (activeField === 'name') {
        if (key === '⌫') setName((s) => s.slice(0, -1))
        else if (key === ' ') setName((s) => s + ' ')
        else if (LETTERS.includes(key)) setName((s) => s + key)
      } else if (activeField === 'contact') {
        if (key === '⌫') setContact((s) => s.slice(0, -1))
        else if (key >= '0' && key <= '9' && contact.length < 10) setContact((s) => s + key)
      }
    },
    [activeField, contact.length, disabled]
  )

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

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center font-display overflow-hidden select-none relative">
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

      {/* Logo + title fixed at top center */}
      <header className="fixed top-0 left-0 right-0 z-10 flex flex-col items-center pt-6 pb-3 bg-background-light dark:bg-background-dark">
        <div className="mb-6 flex justify-center">
          <img
            alt="HelaGo Logo"
            className="h-14 md:h-20 w-auto object-contain drop-shadow-md"
            src={logoImg}
          />
        </div>
        <h1 className="title-shadow text-4xl md:text-6xl font-black italic text-white tracking-wide uppercase text-center">
          Spin The Wheel
        </h1>
      </header>

      {/* Main: fill remaining height, center form */}
      <main className="flex-1 w-full flex flex-col items-center justify-center pt-44 md:pt-52 min-h-0 pb-8 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg p-6 md:p-8 space-y-6"
        >
          <div>
            <input
              id="user-name"
              type="text"
              value={name}
              readOnly
              placeholder="Your name"
              aria-label="Name"
              autoComplete="off"
              onFocus={() => setActiveField('name')}
              onClick={() => setActiveField('name')}
              className={`w-full px-5 py-4 text-lg md:text-xl rounded-xl border-2 bg-white text-center font-bold text-black uppercase placeholder-gray-400 placeholder:text-center placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-white/30 transition cursor-pointer ${
                activeField === 'name' ? 'border-white ring-2 ring-white/50' : 'border-white/50'
              } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          <div>
            <input
              id="user-contact"
              type="tel"
              value={contact}
              readOnly
              placeholder="07XXXXXXXX"
              aria-label="Contact number (10 digits)"
              autoComplete="off"
              onFocus={() => setActiveField('contact')}
              onClick={() => setActiveField('contact')}
              className={`w-full px-5 py-4 text-lg md:text-xl rounded-xl border-2 bg-white text-center font-bold text-black uppercase placeholder-gray-400 placeholder:text-center placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-white/30 transition cursor-pointer ${
                activeField === 'contact' ? 'border-white ring-2 ring-white/50' : 'border-white/50'
              } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
            />
          </div>
          {(error || stockError) && (
            <p className="text-red-200 text-sm font-medium" role="alert">
              {stockError || error}
            </p>
          )}

          {/* Custom keyboard */}
          <div className="mt-6 w-full">
            <div className="rounded-2xl border-2 border-white/40 bg-white/5 px-4 py-4 md:px-5 md:py-5 max-w-xl mx-auto">
              {activeField === 'contact' ? (
                <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                  {NUMBER_GRID.map((row, ri) => (
                    <div key={ri} className="flex gap-2 justify-center">
                      {row.map((k) =>
                        k === ' ' ? (
                          <div key="sp" className="w-14 md:w-16 shrink-0" aria-hidden="true" />
                        ) : (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleKeyPress(k)}
                            disabled={disabled}
                            aria-label={k === '⌫' ? 'Backspace' : `Digit ${k}`}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/90 hover:bg-white border-2 border-white/50 text-black font-bold text-lg md:text-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
                          >
                            {k}
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-w-full overflow-x-auto mx-auto">
                  {LETTER_ROWS.map((row, ri) => (
                    <div
                      key={ri}
                      className={`flex gap-1 justify-center ${ri === 3 ? 'gap-3' : ''}`}
                    >
                      {row.map((k) => (
                        <button
                          key={k === ' ' ? 'space' : k}
                          type="button"
                          onClick={() => handleKeyPress(k)}
                          disabled={disabled}
                          aria-label={k === ' ' ? 'Space' : k === '⌫' ? 'Backspace' : `Letter ${k}`}
                          className={`rounded-xl bg-white/90 hover:bg-white border-2 border-white/50 text-black font-bold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 ${
                            k === ' '
                              ? 'min-w-[80px] md:min-w-[120px] h-12 md:h-14 px-4 text-base'
                              : k === '⌫'
                                ? 'w-12 h-12 md:w-14 md:h-14 text-lg md:text-xl'
                                : 'min-w-[28px] w-8 h-12 md:min-w-[32px] md:w-10 md:h-14 text-sm md:text-base'
                          }`}
                        >
                          {k === ' ' ? 'Space' : k}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled}
            aria-label={isCheckingStock ? 'Checking availability…' : 'Submit'}
            className="mt-8 w-full max-w-[220px] mx-auto block focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed transition opacity-100 hover:opacity-90"
          >
            <img
              src={submitBtnImg}
              alt="Submit"
              className="w-full h-auto object-contain pointer-events-none"
            />
          </button>
        </form>
      </main>
    </div>
  )
}

export default UserDetailsForm
