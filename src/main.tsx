import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import '@/app/index.css.ts';
import { themeClass } from '@/styles/theme.css';
import { HomePage } from '@/pages/home';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className={themeClass}>
      <HomePage />
    </div>
  </React.StrictMode>
);
