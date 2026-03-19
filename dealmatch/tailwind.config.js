/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        blush: '#E8C4A0',
        terracotta: {
          DEFAULT: '#C96A3A',
          50:  '#FDF3EC',
          100: '#F9E0CC',
          200: '#F2C09A',
          300: '#E89E68',
          400: '#DE7C47',
          500: '#C96A3A',
          600: '#A8522A',
          700: '#863E1E',
          800: '#652E15',
          900: '#431E0C',
        },
        gold: '#D4A853',
        sage: '#7A9E7E',
        deep: '#1A1210',
        charcoal: '#2D2420',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 60px rgba(26,18,16,0.12)',
        'card-hover': '0 32px 80px rgba(26,18,16,0.2)',
        glow: '0 8px 32px rgba(201,106,58,0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        'fade-in': 'fadeIn 0.4s ease both',
        float: 'float 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
