import { createTheme, createThemeContract } from '@vanilla-extract/css';

export const vars = createThemeContract({
  color: {
    bg: '',
    text: '',
  },
  font: {
    body: '',
  },
});

// 실제 테마 값 적용 (클래스 생성)
export const themeClass = createTheme(vars, {
  color: {
    bg: '#ffffff',
    text: '#000000',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});
