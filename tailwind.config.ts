import type { Config } from 'tailwindcss';

export default {
    content: [
        './index.html',
        './**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                'brand-bg': '#121212',
                'brand-surface': '#1e1e1e',
                'brand-primary': '#6a44ff',
                'brand-secondary': '#a855f7',
                'brand-accent': '#f472b6',
                'brand-text-light': '#e5e7eb',
                'brand-text-dark': '#9ca3af',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-in-out',
                'spin': 'spin 1s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                spin: {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
