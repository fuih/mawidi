/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
            DEFAULT: 'hsl(var(--sidebar-background))',
            foreground: 'hsl(var(--sidebar-foreground))',
            primary: 'hsl(var(--sidebar-primary))',
            'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
            accent: 'hsl(var(--sidebar-accent))',
            'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
            border: 'hsl(var(--sidebar-border))',
            ring: 'hsl(var(--sidebar-ring))'
        },
        mawidi: {
            emerald: '#039D77',
            navy: '#112142',
            oxygen: '#F8FAFC',
            sky: '#E0F2FE',
            'emerald-light': '#04b589',
            'emerald-dark': '#027a5c',
            'navy-light': '#1a3260',
        }
      },
      fontFamily: {
          heading: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          display: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          jakarta: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          mono: ['var(--font-mono)']
      },
      fontSize: {
          'hero': ['5rem', { lineHeight: '1.05', fontWeight: '800' }],
          'hero-md': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
          'hero-sm': ['2.5rem', { lineHeight: '1.15', fontWeight: '800' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
        },
        'spin-slow': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      backdropBlur: {
          '3xl': '40px',
      },
      boxShadow: {
          'emerald': '0 0 0 3px rgba(3, 157, 119, 0.15)',
          'emerald-lg': '0 8px 32px rgba(3, 157, 119, 0.25)',
          'glass': '0 8px 32px rgba(17, 33, 66, 0.08)',
          'glass-lg': '0 20px 60px rgba(17, 33, 66, 0.12)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
