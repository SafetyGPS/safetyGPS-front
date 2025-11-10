import React, { useCallback, useState } from 'react';
import type { DongBoundary } from '@/features/map-search/types';
import { KakaoMap } from '@/features/kakao-map';
import { MapButtons } from '@/features/map-buttons';
import { MapSearch } from '@/features/map-search';

type ActiveState = { cctv: boolean; light: boolean; police: boolean };

export const HomePage: React.FC = () => {
  const [active, setActive] = useState<ActiveState>({
    cctv: false,
    light: false,
    police: false,
  });
  const [selectedDong, setSelectedDong] = useState<DongBoundary | null>(null);
  const [kakaoObj, setKakaoObj] = useState<any | null>(
    () => (typeof window !== 'undefined' ? (window as any).kakao ?? null : null)
  );
  
  const handleKakaoReady = useCallback((kakao: any) => {
    setKakaoObj(kakao);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
      }}
    >
      <KakaoMap
        active={active}
        selectedDong={selectedDong}
        onKakaoReady={handleKakaoReady}
      />
      <MapButtons active={active} setActive={setActive} />
      <MapSearch kakao={kakaoObj} onSelectDong={setSelectedDong} />
    </div>
  );
};

export default HomePage;

