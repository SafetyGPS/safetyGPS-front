import { createTheme } from '@vanilla-extract/css';

export const [themeClass, vars] = createTheme({
  color: {
    bg: '#0b132b',
    text: '#f6f7fb',
  },
  font: {
    body: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
  }
});

