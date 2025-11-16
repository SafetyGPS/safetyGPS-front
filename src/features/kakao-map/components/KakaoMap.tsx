import React, { useEffect, useRef } from 'react';
import cctv from '../../../assets/icons/cctv.png';
import building from '../../../assets/icons/security-center.png';
import light from '../../../assets/icons/street-light.png';
import type { MapMarkerData } from '../../../entities/map-layer';
import type { DongBoundary } from '../../map-search/types';
import type { KakaoMaps, Map as KakaoMapType, Marker, Polygon } from '../../../types/kakao';

export interface KakaoMapProps {
  active: { cctv: boolean; light: boolean; police: boolean };
  selectedDong: DongBoundary | null;
  onKakaoReady?: (kakao: KakaoMaps) => void;
  cctvLocations?: MapMarkerData[];
  securityLightLocations?: MapMarkerData[];
  facilityLocations?: MapMarkerData[];
}

export const DEFAULT_CENTER = { lat: 37.29396045, lng: 127.025977 };
export const WORLD_MASK_PATH = [
  { lat: 85, lng: -180 },
  { lat: 85, lng: 180 },
  { lat: -85, lng: 180 },
  { lat: -85, lng: -180 },
];

export const KakaoMap: React.FC<KakaoMapProps> = ({
  active,
  selectedDong,
  onKakaoReady,
  cctvLocations = [],
  securityLightLocations = [],
  facilityLocations = [],
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapType | null>(null);
  const markersRef = useRef<{ cctv: Marker[]; light: Marker[]; police: Marker[] }>({
    cctv: [],
    light: [],
    police: [],
  });
  const boundaryRef = useRef<Polygon | null>(null);
  const maskRef = useRef<Polygon | null>(null);
  const readyCallbackRef = useRef(onKakaoReady);

  useEffect(() => {
    readyCallbackRef.current = onKakaoReady;
  }, [onKakaoReady]);

  useEffect(() => {
    const jsKey = import.meta.env.VITE_KAKAO_JS_KEY || import.meta.env.VITE_KAKAO_APP_KEY;

    console.log('카카오 지도 초기화 시작');
    console.log('JavaScript 키:', jsKey ? `${jsKey.substring(0, 10)}...` : '없음');

    if (!jsKey) {
      console.error(
        '❌ Kakao JavaScript key missing. Set VITE_KAKAO_JS_KEY or VITE_KAKAO_APP_KEY in .env',
      );
      return;
    }

    const initMap = () => {
      if (!ref.current) {
        console.error('❌ 지도 컨테이너 ref가 없습니다');
        return;
      }

      try {
        const kakao = window.kakao;
        if (!kakao?.maps) {
          console.error('❌ 카카오 지도 SDK가 로드되지 않았습니다');
          return;
        }

        console.log('✅ 카카오 지도 SDK 로드 완료, 지도 초기화 중...');
        const center = new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        const map = new kakao.maps.Map(ref.current, { center, level: 4 });
        mapRef.current = map;
        console.log('✅ 지도 초기화 완료');
        readyCallbackRef.current?.(kakao);
      } catch (error) {
        console.error('❌ 지도 초기화 오류:', error);
      }
    };

    if (window.kakao?.maps) {
      console.log('카카오 지도 SDK 이미 로드됨');
      initMap();
    } else {
      console.log('카카오 지도 SDK 스크립트 로드 중...');
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        console.log('✅ 카카오 지도 SDK 스크립트 로드 완료');
        window.kakao?.maps.load(() => {
          console.log('✅ 카카오 지도 SDK 로드 완료');
          initMap();
        });
      };
      script.onerror = (error: ErrorEvent) => {
        console.error('❌ 카카오 지도 SDK 스크립트 로드 실패:', error);
        console.error('API 키를 확인하세요:', jsKey);
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const kakao = window.kakao.maps;

    Object.values(markersRef.current).forEach((arr) => arr.forEach((m) => m.setMap(null)));
    markersRef.current = { cctv: [], light: [], police: [] };

    if (active.cctv && cctvLocations.length) {
      markersRef.current.cctv = cctvLocations.map(
        ({ lat, lng, label }) =>
          new kakao.Marker({
            position: new kakao.LatLng(lat, lng),
            image: new kakao.MarkerImage(cctv, new kakao.Size(26, 26)),
            title: label,
            map: mapRef.current,
          }),
      );
    }

    if (active.light && securityLightLocations.length) {
      markersRef.current.light = securityLightLocations.map(
        ({ lat, lng, label }) =>
          new kakao.Marker({
            position: new kakao.LatLng(lat, lng),
            image: new kakao.MarkerImage(light, new kakao.Size(22, 22)),
            title: label,
            map: mapRef.current,
          }),
      );
    }

    if (active.police && facilityLocations.length) {
      markersRef.current.police = facilityLocations.map(
        ({ lat, lng, label }) =>
          new kakao.Marker({
            position: new kakao.LatLng(lat, lng),
            image: new kakao.MarkerImage(building, new kakao.Size(39, 39)),
            title: label,
            map: mapRef.current,
          }),
      );
    }
  }, [active, cctvLocations, securityLightLocations, facilityLocations]);

  useEffect(() => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;

    boundaryRef.current?.setMap(null);
    maskRef.current?.setMap(null);
    boundaryRef.current = null;
    maskRef.current = null;

    if (!selectedDong?.path?.length) return;

    const highlightPath = selectedDong.path.map(
      (coord) => new kakao.maps.LatLng(coord.lat, coord.lng),
    );

    boundaryRef.current = new kakao.maps.Polygon({
      path: highlightPath,
      strokeWeight: 4,
      strokeColor: '#1890ff',
      strokeOpacity: 1,
      fillColor: '#1890ff',
      fillOpacity: 0.3,
      zIndex: 6,
    });
    boundaryRef.current.setMap(mapRef.current);

    const outerPath = WORLD_MASK_PATH.map(({ lat, lng }) => new kakao.maps.LatLng(lat, lng));

    maskRef.current = new kakao.maps.Polygon({
      path: [outerPath, highlightPath],
      strokeWeight: 0,
      fillColor: '#000000',
      fillOpacity: 0.6,
      zIndex: 5,
    });
    maskRef.current.setMap(mapRef.current);

    const bounds = new kakao.maps.LatLngBounds();
    highlightPath.forEach((latLng) => bounds.extend(latLng));
    mapRef.current.setBounds(bounds);
  }, [selectedDong]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100vh',
      }}
    />
  );
};

export default KakaoMap;
