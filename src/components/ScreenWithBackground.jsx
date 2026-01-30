import bgImg from '../assets/new/BG.png'

/**
 * Full-screen layout with HelaGo BG.png. Content is wrapped inside the background
 * for vertical kiosk / touch screens. Use on every screen so the bg and frame are consistent.
 */
export default function ScreenWithBackground({ children, className = '' }) {
  return (
    <div
      className={`min-h-dvh w-full flex flex-col items-center font-display overflow-hidden select-none relative ${className}`}
      style={{
        // Background fills viewport; content sits on top
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1a2e24', // fallback if image loads slowly
      }}
    >
      {/* Content wrapper: keeps UI inside the visible frame (inside jagged border area) */}
      <div className="relative z-0 flex-1 w-full flex flex-col items-center overflow-auto">
        {children}
      </div>
    </div>
  )
}
