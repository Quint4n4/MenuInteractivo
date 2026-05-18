import React, { useState } from 'react';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';
import { Building2 } from 'lucide-react';

interface StayRatingModalProps {
  onComplete: (rating: number, comment?: string) => void | Promise<void>;
}

const StayRatingModal: React.FC<StayRatingModalProps> = ({ onComplete }) => {
  const { isMobile } = useWindowSize();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Guarda contra doble-envio: en pantalla tactil (kiosko LG) el paciente
    // puede tocar varias veces; cada toque generaba otro POST a /feedbacks/
    // (el 1ro guardaba, los demas daban 400 y un error falso).
    if (submitting) return;
    if (rating === 0) {
      alert('Por favor califica tu estancia (mínimo 1 estrella)');
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(rating, comment || undefined);
      // Exito: la encuesta se cierra desde SurveyContext (este modal se desmonta).
    } catch (e) {
      // Falla real: reactivar el boton para permitir un reintento legitimo.
      setSubmitting(false);
    }
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
  }> = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = useState<number>(0);
    const displayValue = hoverValue || value;

    return (
      <div style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            style={{
              ...styles.starButton,
              color: star <= displayValue ? colors.latte : colors.grayLight,
              transform: star <= displayValue ? 'scale(1.08)' : 'scale(1)',
            }}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            aria-label={`Calificar con ${star} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, ...(isMobile && responsiveStyles.modal) }}>
        <div style={styles.iconContainer}>
          <Building2 size={66} color={colors.primaryDark} />
        </div>
        <h2 style={{ ...styles.title, ...(isMobile && responsiveStyles.title) }}>
          3. Califica tu estancia en Clínica CAMSA
        </h2>
        <p style={styles.legendText}>
          Queremos conocer tu experiencia en la clínica. Califícanos con estrellas.
        </p>
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
          disabled={submitting}
          style={{
            ...styles.submitButton,
            ...(isMobile && responsiveStyles.submitButton),
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!submitting) e.currentTarget.style.backgroundColor = colors.mocha;
          }}
          onMouseLeave={(e) => {
            if (!submitting) e.currentTarget.style.backgroundColor = colors.espresso;
          }}
        >
          {submitting ? 'Enviando...' : 'Enviar Encuesta'}
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
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '40px',
  },
  legendText: {
    margin: '-12px 0 26px 0',
    fontSize: '17px',
    color: colors.textSecondary,
    fontWeight: 500,
  },
  ratingContainer: {
    marginBottom: '40px',
  },
  starContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
    fontSize: '56px',
    lineHeight: 1,
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
    backgroundColor: colors.espresso,
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
