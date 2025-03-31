/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'discord': {
          'bg-primary': '#1E1E2F',
          'bg-secondary': '#262637',
          'bg-tertiary': '#2E2E3F',
          'bg-hover': '#343444',
          'bg-active': '#3C3C4F',
          'text-primary': '#FFFFFF',
          'text-secondary': '#E1E1E6',
          'text-muted': '#888888',
          'interactive-primary': '#5865F2',
          'interactive-hover': '#4752C4',
          'interactive-muted': '#4B4B71',
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
        'message': '8px',
        'input': '6px',
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
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 