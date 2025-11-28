import { apiRequest, apiRequestJson } from '../../shared/api/client';

export interface SafetyScoreResponse {
  requestAddress: string;
  sigunNm: string;
  gu: string;
  dong: string;
  cctvCount: number;
  securityLightCount: number;
  facilityCount: number;
  reviewCount: number;
  reviewAverage: number;
  cctvScore: number;
  securityLightScore: number;
  facilityScore: number;
  reviewScore: number;
  totalScore: number;
}

export const fetchSafetyScore = (address: string) =>
  apiRequest<SafetyScoreResponse>('/api/safety/score', { address });

export interface Review {
  id: number;
  name: string;
  content: string;
  rating: number;
  address: string;
  sigunNm: string;
  gu: string;
  dong: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQuery {
  sigunNm?: string;
  gu?: string;
  dong?: string;
}

export interface CreateReviewRequest {
  name: string;
  content: string;
  rating: number;
  address: string;
}

export const fetchReviews = (params: ReviewQuery) =>
  apiRequest<Review[]>('/api/reviews', {
    sigunNm: params.sigunNm,
    gu: params.gu,
    dong: params.dong,
  });

export const createReview = (payload: CreateReviewRequest) =>
  apiRequestJson<Review>('/api/reviews', {
    method: 'POST',
    body: payload,
  });
