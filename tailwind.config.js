/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use a clean Korean-friendly sans-serif stack
        game: ['\'Noto Sans KR\'', '\'Apple SD Gothic Neo\'', 'sans-serif'],
      },
      colors: {
        'game-dark': '#0d0d2b',
        'game-panel': 'rgba(10, 10, 30, 0.92)',
        'game-border': '#4a6fa5',
        'game-accent': '#f0c040',
        'game-text': '#f0eee8',
        'game-speaker': '#a8d4ff',
      },
      animation: {
        'typewriter-cursor': 'blink 1s step-end infinite',
        'card-slide-in': 'slideUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'birthday-pop': 'pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideUp: {
          from: { transform: 'translateY(40px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
