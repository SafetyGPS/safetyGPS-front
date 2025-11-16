import React from 'react';
import 'antd/dist/reset.css';
import ReactDOM from 'react-dom/client';
import { HomePage } from './pages/home';
import { themeClass } from './theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className={themeClass}>
      <HomePage />
    </div>
  </React.StrictMode>,
);
