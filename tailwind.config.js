/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2b925d',
        accent: '#2f4f41',
        darkseg: '#1b1b1b',
        'background-light': '#2b925d',
        'background-dark': '#1a1a1a',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        bebas: ['Bebas Neue', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        wheel: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        button: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06), inset 0 -4px 4px rgba(0,0,0,0.1)',
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
