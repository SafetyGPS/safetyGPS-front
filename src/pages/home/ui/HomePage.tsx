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

    // ❗ 임시 점수 (나중에 계산 가능)
    const riskScore = 65;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
            }}
        >
            {contextHolder}

            {/* 지도 */}
            <KakaoMap
                active={active}
                selectedDong={selectedDong}
                onKakaoReady={handleKakaoReady}
                cctvLocations={cctvMarkers}
                securityLightLocations={securityLightMarkers}
                facilityLocations={facilityMarkers}
            />

            {/* 버튼 */}
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

            {/* 검색 */}
            <MapSearch kakao={kakaoObj} onSelectDong={setSelectedDong} />

            {/* 🔥 위험점수 모달 */}
            <RiskScoreModal
                isOpen={isRiskModalOpen}
                onClose={() => setIsRiskModalOpen(false)}
                dongName={selectedDong?.name ?? ''}
                score={riskScore}
                cctvCount={cctvMarkers?.length ?? 0}
                lightCount={securityLightMarkers?.length ?? 0}
                policeCount={facilityMarkers?.length ?? 0}
            />
        </div>
    );
};

export default HomePage;
