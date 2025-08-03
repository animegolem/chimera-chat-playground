/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Hack', 'Courier New', 'monospace'],
        'sans': ['Hack', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Gruvbox color palette
        gruv: {
          // Dark theme colors
          'dark': '#1d2021',
          'dark-soft': '#282828',
          'dark-hard': '#1b1b1b',
          
          // Medium tones
          'medium': '#504945',
          'medium-soft': '#665c54',
          
          // Light tones
          'light': '#ebdbb2',
          'light-soft': '#d5c4a1',
          'light-hard': '#f9f5d7',
          
          // Accent colors
          'red': '#cc241d',
          'red-bright': '#fb4934',
          'green': '#98971a', 
          'green-bright': '#b8bb26',
          'yellow': '#d79921',
          'yellow-bright': '#fabd2f',
          'blue': '#458588',
          'blue-bright': '#83a598',
          'purple': '#b16286',
          'purple-bright': '#d3869b',
          'aqua': '#689d6a',
          'aqua-bright': '#8ec07c',
          'orange': '#d65d0e',
          'orange-bright': '#fe8019',
        }
      },
      backgroundColor: {
        'primary': '#1d2021',
        'secondary': '#282828',
        'accent': '#3c3836',
      },
      textColor: {
        'primary': '#ebdbb2',
        'secondary': '#a89984',
        'muted': '#504945',
      },
      borderColor: {
        'primary': '#3c3836',
        'secondary': '#504945',
      }
    },
  },
  plugins: [],
}