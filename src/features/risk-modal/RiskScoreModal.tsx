import React, { useState } from 'react';
import { CloseOutlined, InfoCircleOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import './RiskScoreModal.css';
import commentIcon from '../../assets/icons/comment.png';
import modalCctv from '../../assets/icons/modal-cctv.png';
import modalCenter from '../../assets/icons/modal-center.png';
import modalLight from '../../assets/icons/modal-light.png';
import warningIcon from '../../assets/icons/warning.png';
import ChatRoom from './ChatRoom/ChatRoom';
import useChatRoom from './ChatRoom/useChatRoom';

export interface RiskScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  dongName: string;
  score: number;
  cctvCount: number;
  lightCount: number;
  policeCount: number;
}

export const RiskScoreModal: React.FC<RiskScoreModalProps> = ({
  isOpen,
  onClose,
  dongName,
  score,
  cctvCount,
  lightCount,
  policeCount,
}) => {
  const {
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
  } = useChatRoom();

  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen) return null;

  const getScoreColor = () => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getDescription = () => {
    if (score >= 80) return '이 동네는 안전 지수가 높아요. 안심하고 이동하세요.';
    if (score >= 60) return '주의 구간이 일부 있습니다. 밝은 길 위주로 이동하세요.';
    return '위험 구간이 많은 편이에요. 가능하면 대로변으로 이동하세요.';
  };

  const displayRatingLabel = feedbacks.length ? averageRating.toFixed(1) : '0.0';
  const displayRating = hoverRating || Math.round(averageRating);

  return (
    <div className="risk-modal-overlay" onClick={onClose}>
      <div className="risk-modal-container" onClick={(event) => event.stopPropagation()}>
        <div className="risk-modal-header">
          <h2 className="risk-modal-title">{dongName}</h2>
          <div className="header-actions">
            <button className="risk-close-btn" onClick={onClose} aria-label="닫기">
              <CloseOutlined />
            </button>
          </div>
        </div>

        {showChat ? (
          <ChatRoom
            feedbacks={feedbacks}
            feedbackRating={feedbackRating}
            feedbackComment={feedbackComment}
            averageRating={averageRating}
            onChangeRating={setFeedbackRating}
            onChangeComment={setFeedbackComment}
            onSubmit={submitFeedback}
            onClose={closeChat}
          />
        ) : (
          <>
            <div className="risk-score-section">
              <div className="risk-score-left">
                <img src={warningIcon} className="warning-icon-img" alt="위험도" />
              </div>

              <div className="risk-score-main">
                <span className="risk-score-number" style={{ color: getScoreColor() }}>
                  {score}
                </span>
                <span className="risk-score-unit">점</span>

                <div className="risk-info-tooltip">
                  <InfoCircleOutlined className="risk-info-icon" />
                  <div className="risk-info-hover">
                    CCTV, 가로등, 치안센터 지표를 가중해 계산한 위험도 점수입니다.
                  </div>
                </div>
              </div>

              <div className="risk-score-labels">
                <div className="risk-score-label">
                  <span className="dot red" /> 위험
                </div>
                <div className="risk-score-label">
                  <span className="dot yellow" /> 주의
                </div>
                <div className="risk-score-label">
                  <span className="dot green" /> 안전
                </div>
              </div>
            </div>

            <p className="risk-description">{getDescription()}</p>

            <div className="risk-rating-section">
              <div className="risk-rating-left">
                <div className="risk-stars">
                  {[1, 2, 3, 4, 5].map((star) =>
                    star <= displayRating ? (
                      <StarFilled
                        key={star}
                        className="risk-star filled"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ) : (
                      <StarOutlined
                        key={star}
                        className="risk-star"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ),
                  )}
                </div>
                <span className="risk-rating-text">{displayRatingLabel} / 5.0</span>
              </div>

              <button className="risk-feedback-btn" onClick={openChat}>
                <img src={commentIcon} className="comment-icon" alt="댓글" />
                소통하기
              </button>
            </div>

            <div className="risk-card-container">
              <div className="risk-card card-red">
                <img src={modalCctv} className="risk-card-icon" alt="CCTV" />
                <div className="risk-card-title">CCTV</div>
                <div className="risk-card-count red">{cctvCount}개</div>
              </div>

              <div className="risk-card card-yellow">
                <img src={modalLight} className="risk-card-icon" alt="가로등" />
                <div className="risk-card-title">가로등</div>
                <div className="risk-card-count yellow">{lightCount}개</div>
              </div>

              <div className="risk-card card-green">
                <img src={modalCenter} className="risk-card-icon" alt="치안센터" />
                <div className="risk-card-title">치안센터</div>
                <div className="risk-card-count green">{policeCount}개</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RiskScoreModal;
