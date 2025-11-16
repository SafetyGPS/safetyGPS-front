import React, { CSSProperties, useCallback, useMemo, useState } from 'react';
import { AimOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, List, message, Space, Tag, Typography } from 'antd';
import type { KakaoMaps } from '../../../types/kakao';
import { fetchVWorldBoundary, searchDong } from '../api';
import { OUTER_WRAPPER_STYLE } from '../constants';
import type { DongBoundary, DongSearchResult } from '../types';

interface MapSearchProps {
  kakao: KakaoMaps | null;
  onSelectDong: (boundary: DongBoundary | null) => void;
  className?: string;
  style?: CSSProperties;
}

export const MapSearch: React.FC<MapSearchProps> = ({
  kakao: _kakao,
  onSelectDong,
  className,
  style,
}) => {
  // kakao는 props로 받지만 현재 사용하지 않음 (향후 구현 예정)
  void _kakao;
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DongSearchResult[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const vworldApiKey = import.meta.env.VITE_VWORLD_API_KEY || '';
  const disabled = !vworldApiKey;

  const mergedStyle = useMemo(() => ({ ...OUTER_WRAPPER_STYLE, ...style }), [style]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      messageApi.warning('검색어를 입력해 주세요.');
      return;
    }

    if (disabled) {
      messageApi.warning(
        'V-World API 키가 설정되지 않았습니다. VITE_VWORLD_API_KEY를 확인해 주세요.',
      );
      return;
    }

    setLoading(true);

    try {
      const searchResults = await searchDong(query, vworldApiKey);

      if (!searchResults.length) {
        messageApi.warning(
          '경기도 내 검색 결과가 없습니다. 동 이름(예: 보정동) 또는 시 이름(예: 수원시)으로 검색해 주세요.',
        );
      }

      setResults(searchResults);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        messageApi.error(
          'V-World API 키가 유효하지 않습니다. .env 파일의 VITE_VWORLD_API_KEY를 확인해 주세요.',
        );
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
      if (!item.bCode) {
        messageApi.error('해당 동의 코드 정보가 없습니다.');
        return;
      }

      messageApi.loading({
        content: `${item.name} 경계선을 불러오는 중... (최대 10회 재시도)`,
        key: 'loading',
        duration: 0,
      });

      const boundary = await fetchVWorldBoundary(
        item.bCode,
        item.name,
        item.fullAddress,
        item.center,
        vworldApiKey,
      );

      if (boundary) {
        onSelectDong(boundary);
        setQuery(item.name);
        messageApi.success({ content: `${item.name} 경계선을 표시합니다.`, key: 'loading' });
      } else {
        messageApi.error({
          content: `${item.name} 경계선을 불러오지 못했습니다. 다시 시도해주세요.`,
          key: 'loading',
          duration: 3,
        });
      }
    },
    [onSelectDong, messageApi, vworldApiKey],
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
        styles={{ body: { padding: 16 } }}
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
                >
                  <List.Item.Meta
                    title={
                      <Space size={6}>
                        <AimOutlined />
                        <Typography.Text strong>{item.name}</Typography.Text>
                      </Space>
                    }
                    description={
                      <Typography.Text type="secondary">{item.fullAddress}</Typography.Text>
                    }
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
