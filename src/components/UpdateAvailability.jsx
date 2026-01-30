import { useState, useEffect, useCallback } from 'react'
import { getDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ScreenWithBackground from './ScreenWithBackground'

const GIFT_ITEMS_DOC = { collection: 'giftItems', id: 'helago' }

const ITEM_LABELS = [
  { index: 0, label: 'Bandana' },
  { index: 1, label: 'Sticker' },
  { index: 2, label: 'Tshirt' },
  { index: 3, label: 'Wristband' },
  { index: 4, label: 'Sticker' },
  { index: 5, label: 'Hat' },
]

function UpdateAvailability() {
  const [items, setItems] = useState([true, true, true, true, true, true])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const docRef = doc(db, GIFT_ITEMS_DOC.collection, GIFT_ITEMS_DOC.id)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const snap = await getDoc(docRef)
      const data = snap.exists() ? snap.data() : null
      const arr = Array.isArray(data?.items) ? data.items : []
      const next = [0, 1, 2, 3, 4, 5].map((i) => arr[i] === true)
      setItems(next)
    } catch (err) {
      setError(err?.message || 'Failed to load availability.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = useCallback(
    async (index) => {
      if (saving) return
      const next = [...items]
      next[index] = !next[index]
      setItems(next)
      setSaving(true)
      setError(null)
      try {
        await setDoc(docRef, { items: next }, { merge: true })
      } catch (err) {
        setError(err?.message || 'Failed to save.')
        load()
      } finally {
        setSaving(false)
      }
    },
    [items, saving, load]
  )

  if (loading) {
    return (
      <ScreenWithBackground>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-lg">Loading…</p>
        </div>
      </ScreenWithBackground>
    )
  }

  return (
    <ScreenWithBackground>
      <div className="flex-1 w-full flex flex-col items-center pt-20 px-4 pb-8">
      <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">
        Update index availability
      </h1>
      <p className="text-white/80 text-sm mb-8">
        Toggle each item to set whether it can be won on the wheel.
      </p>

      {error && (
        <p className="text-red-300 text-sm font-medium mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="w-full max-w-md space-y-4">
        {ITEM_LABELS.map(({ index, label }) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-white/10 border border-white/20"
          >
            <span className="text-white font-medium">
              {index} – {label}
            </span>
            <button
              type="button"
              onClick={() => toggle(index)}
              disabled={saving}
              role="switch"
              aria-checked={items[index]}
              aria-label={`${items[index] ? 'Available' : 'Unavailable'}: ${label}`}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-60 ${
                items[index] ? 'bg-[#f5ff00]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition ${
                  items[index] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <a
        href="/"
        className="mt-10 px-6 py-3 bg-black text-[#f5ff00] font-bold text-lg rounded-lg hover:opacity-90 transition touch-target"
      >
        Back to Spin Wheel
      </a>
      </div>
    </ScreenWithBackground>
  )
}

export default UpdateAvailability
