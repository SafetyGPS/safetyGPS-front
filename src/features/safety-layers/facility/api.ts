import { apiRequest } from '../../../shared/api/client';

export interface FacilityResponse {
  institutionName: string;
  facilityType: string;
  sigunNm: string;
  gu?: string;
  dong?: string;
  roadAddress: string;
  latitude: number | string;
  longitude: number | string;
}

export const syncFacilityData = (sigunNm?: string, gu?: string, dong?: string) =>
  apiRequest('/api/facilities/sync', {
    sigunNm,
    gu,
    dong,
  });
export const fetchFacilities = (sigunNm?: string, gu?: string, dong?: string) =>
  apiRequest<FacilityResponse[]>('/api/facilities', {
    sigunNm,
    gu,
    dong,
  });
