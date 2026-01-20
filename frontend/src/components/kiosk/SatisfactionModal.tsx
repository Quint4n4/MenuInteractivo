import React, { useState } from 'react';
import { colors } from '../../styles/colors';

interface SatisfactionModalProps {
  show: boolean;
  orderId: number;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
}

export const SatisfactionModal: React.FC<SatisfactionModalProps> = ({
  show,
  orderId,
  onClose,
  onSubmit,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showCommentStep, setShowCommentStep] = useState(false);
  const [comment, setComment] = useState('');

  if (!show) return null;

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    setShowCommentStep(true);
  };

  const handleSubmitWithoutComment = () => {
    if (selectedRating !== null) {
      onSubmit(selectedRating);
      handleClose();
    }
  };

  const handleSubmitWithComment = () => {
    if (selectedRating !== null) {
      onSubmit(selectedRating, comment);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedRating(null);
    setShowCommentStep(false);
    setComment('');
    onClose();
  };

  const ratings = [
    { value: 1, emoji: '😞', label: 'Muy\ninsatisfecho', color: '#f44336' },
    { value: 2, emoji: '😕', label: 'Insatisfecho', color: '#ff9800' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#ffc107' },
    { value: 4, emoji: '🙂', label: 'Satisfecho', color: '#4caf50' },
    { value: 5, emoji: '😄', label: 'Muy\nsatisfecho', color: '#2e7d32' },
  ];

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>¡Pedido entregado!</h2>
        <p style={styles.subtitle}>Su pedido n° {orderId} ha sido entregado</p>

        {!showCommentStep ? (
          <>
            <p style={styles.question}>¿Qué tan satisfecho está usted con su pedido?</p>
            <div style={styles.ratingsContainer}>
              {ratings.map((rating) => (
                <button
                  key={rating.value}
                  style={{
                    ...styles.ratingButton,
                    backgroundColor: rating.color,
                  }}
                  onClick={() => handleRatingSelect(rating.value)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadowGold}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={styles.emoji}>{rating.emoji}</div>
                  <div style={styles.ratingLabel}>{rating.label}</div>
                </button>
              ))}
            </div>
            <button 
              style={styles.skipButton} 
              onClick={handleClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
                e.currentTarget.style.color = colors.primary;
              }}
            >
              Saltar
            </button>
          </>
        ) : (
          <>
            <p style={styles.commentLabel}>Comentarios adicionales (opcionales)</p>
            <textarea
              style={styles.textarea}
              placeholder="Cuéntanos más sobre tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              autoFocus
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.primaryMuted;
              }}
            />
            <div style={styles.commentButtons}>
              <button
                style={styles.submitWithoutCommentButton}
                onClick={handleSubmitWithoutComment}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                  e.currentTarget.style.color = colors.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.white;
                  e.currentTarget.style.color = colors.primary;
                }}
              >
                Enviar sin comentario
              </button>
              <button
                style={styles.submitWithCommentButton}
                onClick={handleSubmitWithComment}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryDark;
                  e.currentTarget.style.borderColor = colors.primaryDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
              >
                Enviar con comentario
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    boxShadow: `0 8px 32px ${colors.shadowGold}`,
    border: `1px solid ${colors.primaryMuted}`,
  },
  title: {
    fontSize: '32px',
    color: colors.primary,
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: '18px',
    color: colors.textSecondary,
    marginBottom: '30px',
  },
  question: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: '30px',
  },
  ratingsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '30px',
  },
  ratingButton: {
    flex: 1,
    padding: '20px 10px',
    border: 'none',
    borderRadius: '12px',
    color: colors.white,
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emoji: {
    fontSize: '32px',
    marginBottom: '4px',
  },
  ratingLabel: {
    fontSize: '13px',
    lineHeight: '1.3',
    whiteSpace: 'pre-line',
  },
  skipButton: {
    padding: '12px 30px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  commentLabel: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: '15px',
  },
  textarea: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    border: `2px solid ${colors.primaryMuted}`,
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: '20px',
    color: colors.textPrimary,
    transition: 'border-color 0.2s ease',
  },
  commentButtons: {
    display: 'flex',
    gap: '15px',
  },
  submitWithoutCommentButton: {
    flex: 1,
    padding: '15px 20px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitWithCommentButton: {
    flex: 1,
    padding: '15px 20px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
