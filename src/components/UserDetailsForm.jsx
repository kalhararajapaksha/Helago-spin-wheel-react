import { useState, useEffect, useCallback } from 'react'
import AppHeader from './AppHeader'
import ScreenWithBackground from './ScreenWithBackground'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
// Standard QWERTY layout (user-friendly)
const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
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

  const handleClear = () => {
    if (disabled) return
    setName('')
    setContact('')
    setError('')
  }

  return (
    <ScreenWithBackground>
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

      <AppHeader />

      {/* Main: fill remaining height, center form */}
      <main className="flex-1 w-full flex flex-col items-center justify-center pt-44 md:pt-52 min-h-0 pb-8 px-3 md:px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl p-4 md:p-6 space-y-6"
        >
          <div className="flex flex-col justify-between min-h-[220px] md:min-h-[260px]">
          <div className="shrink-0">
            <div
              id="user-name"
              role="textbox"
              tabIndex={0}
              aria-label="Name"
              aria-readonly="true"
              onFocus={() => setActiveField('name')}
              onClick={() => setActiveField('name')}
              onKeyDown={(e) => e.preventDefault()}
              className={`w-full min-h-[5.5rem] md:min-h-[6rem] px-6 py-6 md:px-8 md:py-6 bg-[#f5ff00] font-bold text-black uppercase focus:outline-none focus:ring-2 focus:ring-white/50 transition cursor-pointer flex items-center justify-center ${
                activeField === 'name' ? 'ring-2 ring-white/60' : ''
              } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-5xl md:text-6xl lg:text-7xl tracking-wide text-center">
                  {name || <span className="text-gray-500 normal-case">Your name</span>}
                </span>
                {activeField === 'name' && (
                  <span
                    className="inline-block w-0.5 h-12 md:h-14 lg:h-16 bg-black align-middle animate-blink shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <div
              id="user-contact"
              role="textbox"
              tabIndex={0}
              aria-label="Contact number (10 digits)"
              aria-readonly="true"
              onFocus={() => setActiveField('contact')}
              onClick={() => setActiveField('contact')}
              onKeyDown={(e) => e.preventDefault()}
              className={`w-full min-h-[5.5rem] md:min-h-[6rem] px-6 py-6 md:px-8 md:py-6 bg-[#f5ff00] font-bold text-black uppercase focus:outline-none focus:ring-2 focus:ring-white/50 transition cursor-pointer flex items-center justify-center ${
                activeField === 'contact' ? 'ring-2 ring-white/60' : ''
              } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-5xl md:text-6xl lg:text-7xl tracking-wide text-center">
                  {contact || <span className="text-gray-500 normal-case">07XXXXXXXX</span>}
                </span>
                {activeField === 'contact' && (
                  <span
                    className="inline-block w-0.5 h-12 md:h-14 lg:h-16 bg-black align-middle animate-blink shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </div>
          </div>
          {(error || stockError) && (
            <p className="text-red-200 text-sm font-medium" role="alert">
              {stockError || error}
            </p>
          )}

          {/* Custom keyboard */}
          <div className="mt-12 md:mt-14 w-full">
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
                            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-black text-[#f5ff00] hover:opacity-90 border-2 border-[#f5ff00]/40 font-bold text-lg md:text-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#f5ff00]/50 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
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
                      className={`flex gap-1 justify-center items-center ${ri === 3 ? 'gap-3' : ''}`}
                    >
                      {row.map((k) => (
                        <button
                          key={k === ' ' ? 'space' : k}
                          type="button"
                          onClick={() => handleKeyPress(k)}
                          disabled={disabled}
                          aria-label={k === ' ' ? 'Space' : k === '⌫' ? 'Backspace' : `Letter ${k}`}
                          className={`rounded-xl bg-black text-[#f5ff00] hover:opacity-90 border-2 border-[#f5ff00]/40 font-bold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#f5ff00]/50 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 ${
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
                      {ri === 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveField('contact')}
                          disabled={disabled}
                          aria-label="Done – move to phone number"
                          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black text-[#f5ff00] hover:opacity-90 border-2 border-[#f5ff00]/40 font-bold text-sm md:text-base flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#f5ff00]/50 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 shrink-0"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 md:mt-12 flex flex-wrap gap-4 justify-center items-center">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear form"
              className="px-6 py-4 bg-white/20 hover:bg-white/30 text-white font-bold text-xl md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={disabled}
              aria-label={isCheckingStock ? 'Checking availability…' : 'Submit'}
              className="px-6 py-4 bg-black text-[#f5ff00] font-bold text-2xl md:text-3xl rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed transition opacity-100 hover:opacity-90"
            >
              SUBMIT
            </button>
          </div>
        </form>
      </main>
    </ScreenWithBackground>
  )
}

export default UserDetailsForm
