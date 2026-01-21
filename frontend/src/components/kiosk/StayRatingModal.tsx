import React, { useState } from 'react';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';

interface StayRatingModalProps {
  onComplete: (rating: number, comment?: string) => void;
}

const StayRatingModal: React.FC<StayRatingModalProps> = ({ onComplete }) => {
  const { isMobile } = useWindowSize();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Por favor califica tu estancia (mínimo 1 estrella)');
      return;
    }
    onComplete(rating, comment || undefined);
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
  }> = ({ value, onChange }) => (
    <div style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          style={{
            ...styles.starButton,
            color: star <= value ? colors.primary : colors.gray,
            fontSize: star <= value ? '48px' : '40px',
          }}
          onClick={() => onChange(star)}
          onMouseEnter={(e) => {
            if (star <= value) {
              e.currentTarget.style.color = colors.primaryDark;
              e.currentTarget.style.fontSize = '48px';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = star <= value ? colors.primary : colors.gray;
            e.currentTarget.style.fontSize = star <= value ? '48px' : '40px';
          }}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, ...(isMobile && responsiveStyles.modal) }}>
        <div style={styles.iconContainer}>🏥</div>
        <h2 style={{ ...styles.title, ...(isMobile && responsiveStyles.title) }}>
          3. Califica tu estancia en el lugar
        </h2>
        <div style={styles.ratingContainer}>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p style={styles.ratingText}>{rating} de 5 estrellas</p>
          )}
        </div>
        <div style={styles.commentSection}>
          <label style={styles.commentLabel}>Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={styles.commentInput}
            placeholder="Comparte tus comentarios..."
            rows={4}
          />
        </div>
        <button
          onClick={handleSubmit}
          style={{
            ...styles.submitButton,
            ...(isMobile && responsiveStyles.submitButton),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          Enviar Encuesta
        </button>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: colors.shadowGold,
    border: `1px solid ${colors.primaryMuted}`,
    textAlign: 'center',
  },
  iconContainer: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '40px',
  },
  ratingContainer: {
    marginBottom: '40px',
  },
  starContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
  },
  ratingText: {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.primaryDark,
    margin: 0,
  },
  commentSection: {
    marginBottom: '30px',
    textAlign: 'left',
  },
  commentLabel: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '10px',
  },
  commentInput: {
    width: '100%',
    padding: '12px',
    border: `1px solid ${colors.primaryMuted}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.2s',
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

const responsiveStyles: { [key: string]: React.CSSProperties } = {
  modal: {
    padding: '30px 20px',
  },
  title: {
    fontSize: '24px',
  },
  submitButton: {
    padding: '14px 24px',
    fontSize: '16px',
  },
};

export default StayRatingModal;
