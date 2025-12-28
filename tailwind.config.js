/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Matches App.tsx in the root directory
    './App.{js,jsx,ts,tsx}', 
    
    // Matches EVERYTHING inside the src folder (components, screens, navigation, hooks, etc.)
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};