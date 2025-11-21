import React from 'react';
import {
  AlertOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { FloatButton } from 'antd';
import riskMarker from '../../../assets/icons/gps.png';

export interface MapButtonsProps {
  active: { cctv: boolean; light: boolean; police: boolean };
  setActive: React.Dispatch<
    React.SetStateAction<{ cctv: boolean; light: boolean; police: boolean }>
  >;
  /** 위험점수 모달을 열기 위한 콜백 (HomePage에서 내려줄 예정) */
  onOpenRiskModal?: () => void;
}

export const TRIGGER_SIZE = 56;
export const CHILD_SIZE = 48;
export const GAP = 0;
export const ICON_DEFAULT_COLOR = '#595959';

export const MapButtons: React.FC<MapButtonsProps> = ({
  active,
  setActive,
  onOpenRiskModal,
}) => {
  const toggle = (key: 'cctv' | 'light' | 'police') => {
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <FloatButton.Group
      trigger="click"
      shape="circle"
      placement="bottom"
      icon={<EnvironmentOutlined />}
      style={{
        position: 'absolute',
        top: 30,
        left: 30,
        zIndex: 1000,
        width: TRIGGER_SIZE,
        height: TRIGGER_SIZE,
      }}
      type="primary"
    >
      {/* CCTV */}
      <FloatButton
        tooltip={{ title: 'CCTV', placement: 'right' }}
        icon={
          <VideoCameraOutlined
            style={{ fontSize: 20, color: active.cctv ? '#ff4d4f' : ICON_DEFAULT_COLOR }}
          />
        }
        style={{
          width: CHILD_SIZE,
          height: CHILD_SIZE,
          marginTop: GAP,
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          opacity: active.cctv ? 0.85 : 1,
        }}
        onClick={() => toggle('cctv')}
      />

      {/* 가로등 */}
      <FloatButton
        tooltip={{ title: '가로등', placement: 'right' }}
        icon={
          <BulbOutlined
            style={{ fontSize: 20, color: active.light ? '#fadb14' : ICON_DEFAULT_COLOR }}
          />
        }
        style={{
          width: CHILD_SIZE,
          height: CHILD_SIZE,
          marginTop: GAP,
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          opacity: active.light ? 0.85 : 1,
        }}
        onClick={() => toggle('light')}
      />

      {/* 치안 센터 */}
      <FloatButton
        tooltip={{ title: '치안 센터', placement: 'right' }}
        icon={
          <AlertOutlined
            style={{ fontSize: 20, color: active.police ? '#52c41a' : ICON_DEFAULT_COLOR }}
          />
        }
        style={{
          width: CHILD_SIZE,
          height: CHILD_SIZE,
          marginTop: GAP,
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          opacity: active.police ? 0.85 : 1,
        }}
        onClick={() => toggle('police')}
      />

      {/* 🔴 위험점수 버튼 */}
      <FloatButton
        tooltip={{ title: '위험 점수', placement: 'right' }}
        icon={
          <img
            src={riskMarker}
            alt="위험점수"
            style={{ 
              width: 30, 
              height: 30, 
              transform: 'translateX(-5px)',   // ★ PNG 오프셋 보정 핵심!
              display: 'block'
            }}
          />
        }
        style={{
          width: CHILD_SIZE,
          height: CHILD_SIZE,
          marginTop: GAP,
          backgroundColor: '#ffe6e6',
          display: 'flex',            // ★ 중앙정렬 핵심
          alignItems: 'center',       // ★ 수직 중앙
          justifyContent: 'center',   // ★ 수평 중앙
          padding: 0, // 연한 빨간색 배경
        }}
        onClick={() => {
          if (onOpenRiskModal) {
            onOpenRiskModal();
          }
        }}
      />
    </FloatButton.Group>
  );
};

export default MapButtons;
