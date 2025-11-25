import { useEffect, useState } from 'react';
import type { MapMarkerData } from '../../../entities/map-layer';
import { buildMarker } from '../../../shared/lib/mapMarkers';
import { syncLightData } from './api';
import { fetchSecurityLights } from './api';

export interface UseSecurityLightLayerOptions {
  active: boolean;
  address?: string;
  onError?: (errorMessage: string) => void;
}

export const useSecurityLightLayer = ({
  active,
  address,
  onError,
}: UseSecurityLightLayerOptions): MapMarkerData[] => {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      setMarkers([]);
      return;
    }

    if (!address) {
      setMarkers([]);
      return;
    }

    const load = async () => {
      try {
        const response = await fetchSecurityLights(address);
        if (response.length === 0) {
          syncLightData(address);
          const response = await fetchSecurityLights(address);
        }
        if (cancelled) return;

        const items = response
          .map((item) => buildMarker(item.LATITUDE, item.LONGITUDE, item.LMP_LC_NM))
          .filter((marker): marker is MapMarkerData => Boolean(marker));

        setMarkers(items);
      } catch (error) {
        console.error('Failed to load security lights', error);
        if (!cancelled) {
          onError?.('보안등 정보를 불러오지 못했습니다.');
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [active, address, onError]);

  return markers;
};
