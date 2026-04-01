const { brand, status } = require('./src/constants/colors');

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand,
        status,
      },
    },
  },
  darkMode: 'class',
};
