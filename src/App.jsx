import { useState, useCallback, useEffect } from 'react'
import { getDoc, doc, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from './lib/firebase'
import UserDetailsForm from './components/UserDetailsForm'
import AppHeader from './components/AppHeader'
import ScreenWithBackground from './components/ScreenWithBackground'
import spinBtnImg from './assets/SpinButton.png'
import bandanaImg from './assets/Bandana.png'
import stickerImg from './assets/Sticker.png'
import tshirt2Img from './assets/Tshirt2.png'
import wristbandImg from './assets/Wristband.png'
import hatImg from './assets/Hat.png'
import congratsGif from './assets/CongratsAnimation.gif'
import arrowImg from './assets/Arrow.png'

/** 6 wheel segments (indices 0–5). Index 1 and 4 = Sticker, index 5 = Hat (no Try Again). */
const WHEEL_ITEMS = [
  { icon: bandanaImg, alt: 'Bandana' },
  { icon: stickerImg, alt: 'Sticker' },
  { icon: tshirt2Img, alt: 'Tshirt' },
  { icon: wristbandImg, alt: 'Wristband' },
  { icon: stickerImg, alt: 'Sticker' },
  { icon: hatImg, alt: 'Hat' },
]

/**
 * Segment center angles (deg) for icon-0..5. Pointer at bottom (180°).
 * Wheel base -90° so index 2 (Tshirt, 90°) is at top, index 5 (Hat, 270°) at bottom.
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
        // Phone number is primary key: reject if already used
        const contactNorm = (userDetails.contact || '').replace(/\D/g, '')
        if (contactNorm) {
          const q = query(
            collection(db, USERS_COLLECTION),
            where('contact', '==', contactNorm),
            limit(1)
          )
          const existing = await getDocs(q)
          if (cancelled) return
          if (!existing.empty) {
            setStockError('This phone number has already been used.')
            setStockChecking(false)
            return
          }
        }

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
          const contactNorm = (userDetails.contact || '').replace(/\D/g, '')
          await addDoc(collection(db, USERS_COLLECTION), {
            name: userDetails.name,
            contact: contactNorm,
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
      <ScreenWithBackground>
        <AppHeader />

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
          <main className="flex-1 w-full flex flex-col items-center justify-center pt-44 md:pt-52 pb-8 px-4 relative">
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
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full space-y-6 md:space-y-8 pb-2">
              <h2 className="font-bebas text-[#f5ff00] uppercase leading-tight">
                <span className="block text-7xl md:text-8xl lg:text-9xl xl:text-[5.5rem] 2xl:text-[6.5rem]">Congratulation!</span>
                <span className="block text-7xl md:text-8xl lg:text-9xl xl:text-[5.5rem] 2xl:text-[6.5rem]">You have won</span>
              </h2>
              <img
                src={winningItem.icon}
                alt={winningItem.alt}
                className="w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain drop-shadow-2xl [filter:brightness(0)_invert(1)]"
              />
              {saveFailed && (
                <p className="text-red-200 text-sm font-medium" role="alert">
                  Couldn&apos;t save your result. Please try again later.
                </p>
              )}
              <button
                type="button"
                onClick={goHome}
                className="mt-4 px-6 py-4 bg-black text-[#f5ff00] font-bold text-2xl md:text-3xl rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent transition opacity-100 hover:opacity-90"
              >
                Awesome!
              </button>
            </div>
          </main>
        )}
      </ScreenWithBackground>
    )
  }

  return (
    <ScreenWithBackground>
      <AppHeader />

      <div className="flex-1 w-full flex flex-col items-center max-w-2xl px-4 pt-44 md:pt-52 pb-8 space-y-8 md:space-y-12 justify-evenly">
        {/* Wheel */}
        <div className="relative z-10 flex flex-col items-center mt-12 md:mt-20">
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

          {/* Arrow pointer - overlaps wheel bottom slightly */}
          <div className="relative flex justify-center -mt-6 md:-mt-8">
            <img
              src={arrowImg}
              alt=""
              className="h-28 md:h-36 w-auto object-contain drop-shadow-xl"
              aria-hidden
            />
          </div>

          {spinError && (
            <p className="mt-4 text-center text-red-200 text-sm font-medium max-w-md" role="alert">
              {spinError}
            </p>
          )}
        </div>

        <div className="h-8" />
      </div>
    </ScreenWithBackground>
  )
}

export default App
