/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--parchment))',
        },
        ink: 'hsl(var(--foreground))',
        parchment: {
          DEFAULT: 'hsl(var(--background))',
          container: 'hsl(var(--muted))',
          high: 'hsl(var(--accent))',
        },
        border: 'hsl(var(--foreground))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--primary))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
        mono: ['Space Grotesk', 'monospace'],
        display: ['Newsreader', 'serif'],
        tech: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        standard: '4px 4px 0px 0px hsl(var(--foreground))',
        'high-impact': '8px 8px 0px 0px hsl(var(--foreground))',
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0px',
        lg: '0px',
        md: '0px',
        sm: '0px',
      },
    },
  },
  plugins: [],
}
