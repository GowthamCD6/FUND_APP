import React, { useState } from 'react';
import {
  Star,
  X,
  Check,
  Send
} from 'lucide-react';
import './AdminModals.css';

const AdminRateModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Star size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Admin Feedback & Rating</h2>
              <p className="adm-modal-subtitle">Share your platform experience and feature suggestions</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="adm-modal-body">
            {submitted ? (
              <div className="adm-alert adm-alert-success" style={{ justifyContent: 'center' }}>
                <Check size={16} />
                <span>Thank you! Your feedback has been registered.</span>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 8 }}>
                    Rate portal stability and performance
                  </span>
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          color: star <= rating ? '#f59e0b' : '#cbd5e1'
                        }}
                      >
                        <Star size={28} fill={star <= rating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">System Comments or Feature Request</label>
                  <textarea
                    className="adm-form-input"
                    style={{ height: 80, resize: 'vertical' }}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Enter your operational feedback or suggestions..."
                  />
                </div>
              </>
            )}
          </div>

          <div className="adm-modal-footer">
            <button className="adm-btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="adm-btn-primary" type="submit" disabled={submitted}>
              <Send size={15} />
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRateModal;
