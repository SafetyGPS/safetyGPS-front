import { useCallback, useEffect, useMemo, useState } from 'react';
import { createReview, fetchReviews, type CreateReviewRequest, type Review } from '../api';

export interface Feedback {
  id: number;
  author: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export interface UseChatRoomParams {
  sigunNm?: string;
  gu?: string;
  dong?: string;
  address?: string;
}

const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const mapReviewToFeedback = (review: Review): Feedback => ({
  id: review.id,
  author: review.name || '익명',
  comment: review.content,
  rating: review.rating,
  createdAt: formatDate(review.createdAt),
});

export const useChatRoom = ({ sigunNm, gu, dong, address }: UseChatRoomParams) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationKey = useMemo(
    () =>
      [sigunNm, gu, dong]
        .filter((part) => typeof part === 'string' && part.trim().length > 0)
        .join('|'),
    [sigunNm, gu, dong],
  );

  const averageRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const sum = feedbacks.reduce((acc, item) => acc + item.rating, 0);
    return sum / feedbacks.length;
  }, [feedbacks]);

  const loadFeedbacks = useCallback(async () => {
    if (!locationKey) {
      setFeedbacks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reviews = await fetchReviews({ sigunNm, gu, dong });
      setFeedbacks(reviews.map(mapReviewToFeedback));
    } catch (err) {
      const message = err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.';
      setError(message);
      setFeedbacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [dong, gu, locationKey, sigunNm]);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  const submitFeedback = async () => {
    const trimmed = feedbackComment.trim();
    if (!trimmed || feedbackRating === 0) return;

    const resolvedAddress = address?.trim() || [sigunNm, gu, dong].filter(Boolean).join(' ');
    if (!resolvedAddress) {
      setError('리뷰를 등록할 주소 정보가 없습니다.');
      return;
    }

    const payload: CreateReviewRequest = {
      name: '익명',
      content: trimmed,
      rating: feedbackRating,
      address: resolvedAddress,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createReview(payload);
      setFeedbacks((prev) => [mapReviewToFeedback(created), ...prev]);
      setFeedbackComment('');
      setFeedbackRating(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : '리뷰를 저장하지 못했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChat = () => setShowChat(true);
  const closeChat = () => setShowChat(false);

  return {
    feedbacks,
    feedbackRating,
    feedbackComment,
    averageRating,
    showChat,
    isLoading,
    isSubmitting,
    error,
    setFeedbackRating,
    setFeedbackComment,
    submitFeedback,
    openChat,
    closeChat,
    reload: loadFeedbacks,
  };
};

export default useChatRoom;
