import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(0.72 0.191 264.376)',
          foreground: 'oklch(0.985 0 0)',
        },
        secondary: {
          DEFAULT: 'oklch(0.97 0 0)',
          foreground: 'oklch(0.205 0 0)',
        },
        accent: {
          DEFAULT: 'oklch(0.65 0.234 303.9)',
          foreground: 'oklch(0.985 0 0)',
        },
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.145 0 0)',
        card: {
          DEFAULT: 'oklch(1 0 0)',
          foreground: 'oklch(0.145 0 0)',
        },
        popover: {
          DEFAULT: 'oklch(1 0 0)',
          foreground: 'oklch(0.145 0 0)',
        },
        muted: {
          DEFAULT: 'oklch(0.97 0 0)',
          foreground: 'oklch(0.556 0 0)',
        },
        destructive: {
          DEFAULT: 'oklch(0.577 0.245 27.325)',
          foreground: 'oklch(0.985 0 0)',
        },
        border: 'oklch(0.922 0 0)',
        input: 'oklch(0.922 0 0)',
        ring: 'oklch(0.72 0.191 264.376)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  darkMode: ["class"],
  plugins: [],
}

export default config