import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './app/index.css.ts';

function KakaoMapOnly() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const appKey = (import.meta as any).env?.VITE_KAKAO_APP_KEY as string | undefined;
    if (!appKey) {
      console.error('Kakao app key missing. Set VITE_KAKAO_APP_KEY in .env');
      return;
    }

    if ((window as any).kakao?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      appKey
    )}&autoload=false`;
    script.async = true;
    script.onload = () => {
      (window as any).kakao.maps.load(() => initMap());
    };
    script.onerror = () => console.error('Failed to load Kakao Maps SDK');
    document.head.appendChild(script);

    function initMap() {
      if (!ref.current) return;
      const center = new (window as any).kakao.maps.LatLng(37.29396045, 127.025977);
      const map = new (window as any).kakao.maps.Map(ref.current, {
        center,
        level: 4,
      });
      new (window as any).kakao.maps.Marker({ position: center }).setMap(map);
    }
  }, []);

  return <div ref={ref} style={{ width: '100%', height: '100vh' }} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KakaoMapOnly />
  </React.StrictMode>
);
