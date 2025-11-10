import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import { AimOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, List, Space, Tag, Typography, message } from 'antd';
import type { DongBoundary, DongSearchResult } from '../types';
import { DONG_POLYGON_BY_NAME } from '../mock';
import { searchDong, fetchVWorldBoundary } from '../api';
import { buildApproxBoundary } from '../lib';
import { OUTER_WRAPPER_STYLE } from '../constants';

interface MapSearchProps {
  kakao: any | null;
  onSelectDong: (boundary: DongBoundary | null) => void;
  className?: string;
  style?: CSSProperties;
}

export const MapSearch: React.FC<MapSearchProps> = ({ kakao, onSelectDong, className, style }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DongSearchResult[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const vworldApiKey = (import.meta as any).env?.VITE_VWORLD_API_KEY || '';
  const disabled = !vworldApiKey;
  
  useEffect(() => {
    if ((import.meta as any).env?.MODE === 'development') {
      console.log('V-World API 키 확인:', vworldApiKey ? `${vworldApiKey.substring(0, 10)}...` : '없음');
    }
  }, [vworldApiKey]);

  const mergedStyle = useMemo(() => ({ ...OUTER_WRAPPER_STYLE, ...style }), [style]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      messageApi.warning('검색어를 입력해 주세요.');
      return;
    }

    if (disabled) {
      messageApi.warning('V-World API 키가 설정되지 않았습니다. VITE_VWORLD_API_KEY를 확인해 주세요.');
      return;
    }

    setLoading(true);

    try {
      const searchResults = await searchDong(query, vworldApiKey);
      
      const resultsWithMock = searchResults.map(result => ({
        ...result,
        hasExactBoundary: Boolean(DONG_POLYGON_BY_NAME[result.name]),
      }));

      if (!resultsWithMock.length) {
        messageApi.warning('경기도 내 검색 결과가 없습니다. 동 이름(예: 보정동) 또는 시 이름(예: 수원시)으로 검색해 주세요.');
      }

      setResults(resultsWithMock);
    } catch (error: any) {
      console.error('동 검색 오류:', error);
      const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        messageApi.error('V-World API 키가 유효하지 않습니다. .env 파일의 VITE_VWORLD_API_KEY를 확인해 주세요.');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        messageApi.error('V-World API 접근이 거부되었습니다. API 키 권한을 확인해 주세요.');
      } else {
        messageApi.error(`검색 중 오류가 발생했습니다: ${errorMessage}`);
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [disabled, vworldApiKey, messageApi, query]);

  const handleSelect = useCallback(
    async (item: DongSearchResult) => {
      console.log('=== 동 선택 처리 시작 ===');
      console.log('선택된 동 정보:', {
        name: item.name,
        fullAddress: item.fullAddress,
        center: item.center,
        bCode: item.bCode,
        hasExactBoundary: item.hasExactBoundary,
        geometryUrl: item.geometryUrl || '없음',
      });

      console.log('2단계: 실제 경계선 데이터 가져오기 시도');
      console.log('   bCode 존재:', !!item.bCode);
      console.log('   geometryUrl 존재:', !!item.geometryUrl);
      if (item.geometryUrl) {
        console.log('   geometryUrl 값:', item.geometryUrl);
      }
      if (item.bCode) {
        console.log('   bCode 값:', item.bCode);
        messageApi.loading({ content: `${item.name} 경계선을 불러오는 중...`, key: 'loading' });
        
        console.log('   V-World API 호출 시작...');
        console.log('   전달 파라미터:', {
          bCode: item.bCode,
          name: item.name,
          fullAddress: item.fullAddress,
          center: item.center,
          geometryUrl: item.geometryUrl || '없음',
        });
        const vworldBoundary = await fetchVWorldBoundary(
          item.bCode,
          item.name,
          item.fullAddress,
          item.center,
          item.geometryUrl,
          vworldApiKey
        );
        console.log('   V-World API 호출 완료');
        console.log('   결과:', vworldBoundary ? '성공' : '실패');
        
        if (vworldBoundary) {
          console.log('   ✅ V-World API에서 경계선 데이터 획득 성공');
          console.log('   경계선 좌표 개수:', vworldBoundary.path.length);
          onSelectDong(vworldBoundary);
          setQuery(item.name);
          messageApi.success({ content: `${item.name} 실제 경계선을 표시합니다.`, key: 'loading' });
          console.log('=== 동 선택 처리 완료 (V-World API) ===');
          return;
        }
        console.log('   ❌ V-World API에서 경계선 데이터 획득 실패');
        messageApi.destroy('loading');
      } else {
        console.log('   ❌ bCode가 없어 V-World API 호출 불가');
      }

      console.log('3단계: 임시 경계선 생성');
      const boundary = buildApproxBoundary(item);
      console.log('   임시 경계선 생성 완료');
      console.log('   임시 경계선 좌표 개수:', boundary.path.length);
      console.log('   임시 경계선 범위:', {
        minLat: Math.min(...boundary.path.map(p => p.lat)),
        maxLat: Math.max(...boundary.path.map(p => p.lat)),
        minLng: Math.min(...boundary.path.map(p => p.lng)),
        maxLng: Math.max(...boundary.path.map(p => p.lng)),
      });
      
      onSelectDong(boundary);
      setQuery(item.name);
      messageApi.warning({ 
        content: `${item.name} 실제 경계선 데이터를 찾을 수 없어 임시 경계선을 표시합니다.`, 
        key: 'loading',
        duration: 3,
      });
      console.log('=== 동 선택 처리 완료 (임시 경계선) ===');
    },
    [onSelectDong, messageApi, vworldApiKey, query]
  );

  const handleClear = useCallback(() => {
    setResults([]);
    setQuery('');
    onSelectDong(null);
  }, [onSelectDong]);

  return (
    <div className={className} style={mergedStyle}>
      {contextHolder}
      <Card
        size="small"
        title="동 검색"
        extra={
          <Space size={8}>
            <Tag color={disabled ? 'default' : 'cyan'}>{disabled ? '로딩 중' : '실시간'}</Tag>
            <Button
              type="text"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={handleClear}
              disabled={!query && !results.length}
            />
          </Space>
        }
        bodyStyle={{ padding: 16 }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="경기도 동 검색 (예: 보정동, 수원시)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onPressEnter={handleSearch}
            allowClear
            disabled={disabled}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleSearch}
            disabled={disabled}
          >
            검색
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 12, maxHeight: 260, overflowY: 'auto' }}>
          {!results.length && !loading ? (
            <Empty description="검색 결과가 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={results}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(item)}
                  actions={[
                    item.hasExactBoundary ? (
                      <Tag color="green" key="exact">
                        경계 데이터
                      </Tag>
                    ) : (
                      <Tag color="orange" key="approx">
                        임시 경계
                      </Tag>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space size={6}>
                        <AimOutlined />
                        <Typography.Text strong>{item.name}</Typography.Text>
                      </Space>
                    }
                    description={<Typography.Text type="secondary">{item.fullAddress}</Typography.Text>}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default MapSearch;

