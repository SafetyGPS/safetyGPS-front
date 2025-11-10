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
    const titleParts = title.split(' ');
    const dongName = titleParts[titleParts.length - 1];
    
    if (titleParts.length > 1 && (titleParts[titleParts.length - 2].endsWith('시') || titleParts[titleParts.length - 2].endsWith('군'))) {
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
 * V-World API에서 경계선 가져오기
 */
export const fetchVWorldBoundary = async (
  bCode: string,
  dongName: string,
  fullAddress: string,
  center: LatLngLiteral,
  geometryUrl?: string,
  apiKey?: string
): Promise<DongBoundary | null> => {
  console.log('=== V-World API 경계선 가져오기 시작 ===');
  console.log('입력 파라미터:', { bCode, dongName, fullAddress, center, geometryUrl });
  
  const vworldApiKey = apiKey || (import.meta as any).env?.VITE_VWORLD_API_KEY || '';
  const domain = window.location.hostname || 'localhost';
  
  if (!vworldApiKey) {
    console.warn('❌ V-World API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    // 방법 0: Search API의 geometry URL 직접 사용
    if (geometryUrl) {
      console.log('   방법 0: Search API의 geometry URL 직접 사용');
      console.log('   원본 geometry URL:', geometryUrl);
      
      try {
        let geoUrl = geometryUrl;
        if (geoUrl.startsWith('http://map.vworld.kr')) {
          geoUrl = geoUrl.replace('http://map.vworld.kr', '/api/vworld-map');
        } else if (geoUrl.startsWith('https://api.vworld.kr')) {
          geoUrl = geoUrl.replace('https://api.vworld.kr', '/api/vworld');
        }
        
        console.log('   프록시 URL:', geoUrl);
        
        const geoResponse = await fetch(geoUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('   응답 상태:', geoResponse.status, geoResponse.ok);
        console.log('   Content-Type:', geoResponse.headers.get('content-type'));
        
        if (geoResponse.ok) {
          const responseText = await geoResponse.text();
          const contentType = geoResponse.headers.get('content-type') || '';
          
          console.log('   응답 본문 처음 200자:', responseText.substring(0, 200));
          
          if (contentType.includes('xml') || responseText.trim().startsWith('<?xml')) {
            console.warn('   ❌ geometry URL이 XML 형식으로 응답했습니다.');
            console.warn('   프록시를 통한 접근 실패, 직접 URL로 재시도');
            
            try {
              console.log('   직접 URL로 재시도:', geometryUrl);
              const directResponse = await fetch(geometryUrl, {
                headers: {
                  'Accept': 'application/json',
                },
              });
              
              if (directResponse.ok) {
                const directText = await directResponse.text();
                if (!directText.trim().startsWith('<?xml')) {
                  try {
                    const geoData = JSON.parse(directText);
                    const boundary = parseGeoJSONToBoundary(geoData, dongName, center, bCode);
                    if (boundary) {
                      console.log('✅ 직접 URL로 GeoJSON 다운로드 성공!');
                      console.log('=== V-World API 경계선 가져오기 완료 ===');
                      return boundary;
                    }
                  } catch (parseError) {
                    console.warn('   직접 URL JSON 파싱 실패:', parseError);
                  }
                }
              }
            } catch (directError) {
              console.warn('   직접 URL 시도도 실패:', directError);
            }
          } else {
            try {
              const geoData = JSON.parse(responseText);
              console.log('   GeoJSON 다운로드 성공');
              
              const boundary = parseGeoJSONToBoundary(geoData, dongName, center, bCode);
              if (boundary) {
                console.log('✅ Search API의 geometry URL에서 경계선 데이터 가져오기 성공!');
                console.log('=== V-World API 경계선 가져오기 완료 ===');
                return boundary;
              }
            } catch (parseError) {
              console.warn('   JSON 파싱 실패:', parseError);
              console.warn('   응답 본문:', responseText.substring(0, 500));
            }
          }
        } else {
          const errorText = await geoResponse.text();
          console.warn('   geometry URL 다운로드 실패:', geoResponse.status);
          console.warn('   에러 내용:', errorText.substring(0, 200));
        }
      } catch (geoError) {
        console.warn('   geometry URL 다운로드 오류:', geoError);
      }
    } else {
      console.log('   방법 0: geometryUrl이 없어 건너뜀');
    }

    // 방법 1: emd_cd로 필터링 시도
    console.log('   Search API id (bCode):', bCode);
    console.log('   동 이름:', dongName);
    
    let cqlFilter = `emd_cd='${bCode}'`;
    const wfsUrl = `/api/vworld/req/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=lt_c_ademd&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&KEY=${vworldApiKey}&DOMAIN=${domain}&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
    
    console.log('   WFS URL (emd_cd로 필터링):', wfsUrl);
    
    const wfsResponse = await fetch(wfsUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (wfsResponse.ok) {
      const responseText = await wfsResponse.text();
      const contentType = wfsResponse.headers.get('content-type') || '';
      
      if (!contentType.includes('xml') && !responseText.trim().startsWith('<?xml')) {
        try {
          const wfsData = JSON.parse(responseText);
          console.log('   WFS 응답 피처 개수:', wfsData?.features?.length || 0);
          
          if (wfsData?.features && wfsData.features.length > 0) {
            let matchedFeature = wfsData.features.find((feature: any) => {
              const featureEmdCd = String(feature.properties?.emd_cd || '');
              return featureEmdCd === bCode;
            });
            
            if (matchedFeature) {
              console.log('   ✅ emd_cd로 정확히 매칭된 피처 찾음');
              
              const geometry = matchedFeature?.geometry;
              if (geometry && geometry.coordinates) {
                const matchedName = matchedFeature.properties?.emd_kor_nm || '';
                const matchedEmdCd = matchedFeature.properties?.emd_cd || '';
                console.log('   선택된 피처:', {
                  name: matchedName,
                  emd_cd: matchedEmdCd,
                  요청한동: dongName,
                  요청한id: bCode,
                });
                
                const boundary = parseGeoJSONToBoundary(
                  { type: 'Feature', geometry: geometry },
                  dongName,
                  center,
                  bCode
                );
                
                if (boundary) {
                  console.log('✅ WFS API에서 경계선 데이터 가져오기 성공!');
                  console.log('=== V-World API 경계선 가져오기 완료 ===');
                  return boundary;
                }
              }
            } else {
              console.warn('   emd_cd로 매칭 실패, 동 이름으로 재시도');
            }
          }
        } catch (parseError) {
          console.warn('   JSON 파싱 실패, 동 이름으로 재시도');
        }
      } else {
        console.warn('   XML 응답, 동 이름으로 재시도');
      }
    } else {
      console.warn('   WFS API 요청 실패, 동 이름으로 재시도');
    }
    
    // 방법 2: 좌표 기반 BBOX 필터링 시도
    console.log('   방법 2: 좌표 기반 BBOX 필터링 시도');
    const { lng, lat } = center;
    
    const bboxSize = 0.01;
    const minLng = lng - bboxSize;
    const maxLng = lng + bboxSize;
    const minLat = lat - bboxSize;
    const maxLat = lat + bboxSize;
    
    const bbox = `${minLng},${minLat},${maxLng},${maxLat},EPSG:4326`;
    const wfsUrl2 = `/api/vworld/req/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=lt_c_ademd&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&KEY=${vworldApiKey}&DOMAIN=${domain}&BBOX=${encodeURIComponent(bbox)}&MAXFEATURES=50`;
    
    console.log('   WFS URL (BBOX로 필터링):', wfsUrl2);
    console.log('   BBOX:', bbox);
    
    const wfsResponse2 = await fetch(wfsUrl2, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (wfsResponse2.ok) {
      const responseText2 = await wfsResponse2.text();
      const contentType2 = wfsResponse2.headers.get('content-type') || '';
      
      if (!contentType2.includes('xml') && !responseText2.trim().startsWith('<?xml')) {
        try {
          const wfsData2 = JSON.parse(responseText2);
          console.log('   BBOX 응답 피처 개수:', wfsData2?.features?.length || 0);
          
          if (wfsData2?.features && wfsData2.features.length > 0) {
            let matchedFeature = wfsData2.features.find((feature: any) => {
              const featureEmdCd = String(feature.properties?.emd_cd || '');
              return featureEmdCd === bCode;
            });
            
            if (matchedFeature) {
              console.log('   ✅ BBOX에서 emd_cd로 정확히 매칭된 피처 찾음');
              
              const geometry = matchedFeature?.geometry;
              if (geometry && geometry.coordinates) {
                const boundary = parseGeoJSONToBoundary(
                  { type: 'Feature', geometry: geometry },
                  dongName,
                  center,
                  bCode
                );
                
                if (boundary) {
                  console.log('✅ WFS API에서 경계선 데이터 가져오기 성공! (BBOX)');
                  console.log('=== V-World API 경계선 가져오기 완료 ===');
                  return boundary;
                }
              }
            } else {
              matchedFeature = wfsData2.features.find((feature: any) => {
                const featureName = feature.properties?.emd_kor_nm || '';
                return featureName === dongName;
              });
              
              if (matchedFeature) {
                console.log('   ✅ BBOX에서 동 이름으로 정확히 매칭된 피처 찾음');
                
                const geometry = matchedFeature?.geometry;
                if (geometry && geometry.coordinates) {
                  const boundary = parseGeoJSONToBoundary(
                    { type: 'Feature', geometry: geometry },
                    dongName,
                    center,
                    bCode
                  );
                  
                  if (boundary) {
                    console.log('✅ WFS API에서 경계선 데이터 가져오기 성공! (BBOX)');
                    console.log('=== V-World API 경계선 가져오기 완료 ===');
                    return boundary;
                  }
                }
              } else {
                console.warn('   BBOX에서 매칭 실패, 동 이름으로 재시도');
              }
            }
          }
        } catch (parseError) {
          console.warn('   BBOX JSON 파싱 실패, 동 이름으로 재시도');
        }
      } else {
        console.warn('   BBOX XML 응답, 동 이름으로 재시도');
      }
    } else {
      console.warn('   BBOX 요청 실패, 동 이름으로 재시도');
    }
    
    // 방법 3: 동 이름과 시군구 이름으로 필터링
    console.log('   방법 3: 동 이름으로 필터링 시도');
    const addressParts = fullAddress.split(' ');
    const sigunguName = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';
    
    let cqlFilter3 = `emd_kor_nm='${dongName}'`;
    if (sigunguName) {
      cqlFilter3 += ` AND sig_kor_nm='${sigunguName}'`;
    }

    const wfsUrl3 = `/api/vworld/req/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=lt_c_ademd&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&KEY=${vworldApiKey}&DOMAIN=${domain}&CQL_FILTER=${encodeURIComponent(cqlFilter3)}`;
    
    console.log('   WFS URL (동 이름으로 필터링):', wfsUrl3);
    
    const wfsResponse3 = await fetch(wfsUrl3, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!wfsResponse3.ok) {
      console.error('❌ V-World WFS API 요청 실패');
      return null;
    }

    const responseText3 = await wfsResponse3.text();
    const contentType3 = wfsResponse3.headers.get('content-type') || '';
    
    if (contentType3.includes('xml') || responseText3.trim().startsWith('<?xml')) {
      console.error('❌ WFS API가 XML 형식으로 응답했습니다.');
      return null;
    }

    let wfsData3;
    try {
      wfsData3 = JSON.parse(responseText3);
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패');
      return null;
    }
    
    console.log('   WFS 응답 피처 개수:', wfsData3?.features?.length || 0);
    
    if (wfsData3?.features && wfsData3.features.length > 0) {
      let matchedFeature = wfsData3.features.find((feature: any) => {
        const featureName = feature.properties?.emd_kor_nm || '';
        return featureName === dongName;
      });
      
      if (matchedFeature) {
        console.log('   ✅ 동 이름으로 정확히 매칭된 피처 찾음');
      } else {
        matchedFeature = wfsData3.features.find((feature: any) => {
          const featureEmdCd = String(feature.properties?.emd_cd || '');
          return featureEmdCd === bCode;
        });
        
        if (matchedFeature) {
          console.log('   ✅ emd_cd가 id와 일치하는 피처 찾음');
        } else {
          console.warn('   ⚠️ 정확히 매칭되는 피처를 찾을 수 없어 첫 번째 피처 사용');
          matchedFeature = wfsData3.features[0];
        }
      }
      
      const geometry = matchedFeature?.geometry;
      if (geometry && geometry.coordinates) {
        const matchedName = matchedFeature.properties?.emd_kor_nm || '';
        const matchedEmdCd = matchedFeature.properties?.emd_cd || '';
        console.log('   선택된 피처:', {
          name: matchedName,
          emd_cd: matchedEmdCd,
          요청한동: dongName,
          요청한id: bCode,
        });
        
        const boundary = parseGeoJSONToBoundary(
          { type: 'Feature', geometry: geometry },
          dongName,
          center,
          bCode
        );
        
        if (boundary) {
          console.log('✅ WFS API에서 경계선 데이터 가져오기 성공!');
          console.log('=== V-World API 경계선 가져오기 완료 ===');
          return boundary;
        }
      }
    }
    
    console.log('=== V-World API 경계선 가져오기 실패 ===');
    return null;
  } catch (error) {
    console.error('❌ V-World API 경계선 가져오기 예외 발생');
    console.error('   에러 타입:', error?.constructor?.name);
    console.error('   에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('   에러 스택:', error instanceof Error ? error.stack : '없음');
    console.error('   전체 에러 객체:', error);
    console.log('=== V-World API 경계선 가져오기 실패 ===');
    return null;
  }
};

