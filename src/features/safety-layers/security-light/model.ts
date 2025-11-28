import { useEffect, useState } from 'react';
import type { MapMarkerData } from '../../../entities/map-layer';
import { buildMarker } from '../../../shared/lib/mapMarkers';
import { fetchSecurityLights, syncLightData } from './api';

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
        let data = response;
        if (data.length === 0) {
          await syncLightData(address);
          data = await fetchSecurityLights(address);
        }
        if (cancelled) return;

        const items = data
          .map((item) => buildMarker(item.LATITUDE, item.LONGITUDE, item.LMP_LC_NM))
          .filter((marker): marker is MapMarkerData => Boolean(marker));

        setMarkers(items);
      } catch (error) {
        console.error('Failed to load security lights', error);
        if (!cancelled) {
          onError?.('\ubcf4\uc548\ub4f1 \uc815\ubcf4\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.');
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
