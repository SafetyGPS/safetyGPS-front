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
  geometryUrl?: string;
}

export interface DongSearchResult {
  id: string;
  name: string;
  fullAddress: string;
  center: LatLngLiteral;
  bCode?: string;
  geometryUrl?: string;
}
