export type QueryParams = Record<string, string | undefined>;

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
