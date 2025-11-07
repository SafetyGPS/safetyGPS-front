import React from 'react';
import { FloatButton } from 'antd';
import {
    EnvironmentOutlined,
    VideoCameraOutlined,
    BulbOutlined,
    AlertOutlined,
} from '@ant-design/icons';

interface Props {
    active: { cctv: boolean; light: boolean; police: boolean };
    setActive: React.Dispatch<
    React.SetStateAction<{ cctv: boolean; light: boolean; police: boolean }>
    >;
}

const TRIGGER_SIZE = 56;  // 트리거 버튼 더 크게
const CHILD_SIZE = 48;    // 하위 버튼 더 크게
const GAP = 2;            // 트리거 바로 아래에 '붙어서' 보이도록 촘촘하게

const iconDefaultColor = '#595959'; // 흰 배경에서도 항상 보이는 진회색

const MapButtons: React.FC<Props> = ({ active, setActive }) => {
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
        top: 30,          // 좌측 상단 고정
        left: 30,
        zIndex: 1000,
        width: TRIGGER_SIZE,
        height: TRIGGER_SIZE,
        }}
      // 트리거 버튼(파란 버튼) 스타일
        type="primary"
    >
      {/* 하위 버튼 3개 - 아이콘 항상 보이도록 색 지정 & 간격 최소화 */}
        <FloatButton
        tooltip={{ title: 'CCTV', placement: 'right' }}
        icon={
            <VideoCameraOutlined
            style={{ fontSize: 20, color: active.cctv ? '#ff4d4f' : iconDefaultColor }}
            />
        }
        style={{
            width: CHILD_SIZE,
            height: CHILD_SIZE,
          marginTop: GAP,                 // 트리거 바로 아래로 '붙게'
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
            style={{ fontSize: 20, color: active.light ? '#fadb14' : iconDefaultColor }}
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
            style={{ fontSize: 20, color: active.police ? '#52c41a' : iconDefaultColor }}
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
