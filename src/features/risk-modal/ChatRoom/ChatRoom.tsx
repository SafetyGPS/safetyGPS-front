import React, { useState } from 'react';
import { CloseOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import './ChatRoom.css';
import type { Feedback } from './useChatRoom';

interface ChatRoomProps {
  feedbacks: Feedback[];
  feedbackRating: number;
  feedbackComment: string;
  averageRating: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onChangeRating: (value: number) => void;
  onChangeComment: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  feedbacks,
  feedbackRating,
  feedbackComment,
  averageRating,
  isLoading,
  isSubmitting,
  error,
  onChangeRating,
  onChangeComment,
  onSubmit,
  onClose,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || feedbackRating;

  const displayRatingLabel = feedbacks.length ? averageRating.toFixed(1) : '0.0';

  return (
    <div className="feedback-modal">
      <div className="feedback-header">
        <div>
          <h4 className="feedback-title">리뷰</h4>
          <span className="feedback-average">평균 {displayRatingLabel} / 5.0</span>
        </div>
        <button className="feedback-close-btn" onClick={onClose} aria-label="리뷰 닫기">
          <CloseOutlined />
        </button>
      </div>

      <div className="feedback-list">
        {isLoading ? (
          <div className="feedback-empty">리뷰를 불러오는 중입니다...</div>
        ) : error ? (
          <div className="feedback-error">{error}</div>
        ) : feedbacks.length === 0 ? (
          <div className="feedback-empty">아직 작성된 리뷰가 없습니다.</div>
        ) : (
          feedbacks.map((item) => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-item-header">
                <span className="feedback-author">{item.author}</span>
                <span className="feedback-meta">{item.createdAt}</span>
              </div>
              <div className="feedback-stars-inline">
                {[1, 2, 3, 4, 5].map((star) =>
                  star <= item.rating ? (
                    <StarFilled key={star} className="feedback-star filled" />
                  ) : (
                    <StarOutlined key={star} className="feedback-star" />
                  ),
                )}
              </div>
              <p className="feedback-comment">{item.comment}</p>
            </div>
          ))
        )}
      </div>

      <div className="feedback-divider" />

      <div className="feedback-rating-row">
        <span>별점 선택</span>
        <div className="feedback-rating-stars" role="radiogroup" aria-label="별점 선택">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`feedback-star-btn${star <= displayRating ? ' filled' : ''}`}
              onClick={() => onChangeRating(star)}
              aria-label={`${star}점 선택`}
              aria-pressed={star <= feedbackRating}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              {star <= displayRating ? <StarFilled /> : <StarOutlined />}
            </button>
          ))}
        </div>
      </div>

      <div className="feedback-input-row">
        <input
          className="feedback-input"
          value={feedbackComment}
          onChange={(event) => onChangeComment(event.target.value)}
          placeholder="리뷰를 입력해 주세요..."
          aria-label="리뷰 입력"
        />
        <button
          className="feedback-submit-btn"
          onClick={onSubmit}
          disabled={!feedbackComment.trim() || feedbackRating === 0 || isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '작성'}
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
