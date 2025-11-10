import type { LatLngLiteral } from '../types';
import { DEFAULT_DELTA } from '../constants';

/**
 * 좌표 배열을 간소화합니다 (최대 100개로 제한)
 */
export const simplifyCoordinates = (coordinates: number[][], tolerance: number = 0.0001): number[][] => {
  if (coordinates.length <= 100) {
    return coordinates;
  }
  
  console.log(`   좌표 간소화: ${coordinates.length}개 -> 최대 100개로 제한`);
  
  const step = Math.ceil(coordinates.length / 100);
  const simplified: number[][] = [];
  
  simplified.push(coordinates[0]);
  
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
    console.error('중심점 계산 오류:', error);
    return null;
  }
};

/**
 * GeoJSON 데이터를 DongBoundary로 변환합니다
 */
export const parseGeoJSONToBoundary = (
  geoJson: any,
  dongName: string,
  center: LatLngLiteral,
  bCode: string
): import('../types').DongBoundary | null => {
  try {
    console.log('   GeoJSON 파싱 시작, 타입:', geoJson?.type);
    let coordinates: number[][] = [];
    
    if (geoJson.type === 'FeatureCollection' && geoJson.features?.length > 0) {
      console.log('   FeatureCollection 형식, features 개수:', geoJson.features.length);
      const feature = geoJson.features[0];
      const geometry = feature.geometry;
      
      if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0];
        console.log('   Polygon - 외곽 경계선 좌표 개수:', coordinates.length);
      } else if (geometry.type === 'MultiPolygon') {
        console.log('   MultiPolygon - 폴리곤 개수:', geometry.coordinates.length);
        
        let maxPolygon = geometry.coordinates[0];
        let maxLength = geometry.coordinates[0][0].length;
        
        for (let i = 1; i < geometry.coordinates.length; i++) {
          const polygonLength = geometry.coordinates[i][0].length;
          if (polygonLength > maxLength) {
            maxLength = polygonLength;
            maxPolygon = geometry.coordinates[i];
          }
        }
        
        coordinates = maxPolygon[0];
        console.log('   가장 큰 폴리곤의 외곽 경계선 좌표 개수:', coordinates.length);
      }
    } else if (geoJson.type === 'Feature') {
      console.log('   Feature 형식');
      const geometry = geoJson.geometry;
      if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0];
      } else if (geometry.type === 'MultiPolygon') {
        let maxPolygon = geometry.coordinates[0];
        let maxLength = geometry.coordinates[0][0].length;
        for (let i = 1; i < geometry.coordinates.length; i++) {
          if (geometry.coordinates[i][0].length > maxLength) {
            maxLength = geometry.coordinates[i][0].length;
            maxPolygon = geometry.coordinates[i];
          }
        }
        coordinates = maxPolygon[0];
      }
    } else if (geoJson.type === 'Polygon') {
      console.log('   Polygon 형식');
      coordinates = geoJson.coordinates[0];
    } else if (geoJson.type === 'MultiPolygon') {
      console.log('   MultiPolygon 형식');
      let maxPolygon = geoJson.coordinates[0];
      let maxLength = geoJson.coordinates[0][0].length;
      for (let i = 1; i < geoJson.coordinates.length; i++) {
        if (geoJson.coordinates[i][0].length > maxLength) {
          maxLength = geoJson.coordinates[i][0].length;
          maxPolygon = geoJson.coordinates[i];
        }
      }
      coordinates = maxPolygon[0];
    }
    
    if (coordinates.length === 0) {
      console.warn('   GeoJSON에서 좌표를 추출할 수 없습니다');
      return null;
    }
    
    console.log('   추출된 원본 좌표 개수:', coordinates.length);
    
    const optimizedCoordinates = simplifyCoordinates(coordinates);
    console.log('   최적화된 좌표 개수:', optimizedCoordinates.length);
    
    const path: LatLngLiteral[] = optimizedCoordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
    
    if (path.length > 0 && (path[0].lat !== path[path.length - 1].lat || path[0].lng !== path[path.length - 1].lng)) {
      path.push(path[0]);
    }
    
    console.log('   GeoJSON 파싱 완료, 최종 경계선 좌표 개수:', path.length);
    
    return {
      id: `${bCode}-vworld-search`,
      name: dongName,
      center: center,
      path: path,
      source: 'vworld',
      bCode: bCode,
    };
  } catch (error) {
    console.error('   GeoJSON 파싱 오류:', error);
    return null;
  }
};

/**
 * 임시 경계선을 생성합니다 (근사치)
 */
export const buildApproxBoundary = (
  result: import('../types').DongSearchResult
): import('../types').DongBoundary => {
  const { lat, lng } = result.center;
  const { lat: deltaLat, lng: deltaLng } = DEFAULT_DELTA;
  const rectangle: LatLngLiteral[] = [
    { lat: lat + deltaLat, lng: lng - deltaLng },
    { lat: lat + deltaLat, lng: lng + deltaLng },
    { lat: lat - deltaLat, lng: lng + deltaLng },
    { lat: lat - deltaLat, lng: lng - deltaLng },
  ];

  rectangle.push(rectangle[0]);

  return {
    id: `${result.id}-approx`,
    name: result.name,
    address: result.fullAddress,
    center: result.center,
    path: rectangle,
    source: 'approx',
  };
};

