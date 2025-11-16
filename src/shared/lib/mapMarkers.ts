import type { MapMarkerData } from '../../entities/map-layer';

const toNumericCoordinate = (value?: number | string | null): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const buildMarker = (
  latValue?: number | string | null,
  lngValue?: number | string | null,
  label?: string,
): MapMarkerData | null => {
  const lat = toNumericCoordinate(latValue);
  const lng = toNumericCoordinate(lngValue);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng, label };
};
