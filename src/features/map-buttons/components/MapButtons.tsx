import React from 'react';

import {
  AlertOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { FloatButton } from 'antd';

export interface MapButtonsProps {
  active: { cctv: boolean; light: boolean; police: boolean };
  setActive: React.Dispatch<
    React.SetStateAction<{ cctv: boolean; light: boolean; police: boolean }>
  >;
}

export const TRIGGER_SIZE = 56;
export const CHILD_SIZE = 48;
export const GAP = 2;
export const ICON_DEFAULT_COLOR = '#595959';

export const MapButtons: React.FC<MapButtonsProps> = ({ active, setActive }) => {
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
    </FloatButton.Group>
  );
};

export default MapButtons;
