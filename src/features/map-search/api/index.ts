import type { DongBoundary, DongSearchResult, LatLngLiteral } from '../types';
import { parseGeoJSONToBoundary } from '../lib';

/**
 * V-World Search API로 경기도 내 동/읍/면 검색
 */
export const searchDong = async (query: string, apiKey: string): Promise<DongSearchResult[]> => {
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `/api/vworld/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=15&page=1&query=${encodedQuery}&type=district&category=L4&format=json&errorformat=json&key=${apiKey}`;
  
  const response = await fetch(searchUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data?.response?.result?.items) {
    return [];
  }

  const items = Array.isArray(data.response.result.items) 
    ? data.response.result.items 
    : [data.response.result.items];

  const seen = new Set<string>();
  const results: DongSearchResult[] = [];
  const queryLower = query.toLowerCase().trim();
  const queryHasCity = queryLower.includes('시') || queryLower.includes('군');
  const queryHasDong = queryLower.includes('동') || queryLower.includes('면') || queryLower.includes('읍');

  items.forEach((item: any, index: number) => {
    const title = item.title || '';
    
    if (!title.includes('경기도')) return;
    
    const titleParts = title.split(' ');
    const dongName = titleParts[titleParts.length - 1];
    
    // 동/면/읍 필터링
    if (titleParts.length > 1 && (titleParts[titleParts.length - 2].endsWith('시') || titleParts[titleParts.length - 2].endsWith('군'))) {
      // 허용
    } else if (!dongName.endsWith('동') && !dongName.endsWith('면') && !dongName.endsWith('읍')) {
      return;
    }
    
    // 검색 쿼리 매칭
    if (queryHasCity && queryHasDong) {
      const cityMatch = queryLower.match(/(.+?)(?:시|군)/);
      const dongMatch = queryLower.match(/(.+?)(?:동|면|읍)/);
      
      if (cityMatch && dongMatch) {
        const cityName = cityMatch[1].trim();
        const queryDongName = dongMatch[1].trim();
        const titleLower = title.toLowerCase();
        const itemDongName = dongName.toLowerCase().replace(/동|면|읍/g, '').trim();
        
        if (!titleLower.includes(cityName) || queryDongName !== itemDongName) {
          return;
        }
      }
    } else if (queryHasCity && !queryHasDong) {
      const cityName = queryLower.replace(/시|군/g, '').trim();
      if (!title.toLowerCase().includes(cityName)) {
        return;
      }
    } else if (!queryHasCity && queryHasDong) {
      const queryDongName = queryLower.replace(/동|면|읍/g, '').trim();
      const itemDongName = dongName.toLowerCase().replace(/동|면|읍/g, '').trim();
      if (queryDongName !== itemDongName) {
        return;
      }
    }

    const uniqueKey = `${title}_${dongName}`;
    if (seen.has(uniqueKey)) return;
    seen.add(uniqueKey);

    const point = item.point || {};
    const center = {
      lat: Number(point.y) || 0,
      lng: Number(point.x) || 0,
    };

    results.push({
      id: item.id || `${center.lat}-${center.lng}-${index}`,
      name: dongName,
      fullAddress: title,
      center,
      bCode: item.id,
      geometryUrl: item.geometry,
    });
  });

  return results.slice(0, 15);
};

/**
 * WFS API로 동 경계선 데이터 가져오기
 * BBOX 필터로 범위를 제한하고, 동 이름으로 정확히 매칭
 */
export const fetchVWorldBoundary = async (
  bCode: string,
  dongName: string,
  fullAddress: string,
  center: LatLngLiteral,
  apiKey: string
): Promise<DongBoundary | null> => {
  try {
    const bufferSize = 0.05; // 약 5km 반경
    const bbox = `${center.lat - bufferSize},${center.lng - bufferSize},${center.lat + bufferSize},${center.lng + bufferSize}`;
    
    const wfsUrl = `/api/vworld/req/wfs?service=wfs&request=GetFeature&typename=lt_c_ademd&version=2.0.0&srsName=EPSG:4326&output=application/json&key=${apiKey}&domain=http://localhost:8080&bbox=${bbox}&maxfeatures=100`;
    
    const response = await fetch(wfsUrl);
    
    if (!response.ok) {
      return null;
    }
    
    const wfsData = await response.json();
    
    if (wfsData?.type !== 'FeatureCollection' || !wfsData?.features?.length) {
      return null;
    }
    
    // 동 이름 또는 bCode로 매칭 (점수 기반)
    let matchedFeature = null;
    let matchScore = 0;
    
    for (const feature of wfsData.features) {
      const props = feature.properties || {};
      const featureName = props.emd_kor_nm || props.EMD_KOR_NM || '';
      const featureEmdCd = props.emd_cd || props.EMD_CD || '';
      
      let score = 0;
      if (featureName.includes(dongName)) score += 100;
      if (featureEmdCd === bCode) score += 200;
      
      if (score > matchScore) {
        matchScore = score;
        matchedFeature = feature;
      }
    }
    
    if (!matchedFeature) {
      return null;
    }
    
    const singleFeatureCollection = {
      type: 'FeatureCollection',
      features: [matchedFeature],
    };
    
    return parseGeoJSONToBoundary(singleFeatureCollection, dongName, center, bCode);
  } catch (error) {
    return null;
  }
};

