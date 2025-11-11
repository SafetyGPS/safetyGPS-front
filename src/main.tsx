import React from 'react';
import 'antd/dist/reset.css';
import ReactDOM from 'react-dom/client';
import '@/app/index.css.ts';
import { HomePage } from '@/pages/home';
import { themeClass } from '@/styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className={themeClass}>
      <HomePage />
    </div>
  </React.StrictMode>,
);
