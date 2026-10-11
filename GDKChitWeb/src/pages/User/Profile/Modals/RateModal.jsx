import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';
import { makeRequest } from '../../../../api/apiClient.js';

const RateModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await makeRequest('/user/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      // Local fallback save
      localStorage.setItem('user_app_rating', JSON.stringify({ rating, feedback, date: Date.now() }));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
          }}
        >
          <X size={20} />
        </button>

        {success ? (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 22, color: 'var(--text)' }}>Thank You! 🎉</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              Your rating has been saved successfully. We appreciate your valuable feedback!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Star size={30} fill="#f59e0b" />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: 22, color: 'var(--text)', fontWeight: 800 }}>
              Rate GDK Chit Fund
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14 }}>
              How is your experience with our chit savings & auction platform?
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    transition: 'transform 0.15s ease',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <Star
                    size={32}
                    color="#f59e0b"
                    fill={(hoverRating || rating) >= star ? '#f59e0b' : 'transparent'}
                  />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Tell us what you love or how we can improve (optional)..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius)',
                border: '1.5px solid var(--border)',
                background: 'var(--surface2)',
                fontSize: 14,
                color: 'var(--text)',
                resize: 'none',
                marginBottom: 20,
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: 13,
                background: 'var(--primary)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RateModal;
