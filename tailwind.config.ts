import preset from './src/tailwind-preset';

export default {
  content: ['./index.html', './src/**/*.{vue,ts}', './tests/**/*.ts'],
  presets: [preset]
};
