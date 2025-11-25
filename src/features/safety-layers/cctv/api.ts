import { apiRequest } from '../../../shared/api/client';

export interface CctvResponse {
  address: string;
  latitude: number | string;
  longitude: number | string;
}

export const syncCctvData = (region: string) =>
  apiRequest('/api/cctv/sync', { region });
export const fetchCctvLocations = (region: string) =>
  apiRequest<CctvResponse[]>('/api/cctv', { region });