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
      hasExactBoundary: false,
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
  geometryUrl?: string,
  apiKey?: string
): Promise<DongBoundary | null> => {
  console.log('=== V-World Search API 2.0 경계선 가져오기 시작 ===');
  console.log('입력 파라미터:', { bCode, dongName, fullAddress, center, geometryUrl });
  
  if (!geometryUrl) {
    console.warn('❌ geometryUrl이 없습니다. Search API 2.0만 사용하므로 경계선을 가져올 수 없습니다.');
    console.log('=== V-World Search API 2.0 경계선 가져오기 실패 ===');
    return null;
  }

  try {
    console.log('   Search API 2.0의 geometry URL 직접 사용');
    console.log('   원본 geometry URL:', geometryUrl);
    
    // API 키를 URL에 추가
    let urlWithKey = geometryUrl;
    if (apiKey) {
      const separator = geometryUrl.includes('?') ? '&' : '?';
      urlWithKey = `${geometryUrl}${separator}key=${apiKey}`;
      console.log('   API 키 추가된 URL:', urlWithKey);
    }
    
    // XML 에러 메시지 파싱 헬퍼 함수
    const parseXMLError = (xmlText: string): string => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const codeElement = xmlDoc.querySelector('code');
        const messageElement = xmlDoc.querySelector('message');
        const code = codeElement?.textContent || '';
        const message = messageElement?.textContent || '';
        return `코드: ${code}, 메시지: ${message}`;
      } catch {
        return xmlText.substring(0, 200);
      }
    };
    
    // GeoJSON 데이터 가져오기 헬퍼 함수
    const fetchGeoJSON = async (url: string, isProxy: boolean = false): Promise<any | null> => {
      try {
        console.log(`   ${isProxy ? '프록시' : '직접'} URL 요청:`, url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, application/geo+json, */*',
          },
          mode: isProxy ? 'same-origin' : 'cors',
          credentials: 'omit',
        });
        
        console.log(`   ${isProxy ? '프록시' : '직접'} URL 응답 상태:`, response.status, response.ok);
        console.log(`   ${isProxy ? '프록시' : '직접'} URL Content-Type:`, response.headers.get('content-type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`   ${isProxy ? '프록시' : '직접'} URL 요청 실패:`, response.status);
          if (errorText.trim().startsWith('<?xml')) {
            const errorMsg = parseXMLError(errorText);
            console.warn('   XML 에러:', errorMsg);
          } else {
            console.warn('   에러 내용:', errorText.substring(0, 500));
          }
          return null;
        }
        
        const responseText = await response.text();
        const contentType = response.headers.get('content-type') || '';
        
        console.log(`   ${isProxy ? '프록시' : '직접'} URL 응답 본문 처음 500자:`, responseText.substring(0, 500));
        
        // XML 응답 체크
        if (contentType.includes('xml') || responseText.trim().startsWith('<?xml')) {
          const errorMsg = parseXMLError(responseText);
          console.warn(`   ❌ ${isProxy ? '프록시' : '직접'} URL이 XML 형식으로 응답:`, errorMsg);
          return null;
        }
        
        // JSON 파싱
        try {
          const geoData = JSON.parse(responseText);
          console.log(`   ✅ ${isProxy ? '프록시' : '직접'} URL로 GeoJSON 다운로드 성공!`);
          console.log('   GeoJSON 타입:', geoData?.type);
          console.log('   Features 개수:', geoData?.features?.length || 0);
          
          if (geoData?.type === 'FeatureCollection' && geoData?.features?.length > 0) {
            return geoData;
          } else {
            console.warn('   GeoJSON 형식이 올바르지 않습니다.');
            return null;
          }
        } catch (parseError) {
          console.error(`   ${isProxy ? '프록시' : '직접'} URL JSON 파싱 실패:`, parseError);
          console.error('   파싱 실패한 텍스트:', responseText.substring(0, 1000));
          return null;
        }
      } catch (error: any) {
        console.error(`   ${isProxy ? '프록시' : '직접'} URL 시도 중 오류 발생:`);
        console.error('   에러 타입:', error?.constructor?.name);
        console.error('   에러 메시지:', error?.message);
        console.error('   에러 이름:', error?.name);
        
        if (!isProxy && (error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch') || error?.name === 'TypeError')) {
          console.warn('   ⚠️ CORS 오류로 판단');
        }
        
        return null;
      }
    };
    
    // 방법 1: 직접 URL로 먼저 시도 (API 키 없이, geometry URL은 퍼블릭 파일)
    console.log('   방법 1: 직접 URL로 시도 (API 키 없이)');
    const directGeoData = await fetchGeoJSON(geometryUrl, false);
    if (directGeoData) {
      const boundary = parseGeoJSONToBoundary(directGeoData, dongName, center, bCode);
      if (boundary) {
        console.log('✅ 직접 URL로 경계선 데이터 가져오기 성공!');
        console.log('=== V-World Search API 2.0 경계선 가져오기 완료 ===');
        return boundary;
      }
    }
    
    // 방법 1-2: API 키를 포함해서 재시도
    console.log('   방법 1-2: 직접 URL로 시도 (API 키 포함)');
    const directGeoDataWithKey = await fetchGeoJSON(urlWithKey, false);
    if (directGeoDataWithKey) {
      const boundary = parseGeoJSONToBoundary(directGeoDataWithKey, dongName, center, bCode);
      if (boundary) {
        console.log('✅ 직접 URL (API 키 포함)로 경계선 데이터 가져오기 성공!');
        console.log('=== V-World Search API 2.0 경계선 가져오기 완료 ===');
        return boundary;
      }
    }
    
    // 방법 2: 프록시를 통해 접근
    console.log('   방법 2: 프록시를 통한 접근 시도');
    let geoUrl = urlWithKey; // API 키가 포함된 URL 사용
    if (geoUrl.startsWith('http://map.vworld.kr')) {
      geoUrl = geoUrl.replace('http://map.vworld.kr', '/api/vworld-map');
    } else if (geoUrl.startsWith('https://api.vworld.kr')) {
      geoUrl = geoUrl.replace('https://api.vworld.kr', '/api/vworld');
    }
    
    console.log('   프록시 URL 변환:', {
      원본: urlWithKey,
      변환됨: geoUrl,
    });
    
    const proxyGeoData = await fetchGeoJSON(geoUrl, true);
    if (proxyGeoData) {
      const boundary = parseGeoJSONToBoundary(proxyGeoData, dongName, center, bCode);
      if (boundary) {
        console.log('✅ 프록시로 경계선 데이터 가져오기 성공!');
        console.log('=== V-World Search API 2.0 경계선 가져오기 완료 ===');
        return boundary;
      }
    }
    
    // 방법 3: WFS API를 대안으로 시도 (더 정확한 필터링)
    console.log('   방법 3: WFS API를 대안으로 시도 (정확한 필터링)');
    if (apiKey && bCode) {
      console.log('   WFS API 파라미터:', { bCode, dongName, fullAddress });
      try {
        // CQL 필터를 사용하지 않고, BBOX로 지역 제한 후 클라이언트에서 필터링
        // 수원시 장안구 연무동 중심 좌표를 기준으로 범위 설정
        const bufferSize = 0.05; // 약 5km 반경
        const minLat = center.lat - bufferSize;
        const maxLat = center.lat + bufferSize;
        const minLng = center.lng - bufferSize;
        const maxLng = center.lng + bufferSize;
        
        // BBOX: ymin,xmin,ymax,xmax (EPSG:4326)
        const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
        
        const wfsUrl = `/api/vworld/req/wfs?service=wfs&request=GetFeature&typename=lt_c_ademd&version=2.0.0&srsName=EPSG:4326&output=application/json&key=${apiKey}&domain=http://localhost:8080&bbox=${bbox}&maxfeatures=100`;
        console.log('   WFS API 요청 (BBOX 필터):', wfsUrl);
        console.log('   검색 범위:', { center, bbox });
        
        const wfsResponse = await fetch(wfsUrl);
        console.log('   WFS API 응답 상태:', wfsResponse.status, wfsResponse.ok);
        
        if (wfsResponse.ok) {
          const wfsData = await wfsResponse.json();
          console.log('   WFS API 응답 데이터 타입:', wfsData?.type);
          console.log('   WFS API Features 개수:', wfsData?.features?.length || 0);
          
          if (wfsData?.type === 'FeatureCollection' && wfsData?.features?.length > 0) {
            // feature들의 속성 확인
            console.log('   첫 번째 feature 속성:', wfsData.features[0]?.properties);
            console.log('   총 feature 개수:', wfsData.features.length);
            console.log('   매칭 기준:', { dongName, fullAddress, bCode });
            
            // 동 이름으로 매칭 시도
            let matchedFeature = null;
            let matchScore = 0;
            
            for (let i = 0; i < Math.min(wfsData.features.length, 50); i++) {
              const feature = wfsData.features[i];
              const props = feature.properties || {};
              
              // 가능한 모든 필드명 확인
              const featureName = props.emd_kor_nm || props.EMD_KOR_NM || props.emd_nm || props.EMD_NM || props.name || props.NAME || '';
              const featureFullName = props.full_nm || props.FULL_NM || props.adm_nm || props.ADM_NM || '';
              const featureEmdCd = props.emd_cd || props.EMD_CD || props.emdCd || '';
              
              if (i < 3) {
                console.log(`   Feature ${i + 1}:`, {
                  name: featureName,
                  fullName: featureFullName,
                  emd_cd: featureEmdCd,
                  allProps: Object.keys(props),
                });
              }
              
              let currentScore = 0;
              
              // 1순위: 동 이름이 정확히 일치
              if (featureName && featureName.includes(dongName)) {
                currentScore += 100;
                console.log(`   ✅ Feature ${i + 1}: 동 이름 일치 (${featureName} === ${dongName})`);
              }
              
              // 2순위: 전체 주소에 검색 주소가 포함
              if (featureFullName && fullAddress.includes(featureName)) {
                currentScore += 50;
                console.log(`   ✅ Feature ${i + 1}: 주소 포함 (${featureFullName})`);
              }
              
              // 3순위: bCode 일치 (혹시 몰라서)
              if (featureEmdCd === bCode) {
                currentScore += 200;
                console.log(`   ✅ Feature ${i + 1}: bCode 일치 (${featureEmdCd})`);
              }
              
              if (currentScore > matchScore) {
                matchScore = currentScore;
                matchedFeature = feature;
                console.log(`   🎯 현재 최고 점수 feature: ${i + 1}, 점수: ${currentScore}`);
              }
            }
            
            if (matchedFeature && matchScore > 0) {
              console.log('   ✅ 매칭된 feature 발견! 최종 점수:', matchScore);
              console.log('   매칭된 feature 속성:', matchedFeature.properties);
              
              // 매칭된 feature만 사용
              const singleFeatureCollection = {
                type: 'FeatureCollection',
                features: [matchedFeature],
              };
              
              const boundary = parseGeoJSONToBoundary(singleFeatureCollection, dongName, center, bCode);
              if (boundary) {
                console.log('✅ WFS API로 경계선 데이터 가져오기 성공!');
                console.log('=== V-World Search API 2.0 경계선 가져오기 완료 (WFS 대안 사용) ===');
                return boundary;
              }
            } else {
              console.warn('   ⚠️ 일치하는 feature를 찾을 수 없습니다.');
              console.warn('   처음 10개 feature 이름:', wfsData.features.slice(0, 10).map((f: any, idx: number) => {
                const props = f.properties || {};
                return `${idx + 1}. ${props.emd_kor_nm || props.EMD_KOR_NM || props.emd_nm || props.name || '이름없음'}`;
              }));
            }
          }
        } else {
          console.warn('   WFS API 요청 실패:', wfsResponse.status);
          const errorText = await wfsResponse.text();
          console.warn('   에러 내용:', errorText.substring(0, 500));
        }
      } catch (wfsError) {
        console.error('   WFS API 호출 중 오류:', wfsError);
      }
    }
    
    console.log('❌ 모든 방법 실패: geometry URL을 가져올 수 없습니다.');
    console.log('   원인: V-World 서버가 CORS를 차단하고, 프록시도 404를 반환합니다.');
    console.log('   해결책: 백엔드 서버를 구축하거나 V-World API 정책 변경이 필요합니다.');
    console.log('=== V-World Search API 2.0 경계선 가져오기 실패 ===');
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

