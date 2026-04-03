/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sis-navy':       '#0f172a',
        'sis-navy-light': '#1e293b',
        'sis-navy-muted': '#334155',
        'sis-cyan':       '#06b6d4',
        'sis-cyan-dark':  '#0891b2',
        'sis-cyan-light': '#67e8f9',
      },
    },
  },
  plugins: [],
};
