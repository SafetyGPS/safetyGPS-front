import { apiRequest } from '@/shared/api/client';

export interface SecurityLightResponse {
  LMP_LC_NM: string;
  LATITUDE: number | string;
  LONGITUDE: number | string;
}

export const fetchSecurityLights = (address: string) =>
  apiRequest<SecurityLightResponse[]>('/api/security-lights', { address });
