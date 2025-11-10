import type { DongBoundary, DongSearchResult, LatLngLiteral } from '../types';
import { parseGeoJSONToBoundary } from '../lib';

/**
 * V-World Search API로 동 검색
 */
export const searchDong = async (query: string, apiKey: string): Promise<DongSearchResult[]> => {
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `/api/vworld/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=15&page=1&query=${encodedQuery}&type=district&category=L4&format=json&errorformat=json&key=${apiKey}`;
  
  console.log('V-World Search API 요청:', searchUrl);
  
  const response = await fetch(searchUrl);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API 응답 오류:', response.status, errorText);
    throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('V-World Search API 응답 데이터:', data);

  if (!data?.response?.result?.items || (Array.isArray(data.response.result.items) && data.response.result.items.length === 0)) {
    return [];
  }

  const items = Array.isArray(data.response.result.items) 
    ? data.response.result.items 
    : [data.response.result.items];

  const seen = new Set<string>();
  const next: DongSearchResult[] = [];

  items.forEach((item: any, index: number) => {
    const title = item.title || '';
    
    // 경기도만 필터링
    if (!title.includes('경기도')) {
      return;
    }
    
    const titleParts = title.split(' ');
    const dongName = titleParts[titleParts.length - 1];
    
    // 검색 쿼리 분석
    const queryLower = query.toLowerCase().trim();
    const queryHasCity = queryLower.includes('시') || queryLower.includes('군');
    const queryHasDong = queryLower.includes('동') || queryLower.includes('면') || queryLower.includes('읍');
    
    // 시/군과 동을 함께 검색한 경우 (예: "수원시 보정동")
    if (queryHasCity && queryHasDong) {
      const cityMatch = queryLower.match(/(.+?)(?:시|군)/);
      const dongMatch = queryLower.match(/(.+?)(?:동|면|읍)/);
      
      if (cityMatch && dongMatch) {
        const cityName = cityMatch[1].trim();
        const queryDongName = dongMatch[1].trim();
        const titleLower = title.toLowerCase();
        const itemDongName = dongName.toLowerCase().replace(/동|면|읍/g, '').trim();
        
        // 시/군 이름과 동 이름이 모두 일치해야 함
        if (!titleLower.includes(cityName) || queryDongName !== itemDongName) {
          return;
        }
      }
    }
    // 시/군만 검색한 경우 (예: "수원시"): 해당 시/군의 동만 표시
    else if (queryHasCity && !queryHasDong) {
      const cityName = queryLower.replace(/시|군/g, '').trim();
      const titleLower = title.toLowerCase();
      // 제목에 해당 시/군 이름이 포함되어야 함
      if (!titleLower.includes(cityName)) {
        return;
      }
    }
    // 동 이름만 검색한 경우 (예: "보정동"): 동 이름이 정확히 일치하는 것만 표시
    else if (!queryHasCity && queryHasDong) {
      const queryDongName = queryLower.replace(/동|면|읍/g, '').trim();
      const itemDongName = dongName.toLowerCase().replace(/동|면|읍/g, '').trim();
      // 동 이름이 정확히 일치해야 함
      if (queryDongName !== itemDongName) {
        return;
      }
    }
    
    // 동/면/읍으로 끝나지 않는 경우 필터링 (예외: 시/군 바로 다음에 오는 경우)
    if (titleParts.length > 1 && (titleParts[titleParts.length - 2].endsWith('시') || titleParts[titleParts.length - 2].endsWith('군'))) {
      // "수원시 원동" 같은 경우 허용
    } else if (!dongName.endsWith('동') && !dongName.endsWith('면') && !dongName.endsWith('읍')) {
      return;
    }

    const uniqueKey = `${title}_${dongName}`;
    if (seen.has(uniqueKey)) return;
    seen.add(uniqueKey);

    const point = item.point || {};
    const center = {
      lat: Number(point.y) || 0,
      lng: Number(point.x) || 0,
    };

    const vworldId = item.id || '';
    const geometryUrl = item.geometry || '';

    if (!geometryUrl) {
      console.warn(`   ⚠️ ${dongName}의 geometry URL이 없습니다. Search API 응답:`, {
        id: vworldId,
        title: title,
        hasGeometry: !!item.geometry,
        itemKeys: Object.keys(item),
      });
    } else {
      console.log(`   ✅ ${dongName}의 geometry URL:`, geometryUrl);
    }

    next.push({
      id: vworldId || `${center.lat}-${center.lng}-${index}`,
      name: dongName,
      fullAddress: title,
      center: center,
      bCode: vworldId,
      geometryUrl: geometryUrl,
    });
  });

  return next.slice(0, 15);
};

/**
 * V-World Search API 2.0의 geometry URL에서 경계선 가져오기
 * WFS API는 사용하지 않고 Search API 2.0만 사용합니다.
 */
export const fetchVWorldBoundary = async (
  bCode: string,
  dongName: string,
  fullAddress: string,
  center: LatLngLiteral,
  apiKey: string
): Promise<DongBoundary | null> => {
  console.log('=== WFS API로 경계선 가져오기 시작 ===');
  console.log('입력 파라미터:', { bCode, dongName, fullAddress, center });

  try {
    // BBOX로 지역 제한 (중심 좌표 기준 ±5km)
    const bufferSize = 0.05;
    const bbox = `${center.lat - bufferSize},${center.lng - bufferSize},${center.lat + bufferSize},${center.lng + bufferSize}`;
    
    const wfsUrl = `/api/vworld/req/wfs?service=wfs&request=GetFeature&typename=lt_c_ademd&version=2.0.0&srsName=EPSG:4326&output=application/json&key=${apiKey}&domain=http://localhost:8080&bbox=${bbox}&maxfeatures=100`;
    console.log('WFS API 요청:', wfsUrl);
    
    const response = await fetch(wfsUrl);
    
    if (!response.ok) {
      console.error('WFS API 요청 실패:', response.status);
      return null;
    }
    
    const wfsData = await response.json();
    console.log('WFS API Features 개수:', wfsData?.features?.length || 0);
    
    if (wfsData?.type !== 'FeatureCollection' || !wfsData?.features?.length) {
      console.warn('유효한 GeoJSON 데이터가 없습니다.');
      return null;
    }
    
    // 동 이름으로 매칭
    let matchedFeature = null;
    let matchScore = 0;
    
    for (const feature of wfsData.features) {
      const props = feature.properties || {};
      const featureName = props.emd_kor_nm || props.EMD_KOR_NM || '';
      const featureEmdCd = props.emd_cd || props.EMD_CD || '';
      
      let currentScore = 0;
      
      if (featureName.includes(dongName)) {
        currentScore += 100;
      }
      if (featureEmdCd === bCode) {
        currentScore += 200;
      }
      
      if (currentScore > matchScore) {
        matchScore = currentScore;
        matchedFeature = feature;
      }
    }
    
    if (!matchedFeature) {
      console.warn('일치하는 동을 찾을 수 없습니다.');
      return null;
    }
    
    console.log('✅ 매칭 성공:', matchedFeature.properties?.emd_kor_nm);
    
    const singleFeatureCollection = {
      type: 'FeatureCollection',
      features: [matchedFeature],
    };
    
    const boundary = parseGeoJSONToBoundary(singleFeatureCollection, dongName, center, bCode);
    
    if (boundary) {
      console.log('✅ 경계선 데이터 가져오기 성공!');
      console.log('=== WFS API 완료 ===');
      return boundary;
    }
    
    return null;
  } catch (error) {
    console.error('❌ V-World Search API 2.0 경계선 가져오기 예외 발생');
    console.error('   에러 타입:', error?.constructor?.name);
    console.error('   에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('   에러 스택:', error instanceof Error ? error.stack : '없음');
    console.error('   전체 에러 객체:', error);
    console.log('=== V-World Search API 2.0 경계선 가져오기 실패 ===');
    return null;
  }
};

