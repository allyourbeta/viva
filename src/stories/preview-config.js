/**
 * Storybook preview configuration.
 * Imports global CSS so stories render with the Viva design system.
 * Copy this file to .storybook/preview.js
 */
import '../index.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: {
      default: 'paper',
      values: [
        { name: 'paper', value: '#F7F1E3' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
