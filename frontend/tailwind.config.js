/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // toggle dark mode via class, sesuai kebutuhan Bagian 10 PRD
  theme: {
    extend: {
      colors: {
        // Palet warna korporat sesuai Bagian 10 PRD
        primary: {
          DEFAULT: '#1E293B',
          dark: '#0F172A',
        },
        status: {
          normal: '#16A34A',
          error: '#DC2626',
          warning: '#D97706',
        },
      },
    },
  },
  plugins: [],
};
