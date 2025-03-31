/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'dark': {
          'bg-primary': '#12121B',
          'bg-secondary': '#1E1E2F',
          'bg-tertiary': '#262637',
          'bg-hover': '#2E2E3F',
          'bg-active': '#343444',
          'text-primary': '#FFFFFF',
          'text-secondary': '#E1E1E6',
          'text-muted': '#888888',
          'accent-primary': '#5865F2',
          'accent-hover': '#4752C4',
          'accent-muted': '#4B4B71',
          'border': '#444444',
          'message-sent': '#2E2E3F',
          'message-received': '#343444',
          'online': '#5ADB6B',
          'input-bg': '#2A2A3C',
          'input-border': '#444444',
          'input-focus': '#4752C4',
          'error': '#FF5555',
          'error-bg': 'rgba(255, 85, 85, 0.1)'
        },
      },
      spacing: {
        'chat-padding': '16px',
        'message-gap': '12px',
        'section-gap': '24px',
      },
      maxWidth: {
        'chat-container': '1200px',
        'message': '70%',
      },
      boxShadow: {
        'message': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'input': '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'message': '12px',
        'input': '8px',
        'button': '8px',
        'avatar': '50%',
      },
      fontSize: {
        'chat-title': '18px',
        'message-preview': '14px',
        'timestamp': '12px',
        'input': '16px',
      },
      lineHeight: {
        'chat': '1.5',
        'message': '1.6',
      },
      transitionProperty: {
        'smooth': 'all',
      },
      transitionDuration: {
        'smooth': '200ms',
      },
      transitionTimingFunction: {
        'smooth': 'ease-in-out',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 