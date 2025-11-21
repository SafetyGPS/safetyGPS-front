import React, { useState } from 'react';
import { InfoCircleOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import './RiskScoreModal.css';

import modalCctv from '../../assets/icons/modal-cctv.png';
import modalLight from '../../assets/icons/modal-light.png';
import modalCenter from '../../assets/icons/modal-center.png';

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
    const [hoverRating, setHoverRating] = useState(0);
    const [rating, setRating] = useState(0);

    if (!isOpen) return null;

    const getScoreColor = () => {
        if (score >= 80) return '#52c41a';    // 초록
        if (score >= 60) return '#faad14';    // 노랑
        return '#ff4d4f';                     // 빨강
    };

    const getDescription = () => {
        if (score >= 80) {
            return '귀하의 동네는 안전 수치를 기록하고 있습니다. 안전한 하루 보내세요!';
        }
        if (score >= 60) {
            return '귀하의 동네는 주의 수치를 기록하고 있습니다. 안전한 길로 우회하세요.';
        }
        return '귀하의 동네는 위험 수치를 기록하고 있습니다. 밝은 곳으로 이동하세요.';
    };

    const scoreColor = getScoreColor();

    return (
        <div className="risk-modal-overlay" onClick={onClose}>
            <div className="risk-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* HEADER */}
                <div className="risk-modal-header">
                    <h2 className="risk-modal-title">{dongName}</h2>

                    <button className="risk-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* SCORE SECTION */}
                <div className="risk-score-section">
                    <div className="risk-score-left">
                        <div className="risk-warning-icon">⚠️</div>
                    </div>

                    <div className="risk-score-main">
                        <span className="risk-score-number" style={{ color: scoreColor }}>
                            {score}
                        </span>
                        <span className="risk-score-unit">점</span>

                        {/* info 아이콘 + 툴팁 */}
                        <div className="risk-info-tooltip">
                            <InfoCircleOutlined className="risk-info-icon" />
                            <div className="risk-info-hover">
                                CCTV, 가로등, 치안센터의 개수와 가중치를 각각 곱해,<br />
                                사용자 평가를 더한 점수입니다.
                            </div>
                        </div>
                    </div>

                    {/* 우측 위험·주의·안전 레전드 */}
                    <div className="risk-score-labels">
                        <div className="risk-score-label">
                            <span className="dot red" />
                            <span>위험</span>
                        </div>
                        <div className="risk-score-label">
                            <span className="dot yellow" />
                            <span>주의</span>
                        </div>
                        <div className="risk-score-label">
                            <span className="dot green" />
                            <span>안전</span>
                        </div>
                    </div>
                </div>

                {/* DESCRIPTION */}
                <p className="risk-description">{getDescription()}</p>

                {/* RATING + 소통하기 버튼 */}
                <div className="risk-rating-section">
                    <div className="risk-rating-left">
                        <div className="risk-stars">
                            {[1, 2, 3, 4, 5].map((star) =>
                                star <= (hoverRating || rating) ? (
                                    <StarFilled
                                        key={star}
                                        className="risk-star filled"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    />
                                ) : (
                                    <StarOutlined
                                        key={star}
                                        className="risk-star"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    />
                                ),
                            )}
                        </div>
                        <span className="risk-rating-text">4.2 / 5.0</span>
                    </div>

                    <button
                        type="button"
                        className="risk-feedback-btn"
                        // TODO: 나중에 댓글 모달 열기 로직 연결
                    >
                        소통하기
                    </button>
                </div>

                {/* BOTTOM CARDS */}
                <div className="risk-card-container">
                    {/* CCTV */}
                    <div className="risk-card card-red">
                        <img src={modalCctv} className="risk-card-icon" alt="CCTV" />
                        <div className="risk-card-title">CCTV</div>
                        <div className="risk-card-count red">{cctvCount}개</div>
                    </div>

                    {/* LIGHT */}
                    <div className="risk-card card-yellow">
                        <img src={modalLight} className="risk-card-icon" alt="가로등" />
                        <div className="risk-card-title">가로등</div>
                        <div className="risk-card-count yellow">{lightCount}개</div>
                    </div>

                    {/* CENTER */}
                    <div className="risk-card card-green">
                        <img src={modalCenter} className="risk-card-icon" alt="치안센터" />
                        <div className="risk-card-title">치안센터</div>
                        <div className="risk-card-count green">{policeCount}개</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskScoreModal;
