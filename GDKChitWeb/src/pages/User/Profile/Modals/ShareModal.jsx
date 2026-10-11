import React, { useState } from 'react';
import { Share2, X, Copy, Check, MessageCircle, Send, Globe } from 'lucide-react';

const ShareModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const shareUrl = window.location.origin;
  const shareText = `🌟 Start saving with Sri Periyanayagi Amman Chit Fund! Join verified chit groups and grow your investments safely. Check out: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
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

        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Share2 size={28} />
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 22, color: 'var(--text)', fontWeight: 800 }}>
          Share GDK Chit Fund
        </h3>
        <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14 }}>
          Invite family and colleagues to join your chit group and invest together!
        </p>

        {/* Copy Link Field */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: 'var(--surface2)',
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            border: '1.5px solid var(--border)',
            marginBottom: 20,
          }}
        >
          <input
            type="text"
            readOnly
            value={shareUrl}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 13.5,
              fontWeight: 600,
              color: 'var(--text)',
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: '6px 14px',
              background: copied ? '#10b981' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Quick Social Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <button
            onClick={handleWhatsApp}
            style={{
              padding: '12px',
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>

          <button
            onClick={handleTelegram}
            style={{
              padding: '12px',
              background: '#0088cc',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Send size={18} />
            Telegram
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
