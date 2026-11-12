/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#111318',
          card: '#1a1d24',
          accent: '#e63946',
          warning: '#f4a261',
          success: '#2a9d8f',
          surface: '#242833',
        }
      },
      fontFamily: {
        pixel: ['monospace', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
