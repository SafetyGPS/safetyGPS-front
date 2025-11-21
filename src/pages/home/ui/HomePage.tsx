import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { KakaoMap } from '../../../features/kakao-map';
import { MapButtons } from '../../../features/map-buttons';
import { MapSearch } from '../../../features/map-search';
import type { DongBoundary } from '../../../features/map-search/types';
import {
    useCctvLayer,
    useFacilityLayer,
    useSecurityLightLayer,
} from '../../../features/safety-layers';
import { extractAddressParts } from '../../../shared/utils/address';
import type { KakaoMaps } from '../../../types/kakao';

import RiskScoreModal from '../../../features/risk-modal/RiskScoreModal';

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

    const [kakaoObj, setKakaoObj] = useState<KakaoMaps | null>(() =>
        typeof window !== 'undefined' ? (window.kakao ?? null) : null,
    );

    const prevActiveRef = useRef(active);
    const warnedLayersRef = useRef<Set<LayerKey>>(new Set());

    const addressParts = useMemo(
        () =>
            selectedDong
                ? extractAddressParts(selectedDong.address ?? selectedDong.name, selectedDong.name)
                : null,
        [selectedDong],
    );

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
                    messageApi.warning('먼저 검색에서 동/읍/면을 선택해 주세요.');
                    warnedLayersRef.current.add(key);
                }
            }
        });

        prevActiveRef.current = active;
    }, [active, messageApi, selectedDong]);

    // ★ 테스트용: 위험점수 90점 (안전)
    const riskScore = 90;

    // ★ 테스트용: CCTV/가로등/치안센터 개수 고정
    const testCctvCount = 30;
    const testLightCount = 100;
    const testPoliceCount = 2;

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
                isModalOpen={isRiskModalOpen}
            />

            <MapButtons
                active={active}
                setActive={setActive}
                onOpenRiskModal={() => {
                    if (!selectedDong) {
                        messageApi.warning('먼저 동을 검색해 주세요.');
                        return;
                    }
                    setIsRiskModalOpen(true);
                }}
            />

            <MapSearch kakao={kakaoObj} onSelectDong={setSelectedDong} />

            <RiskScoreModal
                isOpen={isRiskModalOpen}
                onClose={() => setIsRiskModalOpen(false)}
                dongName={selectedDong?.name ?? '연무동'}
                score={riskScore}
                cctvCount={testCctvCount}
                lightCount={testLightCount}
                policeCount={testPoliceCount}
            />
        </div>
    );
};

export default HomePage;
