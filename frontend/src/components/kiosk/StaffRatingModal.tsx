import React, { useState } from 'react';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';

interface StaffRatingModalProps {
  staffName: string;
  onNext: (rating: number) => void;
}

const StaffRatingModal: React.FC<StaffRatingModalProps> = ({ staffName, onNext }) => {
  const { isMobile } = useWindowSize();
  const [rating, setRating] = useState<number>(0);

  const handleNext = () => {
    if (rating === 0) {
      alert('Por favor califica la interacción con el personal (mínimo 1 estrella)');
      return;
    }
    onNext(rating);
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
        <div style={styles.iconContainer}>👩‍⚕️</div>
        <h2 style={{ ...styles.title, ...(isMobile && responsiveStyles.title) }}>
          2. Califica la interacción con el personal
        </h2>
        <div style={styles.staffInfo}>
          <p style={styles.staffLabel}>Enfermera asignada:</p>
          <p style={styles.staffName}>{staffName}</p>
        </div>
        <div style={styles.ratingContainer}>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p style={styles.ratingText}>{rating} de 5 estrellas</p>
          )}
        </div>
        <button
          onClick={handleNext}
          style={{
            ...styles.nextButton,
            ...(isMobile && responsiveStyles.nextButton),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          Continuar
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
    marginBottom: '30px',
  },
  staffInfo: {
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: colors.cream,
    borderRadius: '12px',
  },
  staffLabel: {
    fontSize: '16px',
    color: colors.textSecondary,
    marginBottom: '10px',
  },
  staffName: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.primaryDark,
    margin: 0,
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
  nextButton: {
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
  nextButton: {
    padding: '14px 24px',
    fontSize: '16px',
  },
};

export default StaffRatingModal;
