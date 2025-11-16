import { apiRequest } from '../../../shared/api/client';

export interface CctvResponse {
  address: string;
  latitude: number | string;
  longitude: number | string;
}

export const fetchCctvLocations = (region: string) =>
  apiRequest<CctvResponse[]>('/api/cctv', { region });
