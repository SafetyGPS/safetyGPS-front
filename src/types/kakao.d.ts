// 카카오 지도 SDK 타입 정의
export interface Size {
  width: number;
  height: number;
  equals(size: Size): boolean;
  toString(): string;
}

export interface MarkerImageOptions {
  offset?: { x: number; y: number };
  alt?: string;
  shape?: string;
  coords?: string;
  spriteSize?: { width: number; height: number };
  spriteOrigin?: { x: number; y: number };
}

export interface KakaoMaps {
  maps: {
    LatLng: new (lat: number, lng: number) => LatLng;
    Map: new (container: HTMLElement, options: MapOptions) => Map;
    Marker: new (options: MarkerOptions) => Marker;
    MarkerImage: new (src: string, size: Size, options?: MarkerImageOptions) => MarkerImage;
    Size: new (width: number, height: number) => Size;
    Polyline: new (options: PolylineOptions) => Polyline;
    Polygon: new (options: PolygonOptions) => Polygon;
    LatLngBounds: new () => LatLngBounds;
    load: (callback: () => void) => void;
    services: {
      Geocoder: new () => Geocoder;
    };
  };
}

export interface LatLng {
  getLat(): number;
  getLng(): number;
}

export interface MapOptions {
  center: LatLng;
  level: number;
}

export interface Map {
  setCenter(latlng: LatLng): void;
  setLevel(level: number): void;
  setBounds(bounds: LatLngBounds): void;
  relayout(): void;
}

export interface MarkerOptions {
  position: LatLng;
  image?: MarkerImage;
  map?: Map;
}

export interface Marker {
  setMap(map: Map | null): void;
  setPosition(position: LatLng): void;
}

// MarkerImage는 생성자로만 사용되며, 인스턴스 속성은 직접 접근 불가
// 타입 정의는 생성자 반환 타입으로만 사용
export type MarkerImage = object;

export interface PolylineOptions {
  path: LatLng[];
  strokeWeight: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeStyle: string;
  map?: Map;
}

export interface Polyline {
  setMap(map: Map | null): void;
  setPath(path: LatLng[]): void;
}

export interface PolygonOptions {
  path: LatLng[] | LatLng[][];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
  fillColor?: string;
  fillOpacity?: number;
  zIndex?: number;
  map?: Map;
}

export interface Polygon {
  setMap(map: Map | null): void;
  setPath(path: LatLng[] | LatLng[][]): void;
}

export interface LatLngBounds {
  extend(latlng: LatLng): void;
}

export interface Geocoder {
  addressSearch(address: string, callback: (result: GeocoderResult[], status: string) => void): void;
}

export interface GeocoderResult {
  address_name: string;
  y: string;
  x: string;
}

declare global {
  interface Window {
    kakao?: KakaoMaps;
  }
}

