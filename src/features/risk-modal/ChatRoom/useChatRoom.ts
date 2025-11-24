import { useMemo, useState } from 'react';

export interface Feedback {
  id: string;
  author: string;
  comment: string;
  rating: number;
  createdAt: string;
}

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const INITIAL_FEEDBACKS: Feedback[] = [
  {
    id: '1',
    author: '익명',
    comment: '초저녁에는 밝고 사람도 많아요. 골목길만 조심하면 될 듯!',
    rating: 4,
    createdAt: '2024-11-20',
  },
  {
    id: '2',
    author: '익명',
    comment: '조용해서 좋은데 늦은 밤엔 순찰이 조금 더 있으면 좋겠어요.',
    rating: 3,
    createdAt: '2024-11-21',
  },
];

export const useChatRoom = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(INITIAL_FEEDBACKS);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showChat, setShowChat] = useState(false);

  const averageRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const sum = feedbacks.reduce((acc, item) => acc + item.rating, 0);
    return sum / feedbacks.length;
  }, [feedbacks]);

  const submitFeedback = () => {
    const trimmed = feedbackComment.trim();
    if (!trimmed || feedbackRating === 0) return;

    const newFeedback: Feedback = {
      id: `${Date.now()}`,
      author: '익명',
      comment: trimmed,
      rating: feedbackRating,
      createdAt: formatDate(new Date()),
    };

    setFeedbacks((prev) => [newFeedback, ...prev]);
    setFeedbackComment('');
    setFeedbackRating(0);
  };

  const openChat = () => setShowChat(true);
  const closeChat = () => setShowChat(false);

  return {
    feedbacks,
    feedbackRating,
    feedbackComment,
    averageRating,
    showChat,
    setFeedbackRating,
    setFeedbackComment,
    submitFeedback,
    openChat,
    closeChat,
  };
};

export default useChatRoom;
