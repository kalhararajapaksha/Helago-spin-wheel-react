# HelaGo Spin Wheel (React)

Pixel-perfect React UI for the HelaGo spin wheel: user details form → spin wheel → congratulations modal. User name, contact, and won gift are saved to Firestore **after** each spin. Tapping **Awesome!** (or the modal backdrop) returns to the form for the next player.

## Setup

```bash
npm install
```

### Firebase

1. Copy `.env.example` to `.env`.
2. In [Firebase Console](https://console.firebase.google.com) → your project **helagospinwheel** → Project settings → Your apps, copy the config values into `.env`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=helagospinwheel.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=helagospinwheel
   VITE_FIREBASE_STORAGE_BUCKET=helagospinwheel.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. Enable **Firestore**: Build → Firestore Database → Create database (start in test mode for dev, then add rules for production).
4. **Users + results**: The `users` collection stores one document per spin: `{ name, contact, wonGift, createdAt }`. It is created on first write. Ensure Firestore rules allow **create** on `users`.
5. **Stock control**: Create collection `giftItems` with document `helago` containing an `items` field (array of 6 booleans). Index `i` = wheel segment `i`; `true` = in stock, `false` = out of stock. The wheel never lands on out-of-stock segments. Example: `{ "items": [true, true, false, true, true, true] }`. Ensure Firestore rules allow **read** on `giftItems/helago`.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Flow: user details form → spin wheel → congratulations modal → **Awesome!** → back to form for the next player. Each result (name, contact, won gift) is saved to Firestore after the spin.

## Build

```bash
npm run build
npm run preview
```

## Assets

Move these files into `src/assets/`:

| File | Use |
|------|-----|
| `HelaGoLogo.png` | Logo (top) |
| `SpinButton.png` | Center Go button |
| `Cap.png` | Wheel icon |
| `Pen.png` | Wheel icon |
| `Tshirt.png` | Wheel icon |
| `Arrow.png` | Optional |

## Tech

- Vite + React 18
- Tailwind CSS (custom HelaGo colors, wheel layout)
- Firebase (Firestore) for user details (name, 10-digit contact) and stock (`giftItems/helago` → `items` array)
