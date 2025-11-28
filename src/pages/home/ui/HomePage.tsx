import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { KakaoMap } from '../../../features/kakao-map';
import { MapButtons } from '../../../features/map-buttons';
import { MapSearch } from '../../../features/map-search';
import type { DongBoundary } from '../../../features/map-search/types';
import { RiskScoreModal } from '../../../features/risk-modal/RiskScoreModal';
import { fetchSafetyScore, type SafetyScoreResponse } from '../../../features/risk-modal/api';
import { fetchCctvLocations, syncCctvData } from '../../../features/safety-layers/cctv/api';
import { fetchFacilities, syncFacilityData } from '../../../features/safety-layers/facility/api';
import { fetchSecurityLights, syncLightData } from '../../../features/safety-layers/security-light/api';
import {
  useCctvLayer,
  useFacilityLayer,
  useSecurityLightLayer,
} from '../../../features/safety-layers';
import { extractAddressParts } from '../../../shared/utils/address';
import type { KakaoMaps } from '../../../types/kakao';

type ActiveState = { cctv: boolean; light: boolean; police: boolean };
type LayerKey = keyof ActiveState;

export const HomePage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [active, setActive] = useState<ActiveState>({
    cctv: false,
    light: false,
    police: false,
  });

  const [selectedDong, setSelectedDong] = useState<DongBoundary | null>(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [safetyScore, setSafetyScore] = useState<SafetyScoreResponse | null>(null);
  const [isSafetyScoreLoading, setIsSafetyScoreLoading] = useState(false);
  const [resourceCounts, setResourceCounts] = useState({
    cctv: 0,
    light: 0,
    police: 0,
  });

  const [kakaoObj, setKakaoObj] = useState<KakaoMaps | null>(() =>
    typeof window !== 'undefined' ? (window.kakao ?? null) : null,
  );

  const prevActiveRef = useRef(active);
  const warnedLayersRef = useRef<Set<LayerKey>>(new Set());
  const selectedDongRef = useRef<DongBoundary | null>(null);

  const addressParts = useMemo(
    () =>
      selectedDong
        ? extractAddressParts(selectedDong.address ?? selectedDong.name, selectedDong.name)
        : null,
    [selectedDong],
  );

  useEffect(() => {
    selectedDongRef.current = selectedDong;
    setSafetyScore(null);
    setIsRiskModalOpen(false);
    setResourceCounts({ cctv: 0, light: 0, police: 0 });
  }, [selectedDong]);

  const handleKakaoReady = useCallback((kakao: KakaoMaps) => {
    setKakaoObj(kakao);
  }, []);

  const handleLayerError = useCallback(
    (errorMessage: string) => {
      messageApi.error(errorMessage);
    },
    [messageApi],
  );

  const cctvMarkers = useCctvLayer({
    active: active.cctv,
    regionQuery: addressParts?.regionQuery,
    onError: handleLayerError,
  });

  const securityLightMarkers = useSecurityLightLayer({
    active: active.light,
    address: addressParts?.address,
    onError: handleLayerError,
  });

  const facilityMarkers = useFacilityLayer({
    active: active.police,
    sigunNm: addressParts?.sigunNm,
    gu: addressParts?.gu,
    dong: addressParts?.dong,
    onError: handleLayerError,
  });

  useEffect(() => {
    if (selectedDong) {
      warnedLayersRef.current.clear();
    }

    (Object.keys(active) as LayerKey[]).forEach((key) => {
      if (active[key] && !prevActiveRef.current[key] && !selectedDong) {
        if (!warnedLayersRef.current.has(key)) {
          messageApi.warning('먼저 검색에서 동을 선택해 주세요.');
          warnedLayersRef.current.add(key);
        }
      }
    });

    prevActiveRef.current = active;
  }, [active, messageApi, selectedDong]);

  const handleOpenRiskModal = useCallback(async () => {
    if (!selectedDong) {
      messageApi.warning('먼저 지역을 검색해 주세요.');
      return;
    }

    const requestDongId = selectedDong.id;

    if (isSafetyScoreLoading) {
      setIsRiskModalOpen(true);
      return;
    }

    const addressQuery = (
      addressParts?.regionQuery ||
      selectedDong.address ||
      selectedDong.name ||
      ''
    ).trim();

    if (!addressQuery) {
      messageApi.warning('주소 정보를 찾지 못했습니다. 다시 선택해 주세요.');
      return;
    }

    setIsRiskModalOpen(true);

    const loadingKey = 'risk-score-loading';

    setIsSafetyScoreLoading(true);
    messageApi.open({
      key: loadingKey,
      type: 'loading',
      content: `${addressQuery} 안전지수를 불러오는 중입니다...`,
      duration: 0,
    });

    try {
      const syncTasks: Promise<unknown>[] = [];
      const regionQuery = addressParts?.regionQuery || addressParts?.dong || selectedDong.name;
      const address = addressParts?.address || addressParts?.regionQuery;
      const { sigunNm, gu, dong } = addressParts ?? {};
      const hasFacilityQuery = Boolean(sigunNm);

      if (regionQuery) {
        syncTasks.push(
          syncCctvData(regionQuery).catch((error) =>
            console.warn('Failed to sync CCTV before safety score', error),
          ),
        );
      }

      if (address) {
        syncTasks.push(
          syncLightData(address).catch((error) =>
            console.warn('Failed to sync security lights before safety score', error),
          ),
        );
      }

      if (hasFacilityQuery) {
        syncTasks.push(
          syncFacilityData(sigunNm, gu, dong).catch((error) =>
            console.warn('Failed to sync facilities before safety score', error),
          ),
        );
      }

      if (syncTasks.length) {
        await Promise.all(syncTasks);
      }

      if (selectedDongRef.current?.id !== requestDongId) {
        return;
      }

      const [scoreResponse, cctvList, lightList, facilityList] = await Promise.all([
        fetchSafetyScore(addressQuery),
        regionQuery ? fetchCctvLocations(regionQuery).catch(() => []) : Promise.resolve([]),
        address ? fetchSecurityLights(address).catch(() => []) : Promise.resolve([]),
        hasFacilityQuery
          ? fetchFacilities(sigunNm, gu, dong).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (selectedDongRef.current?.id !== requestDongId) {
        return;
      }

      setSafetyScore(scoreResponse);
      setResourceCounts({
        cctv: Array.isArray(cctvList) ? cctvList.length : 0,
        light: Array.isArray(lightList) ? lightList.length : 0,
        police: Array.isArray(facilityList) ? facilityList.length : 0,
      });
      messageApi.success({
        key: loadingKey,
        content: '안전지수를 불러왔습니다.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '안전지수를 불러오지 못했습니다.';
      messageApi.error({
        key: loadingKey,
        content: `안전지수 조회 실패: ${errorMessage}`,
        duration: 3,
      });
    } finally {
      setIsSafetyScoreLoading(false);
    }
  }, [addressParts, isSafetyScoreLoading, messageApi, selectedDong]);

  const modalScore = safetyScore ? Math.round(safetyScore.totalScore) : 0;
  const modalCctvCount = Math.max(safetyScore?.cctvCount ?? 0, resourceCounts.cctv);
  const modalLightCount = Math.max(
    safetyScore?.securityLightCount ?? 0,
    resourceCounts.light,
  );
  const modalPoliceCount = Math.max(safetyScore?.facilityCount ?? 0, resourceCounts.police);
  const modalSigunNm = safetyScore?.sigunNm || addressParts?.sigunNm;
  const modalGu = safetyScore?.gu || addressParts?.gu;
  const modalDong = safetyScore?.dong || addressParts?.dong || selectedDong?.name;
  const modalAddress =
    safetyScore?.requestAddress ||
    addressParts?.address ||
    selectedDong?.address ||
    selectedDong?.name ||
    '';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
      }}
    >
      {contextHolder}

      <KakaoMap
        active={active}
        selectedDong={selectedDong}
        onKakaoReady={handleKakaoReady}
        cctvLocations={cctvMarkers}
        securityLightLocations={securityLightMarkers}
        facilityLocations={facilityMarkers}
      />

      <MapButtons active={active} setActive={setActive} onOpenRiskModal={handleOpenRiskModal} />

      <MapSearch kakao={kakaoObj} onSelectDong={setSelectedDong} />

      <RiskScoreModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        dongName={selectedDong?.name ?? '미선택'}
        score={modalScore}
        cctvCount={modalCctvCount}
        lightCount={modalLightCount}
        policeCount={modalPoliceCount}
        sigunNm={modalSigunNm}
        gu={modalGu}
        dong={modalDong}
        address={modalAddress}
      />
    </div>
  );
};

export default HomePage;
