import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Search,
  ExternalLink
} from 'lucide-react';
import './ProfileModals.css';

const FAQ_DATA = [
  {
    id: 1,
    question: 'How do I register in the GDK Chit Fund app?',
    questionTamil: 'ஜிடிகே சிட் நிதி பயன்பாட்டில் எவ்வாறு பதிவு செய்வது?',
    answer: 'Enter your verified mobile number, verify OTP, complete your KYC profile with Aadhaar & PAN details, and link your bank account. Once reviewed by our compliance officer, you can participate in chit fund groups.',
    answerTamil: 'உங்கள் கைபேசி எண்ணை உள்ளிடவும், ஓடிபியை சரிபார்க்கவும், ஆதார் மற்றும் பான் விவரங்களுடன் உங்கள் சுயவிவரத்தை முடிக்கவும்.'
  },
  {
    id: 2,
    question: 'How do I join a chit fund group?',
    questionTamil: 'சிட் நிதி குழுவில் எவ்வாறு சேர்வது?',
    answer: 'Browse available chit groups under "Explore Chits", filter by monthly installment and chit value, click "Join Group", and pay the first installment. You will receive an automated Chit Agreement.',
    answerTamil: 'பயன்பாட்டில் கிடைக்கும் சிட் குழுக்களை உலாவுங்கள், தொகை மற்றும் கால அளவின் அடிப்படையில் தேர்ந்தெடுக்கவும், தவணை செலுத்துங்கள்.'
  },
  {
    id: 3,
    question: 'How can I make monthly payments through the portal?',
    questionTamil: 'பயன்பாட்டின் மூலம் எவ்வாறு பணம் செலுத்த முடியும்?',
    answer: 'Navigate to "Chits" -> "Pay Installment". We accept UPI (GPay, PhonePe, Paytm), Net Banking, NEFT/RTGS, and direct debit transfers with instant digital receipts.',
    answerTamil: 'யூபிஐ, நெட் பேங்கிங், டெபிட் அல்லது வங்கி பரிமாற்றம் மூலம் உடனடியாக பணம் செலுத்தலாம்.'
  },
  {
    id: 4,
    question: 'How does the online bidding process work?',
    questionTamil: 'ஏல செயல்முறை எவ்வாறு செயல்படுகிறது?',
    answer: 'Monthly auctions are hosted in the Auction Portal on designated dates. Subscribers submit their bid discount percentage. The subscriber with the lowest eligible discount wins the prize pool for that month.',
    answerTamil: 'மாதாந்திர ஏலங்கள் பயன்பாட்டின் மூலம் ஆன்லைனில் நடத்தப்படுகின்றன. குறைந்த ஏலதாரர் சிட் தொகையை வெல்வார்.'
  },
  {
    id: 5,
    question: 'How do I track my dividends and ledger payments?',
    questionTamil: 'எனது லாபப் பங்கு மற்றும் கணக்கை எவ்வாறு கண்காணிப்பது?',
    answer: 'Go to your Chit Details page. You will see an itemized breakdown of monthly installments paid, auction discounts earned as dividends, next due dates, and remaining balance.',
    answerTamil: 'சிட் விவரங்கள் பக்கத்தில் மாதாந்திர லாபப் பங்கு, செலுத்திய தொகை மற்றும் அடுத்த நிலுவைத் தேதியை பார்க்கலாம்.'
  },
  {
    id: 6,
    question: 'What if I miss a monthly installment payment?',
    questionTamil: 'மாதாந்திர பணம் செலுத்த தவறினால் என்ன நடக்கும்?',
    answer: 'Gentle SMS and email alerts are sent 3 days before the due date. Grace periods apply. For prolonged delays, nominal statutory late fees are assessed. Contact support if you need structured assistance.',
    answerTamil: 'காலாவதிக்கு முன் நினைவூட்டல் அறிவிப்புகள் வரும். தாமதமான பணம் செலுத்துதல் அபராத கட்டணங்களை ஏற்படுத்தலாம்.'
  },
  {
    id: 7,
    question: 'When will prize money be credited to my bank account?',
    questionTamil: 'வெற்றித் தொகை எப்போது வங்கி கணக்கில் வரவு வைக்கப்படும்?',
    answer: 'After auction completion and guarantor verification, prize disbursement is processed via direct RTGS/NEFT to your linked bank account within 3 to 5 business days.',
    answerTamil: 'ஏலம் மற்றும் உத்தரவாதம் சரிபார்க்கப்பட்ட பிறகு, 3 முதல் 5 வேலை நாட்களில் உங்கள் வங்கி கணக்கில் வரவு வைக்கப்படும்.'
  },
  {
    id: 8,
    question: 'Is my money and personal data safe with GDK?',
    questionTamil: 'இந்த பயன்பாட்டில் எனது பணம் மற்றும் தரவு பாதுகாப்பானதா?',
    answer: 'Yes! GDK Chit Funds is fully incorporated and regulated under the Central Chit Funds Act 1982. All web sessions utilize 256-bit TLS encryption with complete audit logging.',
    answerTamil: 'ஆம், நாங்கள் 256-பிட் எஸ்எஸ்எல் குறியாக்கத்துடன் முழுமையான சட்ட பாதுகாப்பை வழங்குகிறோம்.'
  }
];

const HelpSupportModal = ({ isOpen, onClose }) => {
  const [expandedId, setExpandedId] = useState(1);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredFaqs = FAQ_DATA.filter(f => {
    const q = search.toLowerCase();
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.questionTamil.includes(search) ||
      f.answerTamil.includes(search)
    );
  });

  return (
    <div className="prof-modal-backdrop" onClick={onClose}>
      <div className="prof-modal-card" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="prof-modal-header">
          <div className="prof-modal-title-group">
            <div className="prof-modal-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="prof-modal-title">Help & Customer Support</h2>
              <p className="prof-modal-subtitle">Frequently Asked Questions and dedicated subscriber helpline</p>
            </div>
          </div>
          <button className="prof-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="prof-modal-body">
          {/* Quick Contact Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
            <a
              href="tel:+914433445566"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Direct Helpline</span>
                <strong style={{ fontSize: 13, color: '#1e293b' }}>+91 44 3344 5566</strong>
              </div>
            </a>

            <a
              href="https://wa.me/919876543210?text=Hello%2C%20I%20need%20help%20with%20GDK%20Chit%20Fund"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#15803d', display: 'block' }}>WhatsApp Support</span>
                <strong style={{ fontSize: 13, color: '#166534' }}>+91 98765 43210</strong>
              </div>
            </a>

            <a
              href="mailto:support@gdkchitfunds.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Email Desk</span>
                <strong style={{ fontSize: 13, color: '#1e293b' }}>support@gdkchitfunds.com</strong>
              </div>
            </a>
          </div>

          {/* Operating hours note */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: 12,
            color: '#64748b',
            marginBottom: 16
          }}>
            <Clock size={14} color="#2563eb" />
            <span><strong>Operating Hours:</strong> Monday – Friday: 9:00 AM – 6:00 PM | Saturday: 9:00 AM – 1:00 PM</span>
          </div>

          {/* FAQ Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search frequently asked questions..."
              className="prof-form-input"
              style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
            />
          </div>

          {/* FAQ Accordions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    border: isOpen ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                    background: isOpen ? '#f8faff' : '#ffffff',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', display: 'block' }}>
                        {faq.question}
                      </span>
                      <span style={{ fontSize: 12, color: '#2563eb', marginTop: 2, display: 'block' }}>
                        {faq.questionTamil}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={18} color="#2563eb" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                        {faq.answer}
                      </p>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {faq.answerTamil}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="prof-modal-footer">
          <button className="prof-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Close Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportModal;
