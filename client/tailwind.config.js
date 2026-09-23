import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Acumin Pro', 'sans-serif'],
				display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
				heading: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
				serif: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
			},
			letterSpacing: {
				luxe: '0.2em',
				'luxe-lg': '0.3em',
				'luxe-xl': '0.4em',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				mwp: {
					red: '#C9A227',
					redDark: '#A6841C',
					crimson: '#8B6914',
					black: '#09090B',
					carbon: '#121216',
					steel: '#27272A',
					silver: '#E2E8F0',
					chrome: '#F8FAFC',
					muted: '#A1A1AA',
					cyan: '#06B6D4',
				},
				brand: {
					black: '#09090B',
					white: '#FFFFFF',
					gray: '#F4F4F5',
					silver: '#E2E8F0',
					dark: '#121216',
					heading: '#09090B',
					paragraph: '#52525B',
					red: '#C9A227',
					gold: '#C9A227',
					goldLight: '#E5C56A',
					goldDark: '#8B6914',
					success: '#10B981',
					error: '#C9A227',
				},
				noir: {
					DEFAULT: '#09090B',
					soft: '#18181B',
					mist: '#27272A',
				},
				ivory: {
					DEFAULT: '#FAFAFA',
					deep: '#F4F4F5',
					warm: '#FFFFFF',
				},
				gold: {
					DEFAULT: '#C9A227',
					light: '#E5C56A',
					dark: '#8B6914',
					50: '#FBF7EA',
					100: '#F5ECCF',
					200: '#EBD9A0',
					300: '#E0C46E',
					400: '#D4AF37',
					500: '#C9A227',
					600: '#A6841C',
					700: '#8B6914',
					800: '#6B5010',
					900: '#4A370B',
				},
				red: {
					50: '#FBF7EA',
					100: '#F5ECCF',
					200: '#EBD9A0',
					300: '#E0C46E',
					400: '#D4AF37',
					500: '#C9A227',
					600: '#A6841C',
					700: '#8B6914',
					800: '#6B5010',
					900: '#4A370B',
					950: '#2E2206',
				},
				stone: {
					DEFAULT: '#71717A',
					dark: '#3F3F46',
				},
				line: '#E4E4E7',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'var(--radius)',
				sm: 'var(--radius)',
			},
			transitionDuration: {
				400: '400ms',
				600: '600ms',
				800: '800ms',
				1200: '1200ms',
			},
			transitionTimingFunction: {
				luxe: 'cubic-bezier(0.22, 1, 0.36, 1)',
			},
			keyframes: {
				'marquee-x': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-50%)' },
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				'slow-zoom': {
					from: { transform: 'scale(1.04)' },
					to: { transform: 'scale(1)' },
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' },
				},
				'spin-slow': {
					to: { transform: 'rotate(360deg)' },
				},
				'float-y': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-8px)' },
				},
			},
			animation: {
				'marquee-x': 'marquee-x 40s linear infinite',
				'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
				'slow-zoom': 'slow-zoom 1.4s cubic-bezier(0.22, 1, 0.36, 1) both',
				shimmer: 'shimmer 2s linear infinite',
				'spin-slow': 'spin-slow 20s linear infinite',
				'float-y': 'float-y 6s ease-in-out infinite',
			},
		}
	},
	plugins: [animate],
};
