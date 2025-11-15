import { useEffect, useState } from 'react';
import type { MapMarkerData } from '@/entities/map-layer';
import { buildMarker } from '@/shared/lib/mapMarkers';
import { fetchCctvLocations } from './api';

export interface UseCctvLayerOptions {
  active: boolean;
  regionQuery?: string;
  onError?: (errorMessage: string) => void;
}

export const useCctvLayer = ({
  active,
  regionQuery,
  onError,
}: UseCctvLayerOptions): MapMarkerData[] => {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      setMarkers([]);
      return;
    }

    if (!regionQuery) {
      setMarkers([]);
      return;
    }

    const load = async () => {
      try {
        const response = await fetchCctvLocations(regionQuery);
        if (cancelled) return;

        const items = response
          .map((item) => buildMarker(item.latitude, item.longitude, item.address))
          .filter((marker): marker is MapMarkerData => Boolean(marker));

        setMarkers(items);
      } catch (error) {
        console.error('Failed to load CCTV locations', error);
        if (!cancelled) {
          onError?.('CCTV 위치 정보를 불러오지 못했습니다.');
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [active, regionQuery, onError]);

  return markers;
};
