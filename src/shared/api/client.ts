export type QueryParams = Record<string, string | undefined>;
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: QueryParams;
  body?: unknown;
}

const sanitizeBaseUrl = (value?: string) => (value ? value.replace(/\/$/, '') : '');

const API_BASE_URL = import.meta.env.DEV ? '' : sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const buildQueryString = (params?: QueryParams) => {
  if (!params) return '';

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      searchParams.set(key, value.trim());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const apiRequest = async <T>(path: string, params?: QueryParams): Promise<T> => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE_URL}${normalizedPath}${query}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const apiRequestJson = async <T>(
  path: string,
  options: ApiRequestOptions,
): Promise<T> => {
  const { method = 'GET', params, body } = options || {};
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const query = buildQueryString(params);

  const response = await fetch(`${API_BASE_URL}${normalizedPath}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};
