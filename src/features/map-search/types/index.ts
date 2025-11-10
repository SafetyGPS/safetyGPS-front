export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type BoundarySource = 'vworld';

export interface DongBoundary {
  id: string;
  name: string;
  address?: string;
  center: LatLngLiteral;
  path: LatLngLiteral[];
  source: BoundarySource;
  bCode?: string;
}

export interface DongSearchResult {
  id: string;
  name: string;
  fullAddress: string;
  center: LatLngLiteral;
  bCode?: string;
  geometryUrl?: string; // 사용하지 않지만 Search API에서 반환됨
}

