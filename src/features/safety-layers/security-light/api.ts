import { apiRequest } from '../../../shared/api/client';

export interface SecurityLightResponse {
  LMP_LC_NM: string;
  LATITUDE: number | string;
  LONGITUDE: number | string;
}

export const syncLightData = (address: string) =>
  apiRequest('/api/security-lights/sync', { address });
export const fetchSecurityLights = (address: string) =>
  apiRequest<SecurityLightResponse[]>('/api/security-lights', { address });
