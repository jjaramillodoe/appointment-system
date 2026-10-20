/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
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
          // NYC Public Schools Blue Palette
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#0066cc', // Main NYC DOE Blue
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
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
          // Accent colors combining blue and yellow
          blue: '#0066cc',
          'blue-light': '#1a75ff',
          'blue-dark': '#003d7a',
          yellow: '#ffd700',
          'yellow-light': '#ffed99',
          'yellow-dark': '#ccac00',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        yellow: {
          // NYC Public Schools Yellow/Gold Palette
          50: '#fffbf0',
          100: '#fff4cc',
          200: '#ffed99',
          300: '#ffe666',
          400: '#ffdf33',
          500: '#ffd700', // Golden Yellow
          600: '#ccac00',
          700: '#998100',
          800: '#665600',
          900: '#332b00',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        // NYC DOE / District 79 Adult Education — navy + gold mesh over soft cool base
        'd79-mesh':
          'radial-gradient(ellipse 120% 70% at 50% -25%, rgba(0, 102, 204, 0.14), transparent 55%), radial-gradient(ellipse 90% 60% at 100% 20%, rgba(255, 215, 0, 0.1), transparent 50%), radial-gradient(ellipse 70% 50% at 0% 85%, rgba(0, 61, 122, 0.08), transparent 45%), linear-gradient(165deg, #f8fafc 0%, #eef4ff 42%, #fffbf0 100%)',
      },
      boxShadow: {
        'd79-card': '0 4px 24px -4px rgba(0, 41, 82, 0.12), 0 0 0 1px rgba(0, 102, 204, 0.06)',
        'd79-hero': '0 25px 50px -12px rgba(0, 41, 82, 0.18), 0 0 0 1px rgba(255, 215, 0, 0.15)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 