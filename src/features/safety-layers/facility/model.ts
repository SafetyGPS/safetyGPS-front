import { useEffect, useState } from 'react';
import type { MapMarkerData } from '../../../entities/map-layer';
import { buildMarker } from '../../../shared/lib/mapMarkers';
import { fetchFacilities, syncFacilityData } from './api';

export interface UseFacilityLayerOptions {
  active: boolean;
  sigunNm?: string;
  gu?: string;
  dong?: string;
  onError?: (errorMessage: string) => void;
}

export const useFacilityLayer = ({
  active,
  sigunNm,
  gu,
  dong,
  onError,
}: UseFacilityLayerOptions): MapMarkerData[] => {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      setMarkers([]);
      return;
    }

    if (!sigunNm) {
      setMarkers([]);
      return;
    }

    const load = async () => {
      try {
        const response = await fetchFacilities(sigunNm, gu, dong);
        if (response.length === 0) {
          syncFacilityData(sigunNm, gu, dong);
          const response = await fetchFacilities(sigunNm, gu, dong);
        }
        if (cancelled) return;

        const items = response
          .map((item) => buildMarker(item.latitude, item.longitude, item.institutionName))
          .filter((marker): marker is MapMarkerData => Boolean(marker));

        setMarkers(items);
      } catch (error) {
        console.error('Failed to load facility data', error);
        if (!cancelled) {
          onError?.('치안센터 정보를 불러오지 못했습니다.');
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [active, sigunNm, gu, dong, onError]);

  return markers;
};
