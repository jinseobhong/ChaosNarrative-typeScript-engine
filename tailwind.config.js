/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: {
          950: '#06070b',
          900: '#0b0d14',
          850: '#0f121d',
          800: '#141827',
          750: '#1a1f33',
          700: '#222944',
          600: '#2f395d',
          500: '#465381',
          400: '#6d7ea8',
          300: '#9cb0d4',
          200: '#cad6eb',
          100: '#edf2f9',
        },
        neon: {
          purple: '#9d4edd',
          violet: '#7b2cbf',
          pink: '#f72585',
          rose: '#e63946',
          cyan: '#4cc9f0',
          emerald: '#10b981',
          amber: '#ffb703',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Cinzel', 'Noto Serif KR', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-purple': '0 0 15px -2px rgba(157, 78, 221, 0.4), 0 0 6px -2px rgba(157, 78, 221, 0.2)',
        'neon-cyan': '0 0 15px -2px rgba(76, 201, 240, 0.4), 0 0 6px -2px rgba(76, 201, 240, 0.2)',
        'neon-pink': '0 0 15px -2px rgba(247, 37, 133, 0.4), 0 0 6px -2px rgba(247, 37, 133, 0.2)',
        'neon-amber': '0 0 15px -2px rgba(255, 183, 3, 0.4), 0 0 6px -2px rgba(255, 183, 3, 0.2)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 70%)',
        'subtle-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
