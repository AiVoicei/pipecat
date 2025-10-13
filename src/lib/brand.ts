// AI Voicei Brand Configuration
export const BRAND = {
  name: 'AI Voicei',
  tagline: 'השיחה החכמה בעברית',
  description: 'מערכת שיחה מתקדמת עם בינה מלאכותית בעברית',
  
  // Colors - Hebrew AI theme
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe', 
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      900: '#0c4a6e',
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
    },
    accent: {
      50: '#f5f3ff',
      100: '#ede9fe',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
    }
  },
  
  // Typography - Supporting Hebrew
  fonts: {
    display: ['Rubik', 'system-ui', 'sans-serif'],
    body: ['Inter', 'Rubik', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace']
  },
  
  // Gradients
  gradients: {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600',
    hero: 'bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50',
    card: 'bg-gradient-to-br from-white to-blue-50/30'
  }
} as const;

// Hebrew RTL support
export const RTL_CONFIG = {
  direction: 'rtl' as const,
  textAlign: 'right' as const,
  lang: 'he'
} as const;