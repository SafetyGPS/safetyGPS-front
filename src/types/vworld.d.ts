// V-World API 응답 타입 정의
export interface VWorldSearchItem {
  id: string;
  title: string;
  point: {
    x: string;
    y: string;
  };
}

export interface VWorldSearchResponse {
  response: {
    result: {
      items: VWorldSearchItem | VWorldSearchItem[];
    };
  };
}

export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

