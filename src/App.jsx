import { useState, useCallback, useEffect } from 'react'
import { getDoc, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './lib/firebase'
import UserDetailsForm from './components/UserDetailsForm'
import logoImg from './assets/HelaGoLogo.png'
import spinBtnImg from './assets/SpinButton.png'
import capImg from './assets/Cap.png'
import penImg from './assets/Pen.png'
import tshirtImg from './assets/Tshirt.png'

/** 3 gift types × 2 each = 6 segments. Dynamic: change GIFT_TYPES to alter items. */
const GIFT_TYPES = [
  { icon: capImg, alt: 'Cap' },
  { icon: tshirtImg, alt: 'T-Shirt' },
  { icon: penImg, alt: 'Pencil' },
]
const WHEEL_ITEMS = [...GIFT_TYPES, ...GIFT_TYPES]

/**
 * Segment center angles (deg) for icon-0..5. Pointer at bottom (180°).
 * Wheel base -30°. Transform: rotate(-30 + R). Segment at A ends up at A - 30 + R.
 * We want that = 180° → R ≡ 210 - A (mod 360). Rotation accumulates each spin;
 * offset must use current rotation % 360 so the target lands at the pointer every time.
 */
const SEGMENT_ANGLES = [330, 30, 90, 150, 210, 270]
const POINTER_DEG = 180
const BASE_DEG = 30
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
      if (userDetails) {
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

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center font-display overflow-hidden select-none">
      <div className="flex flex-col items-center w-full max-w-2xl px-4 py-8 space-y-8 md:space-y-12 h-screen justify-evenly">
        {/* Header: Logo + Title */}
        <div className="text-center z-10">
          <div className="mb-4 flex justify-center">
            <img
              alt="Helago Logo"
              className="h-16 md:h-20 w-auto object-contain drop-shadow-md"
              src={logoImg}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-wide drop-shadow-lg uppercase">
            Spin The Wheel
          </h1>
        </div>

        {/* Wheel */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="wheel-container bg-white dark:bg-gray-800">
            <div
              className="wheel-bg relative"
              style={{
                transition: `transform ${spinDurationMs / 1000}s cubic-bezier(0.2, 0.8, 0.2, 1)`,
                transform: `rotate(${-30 + rotation}deg)`,
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
          <div className="relative flex justify-center filter drop-shadow-2xl">
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

      {/* Congratulations modal */}
      {winningItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="congrats-title"
          onClick={goHome}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 md:p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="congrats-title"
              className="text-2xl md:text-3xl font-black text-primary mb-2"
            >
              Congratulations!
            </h2>
            <p className={`text-lg md:text-xl text-gray-700 dark:text-gray-300 ${saveFailed ? 'mb-2' : 'mb-6'}`}>
              You won the <span className="font-bold text-primary">{winningItem.alt}</span>!
            </p>
            {saveFailed && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
                Couldn&apos;t save your result. Please try again later.
              </p>
            )}
            <button
              type="button"
              onClick={goHome}
              className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
