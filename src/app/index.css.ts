import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
globalStyle('html, body, #root', { height: '100%' });
globalStyle('body', {
  margin: 0,
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.body,
});

