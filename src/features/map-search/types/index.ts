export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type BoundarySource = 'mock' | 'approx' | 'api' | 'vworld';

export interface DongBoundary {
  id: string;
  name: string;
  address?: string;
  center: LatLngLiteral;
  path: LatLngLiteral[];
  source: BoundarySource;
  bCode?: string; // 행정구역 코드 (법정동코드)
}

export interface DongSearchResult {
  id: string;
  name: string;
  fullAddress: string;
  center: LatLngLiteral;
  hasExactBoundary: boolean;
  bCode?: string; // 행정구역 코드 (WFS API의 emd_cd)
  geometryUrl?: string; // V-World Search API의 geometry URL (GeoJSON 파일)
}

