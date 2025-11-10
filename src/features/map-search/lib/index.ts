import type { LatLngLiteral } from '../types';

/**
 * 좌표 배열을 간소화 (최대 500개로 제한)
 */
export const simplifyCoordinates = (coordinates: number[][], tolerance: number = 0.0001): number[][] => {
  if (coordinates.length <= 500) {
    return coordinates;
  }
  
  const step = Math.ceil(coordinates.length / 100);
  const simplified: number[][] = [coordinates[0]];
  
  for (let i = step; i < coordinates.length - step; i += step) {
    simplified.push(coordinates[i]);
  }
 
  if (coordinates.length > 1) {
    simplified.push(coordinates[coordinates.length - 1]);
  }
  
  return simplified;
};

/**
 * Geometry에서 중심점을 계산합니다 (GeoJSON 좌표: [lng, lat])
 */
export const calculateCenterFromGeometry = (geometry: any): LatLngLiteral | null => {
  try {
    let allCoordinates: number[][] = [];
    
    if (geometry.type === 'Polygon') {
      allCoordinates = geometry.coordinates[0] || [];
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        if (polygon[0] && Array.isArray(polygon[0])) {
          allCoordinates = allCoordinates.concat(polygon[0]);
        }
      }
    }
    
    if (allCoordinates.length === 0) {
      return null;
    }
    
    let sumLat = 0;
    let sumLng = 0;
    
    for (const coord of allCoordinates) {
      if (Array.isArray(coord) && coord.length >= 2) {
        sumLng += coord[0];
        sumLat += coord[1];
      }
    }
    
    return {
      lat: sumLat / allCoordinates.length,
      lng: sumLng / allCoordinates.length,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Feature에서 직접 DongBoundary로 변환 (WFS API 전용)
 */
export const parseFeatureToBoundary = (
  feature: any,
  dongName: string,
  center: LatLngLiteral,
  bCode: string
): import('../types').DongBoundary | null => {
  try {
    const geometry = feature.geometry;
    if (!geometry) return null;
    
    let coordinates: number[][] = [];
    
    if (geometry.type === 'Polygon') {
      if (!Array.isArray(geometry.coordinates?.[0])) {
        return null;
      }
      coordinates = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      // MultiPolygon인 경우 가장 큰 폴리곤 선택 (섬이 있는 동 대응)
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        return null;
      }
      
      let maxPolygon = geometry.coordinates[0];
      let maxLength = Array.isArray(geometry.coordinates[0]?.[0]) ? geometry.coordinates[0][0].length : 0;
      
      for (let i = 1; i < geometry.coordinates.length; i++) {
        const polygon = geometry.coordinates[i];
        if (Array.isArray(polygon?.[0]) && polygon[0].length > maxLength) {
          maxLength = polygon[0].length;
          maxPolygon = polygon;
        }
      }
      
      if (!Array.isArray(maxPolygon?.[0])) {
        return null;
      }
      coordinates = maxPolygon[0];
    }
    
    if (coordinates.length === 0) {
      return null;
    }
    
    const optimizedCoordinates = simplifyCoordinates(coordinates);
    
    // GeoJSON [lng, lat] → Kakao Map [lat, lng]
    const path: LatLngLiteral[] = optimizedCoordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
    
    // 폴리곤 닫기
    if (path.length > 0 && (path[0].lat !== path[path.length - 1].lat || path[0].lng !== path[path.length - 1].lng)) {
      path.push(path[0]);
    }
    
    return {
      id: `${bCode}-vworld`,
      name: dongName,
      center,
      path,
      source: 'vworld',
      bCode,
    };
  } catch (error) {
    return null;
  }
};


