/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arpg: {
          darkest: '#08090c',
          dark: '#0e1117',
          panel: '#151922',
          surface: '#1c2230',
          border: '#283145',
          'border-light': '#3b4661',
          muted: '#64748b',
          text: '#e2e8f0',
        },
        poe: {
          unique: '#af6025',
          'unique-light': '#c9772f',
          'unique-bright': '#e59133',
          gold: '#d4af37',
          'gold-light': '#e9ca65',
          chaos: '#b89758',
          divine: '#e8d279',
          gem: '#1ba27a',
          red: '#c0392b',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        display: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 15px rgba(201, 119, 47, 0.35)',
        'glow-gold': '0 0 15px rgba(212, 175, 55, 0.35)',
      },
    },
  },
  plugins: [],
};
