import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
globalStyle('html, body, #root', { height: '100%' });
globalStyle('body', {
  margin: 0,
  backgroundColor: vars.color.bg as string,
  color: vars.color.text as string,
  fontFamily: vars.font.body as string,
});
