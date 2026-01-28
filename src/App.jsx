import { useState, useCallback, useEffect } from 'react'
import { getDoc, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './lib/firebase'
import UserDetailsForm from './components/UserDetailsForm'
import logoImg from './assets/HelaGoLogo.png'
import spinBtnImg from './assets/SpinButton.png'
import bandanaImg from './assets/Bandana.png'
import stickerImg from './assets/Sticker.png'
import tshirt2Img from './assets/Tshirt2.png'
import handbandImg from './assets/Handband.png'
import hatImg from './assets/Hat.png'
import tryAgainImg from './assets/TryAgain.png'
import congratsGif from './assets/CongratsAnimation.gif'

/** 6 wheel segments (indices 0–5). */
const WHEEL_ITEMS = [
  { icon: bandanaImg, alt: 'Bandana' },
  { icon: stickerImg, alt: 'Sticker' },
  { icon: tshirt2Img, alt: 'Tshirt' },
  { icon: handbandImg, alt: 'Handband' },
  { icon: hatImg, alt: 'Hat' },
  { icon: tryAgainImg, alt: 'Try Again' },
]

/**
 * Segment center angles (deg) for icon-0..5. Pointer at bottom (180°).
 * Wheel base -90° so index 2 (Tshirt, 90°) is at top, index 5 (Try Again, 270°) at bottom.
 * Transform: rotate(-BASE_DEG + R). Segment at A ends up at A - BASE_DEG + R.
 * We want that = 180° → R ≡ POINTER_DEG + BASE_DEG - A (mod 360).
 */
const SEGMENT_ANGLES = [330, 30, 90, 150, 210, 270]
const POINTER_DEG = 180
const BASE_DEG = 90
const SPIN_DURATION_MIN_MS = 5000
const SPIN_DURATION_MAX_MS = 10000
const FULL_SPINS = 5
const GIFT_ITEMS_DOC = { collection: 'giftItems', id: 'helago' }
const USERS_COLLECTION = 'users'

function App() {
  const [userDetails, setUserDetails] = useState(null)
  const [userSubmitted, setUserSubmitted] = useState(false)
  const [stockChecking, setStockChecking] = useState(false)
  const [stockError, setStockError] = useState(null)
  const [availableIndices, setAvailableIndices] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [spinDurationMs, setSpinDurationMs] = useState(SPIN_DURATION_MIN_MS)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningItem, setWinningItem] = useState(null)
  const [spinError, setSpinError] = useState(null)
  const [saveFailed, setSaveFailed] = useState(false)

  const goHome = useCallback(() => {
    setUserDetails(null)
    setUserSubmitted(false)
    setStockChecking(false)
    setStockError(null)
    setAvailableIndices(null)
    setWinningItem(null)
    setRotation(0)
    setSpinError(null)
    setSaveFailed(false)
  }, [])

  const trySpinAgain = useCallback(() => {
    setWinningItem(null)
    setSpinError(null)
  }, [])

  useEffect(() => {
    if (!stockChecking || !userDetails || userSubmitted) return
    let cancelled = false
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, GIFT_ITEMS_DOC.collection, GIFT_ITEMS_DOC.id))
        if (cancelled) return
        const items = snap.exists() ? snap.data().items : null
        const arr = Array.isArray(items) ? items : []
        const indices = [0, 1, 2, 3, 4, 5].filter((i) => arr[i] === true)
        if (indices.length === 0) {
          setStockError('No items in stock. Try again later.')
          setStockChecking(false)
          return
        }
        setAvailableIndices(indices)
        setStockError(null)
        setStockChecking(false)
        setUserSubmitted(true)
      } catch (err) {
        if (!cancelled) {
          setStockError(err?.message || 'Could not load stock. Please try again.')
          setStockChecking(false)
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [stockChecking, userDetails, userSubmitted])

  const handleSpin = useCallback(() => {
    if (isSpinning) return
    if (!availableIndices || availableIndices.length === 0) {
      setSpinError('No items in stock. Try again later.')
      return
    }
    setIsSpinning(true)
    setWinningItem(null)
    setSpinError(null)
    const winnerIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    const durationMs =
      SPIN_DURATION_MIN_MS +
      Math.floor(Math.random() * (SPIN_DURATION_MAX_MS - SPIN_DURATION_MIN_MS + 1))
    setSpinDurationMs(durationMs)
    const segmentCenter = SEGMENT_ANGLES[winnerIndex]
    const targetDeg = (POINTER_DEG + BASE_DEG - segmentCenter + 360) % 360
    setRotation((r) => {
      const currentMod = r % 360
      const offset = (targetDeg - currentMod + 360) % 360
      const spinDeg = 360 * FULL_SPINS + offset
      return r + spinDeg
    })
    const wonItem = WHEEL_ITEMS[winnerIndex]
    setTimeout(async () => {
      setIsSpinning(false)
      if (userDetails && wonItem.alt !== 'Try Again') {
        try {
          await addDoc(collection(db, USERS_COLLECTION), {
            name: userDetails.name,
            contact: userDetails.contact,
            wonGift: wonItem.alt,
            createdAt: serverTimestamp(),
          })
          setSaveFailed(false)
        } catch (err) {
          setSaveFailed(true)
        }
      }
      setWinningItem(wonItem)
    }, durationMs + 200)
  }, [isSpinning, availableIndices, userDetails])

  if (!userSubmitted) {
    return (
      <UserDetailsForm
        onSuccess={(data) => {
          setUserDetails(data)
          setStockError(null)
          setStockChecking(true)
        }}
        isCheckingStock={stockChecking}
        stockError={stockError}
      />
    )
  }

  const isTryAgain = winningItem?.alt === 'Try Again'

  if (winningItem) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center font-display overflow-hidden select-none relative">
        {/* Logo + title fixed at top */}
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

        {isTryAgain ? (
          /* Sorry / Try Again screen */
          <main className="flex-1 w-full flex flex-col items-center justify-center pt-44 md:pt-52 px-4">
            <div className="max-w-md w-full text-center space-y-8">
              <h2 className="title-shadow text-4xl md:text-5xl font-black text-white uppercase">
                Sorry!
              </h2>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                Better luck next time. Give it another spin!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  type="button"
                  onClick={trySpinAgain}
                  className="px-8 py-4 bg-white text-primary font-bold rounded-xl text-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white transition"
                >
                  Spin again
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  className="px-8 py-4 bg-white/20 text-white font-bold rounded-xl text-lg border-2 border-white/50 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                >
                  Go home
                </button>
              </div>
            </div>
          </main>
        ) : (
          /* Congratulations / Winning item screen with GIF background */
          <main className="flex-1 w-full flex flex-col items-center justify-center pt-44 md:pt-52 px-4 relative">
            <div
              className="absolute inset-0 z-0 bg-background-light dark:bg-background-dark"
              aria-hidden="true"
            />
            <div
              className="absolute left-1/2 top-1/2 z-[1] w-64 h-64 md:w-80 md:h-80 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden bg-background-light dark:bg-background-dark"
              aria-hidden="true"
            >
              <img
                src={congratsGif}
                alt=""
                className="w-full h-full object-contain pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full space-y-6 md:space-y-8">
              <h2 className="title-shadow text-3xl md:text-5xl text-white uppercase leading-tight">
                <span className="font-black">Congratulation!</span>
                <br />
                <span className="font-normal">You have won</span>
              </h2>
              <img
                src={winningItem.icon}
                alt={winningItem.alt}
                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl [filter:brightness(0)_invert(1)]"
              />
              {saveFailed && (
                <p className="text-red-200 text-sm font-medium" role="alert">
                  Couldn&apos;t save your result. Please try again later.
                </p>
              )}
              <button
                type="button"
                onClick={goHome}
                className="mt-4 px-10 py-4 bg-white text-primary font-bold rounded-xl text-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white transition"
              >
                Awesome!
              </button>
            </div>
          </main>
        )}
      </div>
    )
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center font-display overflow-hidden select-none relative">
      {/* Logo + title fixed at top center (same as UserDetailsForm) */}
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

      <div className="flex-1 w-full flex flex-col items-center max-w-2xl px-4 pt-44 md:pt-52 pb-8 space-y-8 md:space-y-12 justify-evenly">
        {/* Wheel */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="wheel-container bg-white dark:bg-gray-800">
            <div
              className="wheel-bg relative"
              style={{
                transition: `transform ${spinDurationMs / 1000}s cubic-bezier(0.2, 0.8, 0.2, 1)`,
                transform: `rotate(${-BASE_DEG + rotation}deg)`,
              }}
            >
              <div className="absolute inset-0 wheel-icons-layer">
                {WHEEL_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className={`icon-container icon-${i + 1}`}
                  >
                    <span
                      className="wheel-icon-index"
                      style={{
                        left: -40,
                        top: -52,
                        width: 80,
                      }}
                    >
                      {i}
                    </span>
                    <img
                      alt={item.alt}
                      className="wheel-icon wheel-icon-img"
                      src={item.icon}
                      width={80}
                      height={80}
                      loading="eager"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Center Go button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-1/4 h-1/4 min-w-[80px] min-h-[80px] rounded-full bg-gradient-to-br from-white to-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center z-20 hover:scale-105 active:scale-95 transition-transform duration-200 ease-out border-4 border-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Spin"
              >
                <img
                  alt="Go Button"
                  className="w-3/4 h-3/4 object-contain pointer-events-none"
                  src={spinBtnImg}
                />
              </button>
            </div>
          </div>

          {/* Triangle pointer */}
          <div className="relative flex justify-center filter drop-shadow-2xl mt-4">
            <svg
              className="drop-shadow-xl"
              fill="none"
              height="100"
              viewBox="0 0 120 100"
              width="120"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M60 0L111.962 90H8.03848L60 0Z"
                fill="url(#paint0_linear)"
              />
              <defs>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="paint0_linear"
                  x1="60"
                  x2="60"
                  y1="0"
                  y2="100"
                >
                  <stop stopColor="#F3F4F6" />
                  <stop offset="1" stopColor="#9CA3AF" />
                </linearGradient>
              </defs>
              <path
                d="M60 0L111.962 90H60V0Z"
                fill="black"
                fillOpacity="0.1"
              />
            </svg>
          </div>

          {spinError && (
            <p className="mt-4 text-center text-red-200 text-sm font-medium max-w-md" role="alert">
              {spinError}
            </p>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}

export default App
