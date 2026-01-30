import logoImg from '../assets/new/Logo.png'

export default function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex flex-col items-center pt-6 pb-3 safe-area-inset">
      <div className="mb-6 mt-12 md:mt-20 flex justify-center">
        <img
          alt="HelaGo Logo"
          className="h-44 md:h-64 lg:h-72 w-auto object-contain drop-shadow-md"
          src={logoImg}
        />
      </div>

    </header>
  )
}
