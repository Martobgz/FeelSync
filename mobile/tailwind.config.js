module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1D9E75',
          mid: '#5DCAA5',
          light: '#9FE1CB',
        },
      },
    },
  },
  darkMode: 'class',
};
