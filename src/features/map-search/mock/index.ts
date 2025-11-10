import type { DongBoundary, LatLngLiteral } from '../types';

const toPath = (coords: Array<[number, number]>): LatLngLiteral[] =>
  coords.map(([lat, lng]) => ({ lat, lng }));

export const MOCK_DONG_POLYGONS: DongBoundary[] = [
  {
    id: 'mock-bojeong',
    name: '보정동',
    center: { lat: 37.2997, lng: 127.0287 },
    path: toPath([
      [37.303, 127.022],
      [37.3055, 127.0295],
      [37.3002, 127.034],
      [37.2958, 127.0285],
      [37.2982, 127.0225],
    ]),
    source: 'mock',
  },
  {
    id: 'mock-mabuk',
    name: '마북동',
    center: { lat: 37.2892, lng: 127.0208 },
    path: toPath([
      [37.2925, 127.0165],
      [37.294, 127.0228],
      [37.2881, 127.0262],
      [37.2846, 127.0204],
      [37.2876, 127.0158],
    ]),
    source: 'mock',
  },
  {
    id: 'mock-sanggal',
    name: '상갈동',
    center: { lat: 37.2861, lng: 127.0342 },
    path: toPath([
      [37.2894, 127.0284],
      [37.2912, 127.0362],
      [37.2866, 127.0397],
      [37.2821, 127.0336],
      [37.284, 127.0276],
    ]),
    source: 'mock',
  },
];

export const DONG_POLYGON_BY_NAME: Record<string, DongBoundary> =
  MOCK_DONG_POLYGONS.reduce<Record<string, DongBoundary>>((acc, boundary) => {
    acc[boundary.name] = boundary;
    return acc;
  }, {});

