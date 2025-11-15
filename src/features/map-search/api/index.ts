import { sanitizeAddressText } from '@/shared/utils/address';
import type { VWorldSearchItem } from '@/types/vworld';
import { parseFeatureToBoundary } from '../lib';
import type { DongBoundary, DongSearchResult, LatLngLiteral } from '../types';

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

  // 토큰 기반 쿼리 파싱
  const queryLower = query.toLowerCase().trim();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);
  const queryCities = queryTokens
    .filter((token) => token.endsWith('시') || token.endsWith('군'))
    .map((token) => token.replace(/(?:시|군)$/u, '').trim());
  const queryDongs = queryTokens
    .filter((token) => token.endsWith('동') || token.endsWith('면') || token.endsWith('읍'))
    .map((token) => token.replace(/(?:동|면|읍)$/u, '').trim());

  items.forEach((item: VWorldSearchItem) => {
    const title = sanitizeAddressText(item.title || '');
    if (!title) return;

    if (!title.includes('경기도')) return;

    const titleParts = title.split(' ');
    const dongName = titleParts[titleParts.length - 1];

    // 동/면/읍 필터링
    if (
      titleParts.length > 1 &&
      (titleParts[titleParts.length - 2].endsWith('시') ||
        titleParts[titleParts.length - 2].endsWith('군'))
    ) {
      // 허용
    } else if (!dongName.endsWith('동') && !dongName.endsWith('면') && !dongName.endsWith('읍')) {
      return;
    }

    // Title에서 시/군 추출
    const titleCityNames = titleParts
      .map((part) => part.toLowerCase())
      .filter((part) => part.endsWith('시') || part.endsWith('군'))
      .map((part) => part.replace(/(?:시|군)$/u, '').trim());
    const itemDongName = dongName
      .toLowerCase()
      .replace(/(?:동|면|읍)$/u, '')
      .trim();

    // 검색 쿼리 매칭 (토큰 기반)
    if (queryCities.length && queryDongs.length) {
      // 시/군 + 동 검색 (예: "수원시 조원동")
      const hasCityMatch = queryCities.some((city) => titleCityNames.includes(city));
      const queryDongName = queryDongs[queryDongs.length - 1];
      if (!hasCityMatch || queryDongName !== itemDongName) {
        return;
      }
    } else if (queryCities.length) {
      // 시/군만 검색 (예: "수원시")
      const hasCityMatch = queryCities.some((city) => titleCityNames.includes(city));
      if (!hasCityMatch) {
        return;
      }
    } else if (queryDongs.length) {
      // 동만 검색 (예: "조원동")
      const queryDongName = queryDongs[queryDongs.length - 1];
      if (queryDongName !== itemDongName) {
        return;
      }
    }

    const uniqueKey = `${title}_${dongName}`;
    if (seen.has(uniqueKey)) return;
    seen.add(uniqueKey);

    const point = item.point;
    const center = {
      lat: Number(point?.y) || 0,
      lng: Number(point?.x) || 0,
    };

    results.push({
      id: item.id,
      name: dongName,
      fullAddress: title,
      center,
      bCode: item.id,
    });
  });

  return results.slice(0, 15);
};

/**
 * 지연 함수 (재시도 간격)
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * WFS API로 동 경계선 데이터 가져오기 (재시도 로직 포함)
 * BBOX 필터로 범위를 제한하고, 동 이름으로 정확히 매칭
 */
export const fetchVWorldBoundary = async (
  bCode: string,
  dongName: string,
  fullAddress: string,
  center: LatLngLiteral,
  apiKey: string,
  maxRetries: number = 10,
): Promise<DongBoundary | null> => {
  const bufferSize = 0.05; // 약 5km 반경
  // WFS API는 lng,lat 순서 (minx, miny, maxx, maxy)
  const bbox = `${center.lng - bufferSize},${center.lat - bufferSize},${center.lng + bufferSize},${center.lat + bufferSize}`;
  // 동적 도메인 설정
  const domain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
  const wfsUrl = `/api/vworld/req/wfs?service=wfs&request=GetFeature&typename=lt_c_ademd&version=2.0.0&srsName=EPSG:4326&output=application/json&key=${apiKey}&domain=${encodeURIComponent(domain)}&bbox=${bbox}&maxfeatures=100`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(wfsUrl);

      if (!response.ok) {
        if (attempt < maxRetries) {
          await sleep(1000);
          continue;
        }
        return null;
      }

      const wfsData = await response.json();

      if (wfsData?.type !== 'FeatureCollection' || !wfsData?.features?.length) {
        if (attempt < maxRetries) {
          await sleep(1000);
          continue;
        }
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
        if (attempt < maxRetries) {
          await sleep(1000);
          continue;
        }
        return null;
      }

      // Feature에서 직접 경계선 생성
      const boundary = parseFeatureToBoundary(matchedFeature, dongName, center, bCode);

      if (boundary) {
        const normalizedAddress =
          sanitizeAddressText(fullAddress) || sanitizeAddressText(boundary.name) || boundary.name;
        return {
          ...boundary,
          address: normalizedAddress,
        };
      }

      // 파싱 실패 시 재시도
      if (attempt < maxRetries) {
        await sleep(1000);
        continue;
      }

      return null;
    } catch {
      if (attempt < maxRetries) {
        await sleep(1000);
        continue;
      }
      return null;
    }
  }

  return null;
};
