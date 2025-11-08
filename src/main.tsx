import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css'; // antd 기본 리셋
import './app/index.css.ts';
import MapButtons from './features/map/MapButtons';

import cctv from './assets/icons/cctv.png';
import light from './assets/icons/street-light.png';
import building from './assets/icons/police-station.png';

type ActiveState = { cctv: boolean; light: boolean; police: boolean };

function KakaoMapOnly({ active }: { active: ActiveState }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ cctv: any[]; light: any[]; police: any[] }>({
    cctv: [],
    light: [],
    police: [],
  });

  // mock 데이터
  const mockData = {
    cctv: [
      [37.2939, 127.0259],
      [37.2945, 127.0264],
      [37.2950, 127.0255],
    ],
    light: [
      [37.2937, 127.0268],
      [37.2945, 127.0261],
      [37.2929, 127.0258],
    ],
    police: [
      [37.2934, 127.0250],
      [37.2948, 127.0267],
      [37.2952, 127.0253],
    ],
  };

  // 지도 로드
  useEffect(() => {
    const appKey = (import.meta as any).env?.VITE_KAKAO_APP_KEY;
    if (!appKey) {
      console.error('Kakao app key missing. Set VITE_KAKAO_APP_KEY in .env');
      return;
    }

    const initMap = () => {
      if (!ref.current) return;
      const center = new (window as any).kakao.maps.LatLng(37.29396045, 127.025977);
      const map = new (window as any).kakao.maps.Map(ref.current, { center, level: 4 });
      mapRef.current = map;
    };

    if ((window as any).kakao?.maps) initMap();
    else {
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      script.async = true;
      script.onload = () => (window as any).kakao.maps.load(initMap);
      script.onerror = () => console.error('Failed to load Kakao Maps SDK');
      document.head.appendChild(script);
    }
  }, []);

  // 마커 on/off
  useEffect(() => {
    if (!mapRef.current || !(window as any).kakao?.maps) return;
    const kakao = (window as any).kakao.maps;

    // 기존 마커 제거
    Object.values(markersRef.current).forEach((arr) => arr.forEach((m) => m.setMap(null)));
    markersRef.current = { cctv: [], light: [], police: [] };

    // 상태에 따라 다시 생성
    if (active.cctv) {
      markersRef.current.cctv = mockData.cctv.map(([lat, lng]) =>
        new kakao.Marker({
          position: new kakao.LatLng(lat, lng),
          image: new kakao.MarkerImage(cctv, new kakao.Size(32,32)),
          map: mapRef.current,
        })
      );
    }

    if (active.light) {
      markersRef.current.light = mockData.light.map(([lat, lng]) =>
        new kakao.Marker({
          position: new kakao.LatLng(lat, lng),
          image: new kakao.MarkerImage(light, new kakao.Size(36,36)),
          map: mapRef.current,
        })
      );
    }

    if (active.police) {
      markersRef.current.police = mockData.police.map(([lat, lng]) =>
        new kakao.Marker({
          position: new kakao.LatLng(lat, lng),
          image: new kakao.MarkerImage(building, new kakao.Size(35,35)),
          map: mapRef.current,
        })
      );
    }
  }, [active]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100vh',
      }}
    />
  );
}

function App() {
  const [active, setActive] = useState<ActiveState>({
    cctv: false,
    light: false,
    police: false,
  });

  return (
    <div
      style={{
        position: 'relative', // ⬅️ 버튼이 좌측 상단에 정확히 고정되도록
        width: '100%',
        height: '100vh',
      }}
    >
      <KakaoMapOnly active={active} />
      <MapButtons active={active} setActive={setActive} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
