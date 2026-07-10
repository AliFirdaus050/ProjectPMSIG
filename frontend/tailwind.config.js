/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // toggle dark mode via class, sesuai kebutuhan Bagian 10 PRD
  theme: {
    extend: {
      colors: {
        // primary & status dipertahankan namanya (dipakai di banyak halaman lain),
        // nilainya disesuaikan ke tema baru "Industrial SaaS" dari Stitch.
        primary: {
          DEFAULT: '#2563eb', // Cobalt — tombol aksi utama, link aktif
          dark: '#1d4ed8', // hover state
        },
        status: {
          normal: '#16A34A',
          error: '#DC2626',
          warning: '#D97706',
        },
        // Warna navy khusus top navigation bar (bukan "primary", supaya gak
        // ketuker sama warna tombol aksi).
        navy: {
          DEFAULT: '#0F172A',
        },
        // Token tambahan dari design system Stitch, dipakai pas reskin
        // halaman satu-satu (nama persis sama biar gampang nyalin dari
        // kode Stitch tanpa perlu translate nama kelas).
        surface: {
          DEFAULT: '#f7f9fb',
          dim: '#d8dadc',
          bright: '#f7f9fb',
          'container-lowest': '#ffffff',
          'container-low': '#f2f4f6',
          container: '#eceef0',
          'container-high': '#e6e8ea',
          'container-highest': '#e0e3e5',
          variant: '#e0e3e5',
          tint: '#0053db',
        },
        'on-surface': '#191c1e',
        'on-surface-variant': '#434655',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f3',
        outline: {
          DEFAULT: '#737686',
          variant: '#c3c6d7',
        },
        secondary: {
          DEFAULT: '#565e74',
          container: '#dae2fd',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#5c647a',
        tertiary: {
          DEFAULT: '#46566c',
          container: '#5e6e85',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#e9f0ff',
        background: '#f7f9fb',
        'on-background': '#191c1e',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      spacing: {
        unit: '4px',
        gutter: '16px',
        'stack-compact': '8px',
        'stack-comfortable': '16px',
        'margin-mobile': '16px',
        'margin-desktop': '32px',
      },
      maxWidth: {
        'container-max': '1440px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'headline-lg': ['IBM Plex Sans', 'sans-serif'],
        'headline-md': ['IBM Plex Sans', 'sans-serif'],
        'headline-sm': ['IBM Plex Sans', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        'data-mono': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'data-mono': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};