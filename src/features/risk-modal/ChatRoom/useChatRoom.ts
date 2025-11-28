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
  author: review.name || 'anonymous',
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

  const loadFeedbacks = useCallback(
    async (signal?: AbortSignal) => {
      if (!locationKey) {
        setFeedbacks([]);
        return;
      }

      const [parsedSigunNm, parsedGu, parsedDong] = locationKey.split('|');
      const reviewParams = {
        sigunNm: parsedSigunNm || undefined,
        gu: parsedGu || undefined,
        dong: parsedDong || undefined,
      };

      setIsLoading(true);
      setError(null);

      try {
        const reviews = await fetchReviews(reviewParams, signal);
        if (signal?.aborted) return;
        setFeedbacks(reviews.map(mapReviewToFeedback));
      } catch (err) {
        if (signal?.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load reviews.';
        setError(message);
        setFeedbacks([]);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [locationKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadFeedbacks(controller.signal);
    return () => controller.abort();
  }, [loadFeedbacks]);

  const submitFeedback = useCallback(async () => {
    const trimmed = feedbackComment.trim();
    if (!trimmed || feedbackRating === 0) return;

    const resolvedAddress = address?.trim() || [sigunNm, gu, dong].filter(Boolean).join(' ');
    if (!resolvedAddress) {
      setError('Address is required to submit a review.');
      return;
    }

    const payload: CreateReviewRequest = {
      name: 'anonymous',
      content: trimmed,
      rating: feedbackRating,
      address: resolvedAddress,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createReview(payload);
      if (!created) {
        setError('No response returned for review submission.');
        return;
      }
      setFeedbacks((prev) => [mapReviewToFeedback(created), ...prev]);
      setFeedbackComment('');
      setFeedbackRating(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [address, dong, feedbackComment, feedbackRating, gu, sigunNm]);

  const openChat = useCallback(() => setShowChat(true), []);
  const closeChat = useCallback(() => setShowChat(false), []);

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
