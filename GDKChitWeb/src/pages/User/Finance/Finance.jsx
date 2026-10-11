import React, { useState } from 'react';
import Lottie from 'lottie-react';
import financeAnimation from '../../../animation/Finance.json';
import {
  Coins, Briefcase, UserCheck, ShieldCheck, Zap, Headphones,
  CheckCircle2, ChevronDown, ChevronUp, Phone, Mail, Clock,
  ArrowRight, X, Sparkles, FileText, Calculator
} from 'lucide-react';
import './Finance.css';

const Finance = () => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [applyModal, setApplyModal] = useState({ isOpen: false, product: null });
  const [supportModal, setSupportModal] = useState(false);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '50000',
    tenure: '10',
  });
  const [submitted, setSubmitted] = useState(false);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleApply = (product) => {
    setApplyModal({ isOpen: true, product });
    setSubmitted(false);
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setApplyModal({ isOpen: false, product: null });
      setSubmitted(false);
      alert('Application Received! Our loan executive will contact you shortly.');
    }, 1200);
  };

  // Estimated repayment
  const loanAmt = Number(formData.amount) || 50000;
  const tenureNum = Number(formData.tenure) || 10;
  const totalRepay = Math.round(loanAmt * 1.25);
  const installmentEst = Math.round(totalRepay / tenureNum);

  return (
    <div className="fin-container">
      {/* Header */}
      <div className="fin-header">
        <div>
          <h1 className="fin-title">Smart Finance & Micro-Lending</h1>
          <p className="fin-subtitle">
            Sri Periyanayagi Amman Finance • Short-term capital and personal credit facilities
          </p>
        </div>

        <div className="fin-overview-actions">
          <button className="fin-btn-primary" onClick={() => handleApply({ title: 'Personal Loan' })}>
            Apply for Loan
            <ArrowRight size={15} />
          </button>
          <button className="fin-btn-secondary" onClick={() => setSupportModal(true)}>
            <Phone size={15} />
            Financier Support
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="fin-overview-card">
        <div className="fin-overview-text">
          <h2 className="fin-overview-title">Transparent Working Capital & Personal Loans</h2>
          <p className="fin-overview-desc">
            Direct financial support for shopkeepers and enrolled chit members. Fast digital evaluation, clear daily/weekly repayment schedules, and zero foreclosure penalties.
          </p>
        </div>
      </div>

      {/* Collection Schedules */}
      <div className="fin-section">
        <div className="fin-section-head">
          <h2 className="fin-section-title">
            <Clock size={22} color="var(--primary)" />
            Collection Schedules
          </h2>
        </div>

        <div className="fin-schedules-grid">
          <div
            className="fin-sched-card"
            onClick={() =>
              setInfoModal({
                isOpen: true,
                title: 'Shopkeeper Collection Model',
                message:
                  'For shopkeeper accounts, collections are conducted daily over a structured 100-day schedule. This model aligns seamlessly with daily retail cash flows, keeping repayments minimal, predictable, and manageable without impacting running working capital.',
              })
            }
          >
            <div className="fin-sched-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <Briefcase size={26} />
            </div>
            <div className="fin-sched-body">
              <h3 className="fin-sched-title">Shopkeeper Accounts</h3>
              <p className="fin-sched-desc">
                Daily micro-collections tailored for continuous business cash flow over a 100-day tenure.
              </p>
              <span className="fin-sched-tag" style={{ background: '#ecfdf5', color: '#10b981' }}>
                100 Days • Daily Dues
              </span>
            </div>
          </div>

          <div
            className="fin-sched-card"
            onClick={() =>
              setInfoModal({
                isOpen: true,
                title: 'Personal User Collection Model',
                message:
                  'For personal loan members, payments are collected on weekends across a 10-week schedule. This gives salaried individuals and households ample buffer to manage their monthly dues comfortably.',
              })
            }
          >
            <div className="fin-sched-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <UserCheck size={26} />
            </div>
            <div className="fin-sched-body">
              <h3 className="fin-sched-title">Personal Accounts</h3>
              <p className="fin-sched-desc">
                Convenient weekly collections scheduled every weekend across a standard 10-week tenure.
              </p>
              <span className="fin-sched-tag" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                10 Weeks • Weekend Dues
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Why GDK Finance? */}
      <div className="fin-section">
        <div className="fin-section-head">
          <h2 className="fin-section-title">
            <ShieldCheck size={22} color="#10b981" />
            Why Choose GDK Finance?
          </h2>
        </div>

        <div className="fin-benefits-grid">
          <div className="fin-benefit-card">
            <div className="fin-benefit-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <Zap size={24} />
            </div>
            <h4 className="fin-benefit-title">Swift Approvals</h4>
            <p className="fin-benefit-desc">Disbursements processed rapidly within 24-48 business hours.</p>
          </div>

          <div className="fin-benefit-card">
            <div className="fin-benefit-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <ShieldCheck size={24} />
            </div>
            <h4 className="fin-benefit-title">Secure & Reliable</h4>
            <p className="fin-benefit-desc">RBI compliant procedures and audited transparent ledger systems.</p>
          </div>

          <div className="fin-benefit-card">
            <div className="fin-benefit-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
              <FileText size={24} />
            </div>
            <h4 className="fin-benefit-title">Zero Paperwork</h4>
            <p className="fin-benefit-desc">Fully digital KYC verification with Aadhaar & PAN instant link.</p>
          </div>

          <div className="fin-benefit-card">
            <div className="fin-benefit-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
              <Headphones size={24} />
            </div>
            <h4 className="fin-benefit-title">Dedicated Support</h4>
            <p className="fin-benefit-desc">Direct hotline assistance from verified community field agents.</p>
          </div>
        </div>
      </div>

      {/* Loan Products */}
      <div className="fin-section">
        <div className="fin-section-head">
          <h2 className="fin-section-title">
            <Coins size={22} color="var(--primary)" />
            Loan Products
          </h2>
        </div>

        <div className="fin-products-grid">
          <div className="fin-product-card">
            <span className="fin-product-badge">Most Popular</span>
            <div>
              <div className="fin-product-head">
                <div style={{ padding: 10, background: '#eff6ff', color: '#1e40af', borderRadius: 'var(--radius)' }}>
                  <UserCheck size={28} />
                </div>
                <div>
                  <h3 className="fin-product-title">Personal Loan</h3>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>For salaried & household needs</span>
                </div>
              </div>

              <div className="fin-product-rate">
                25% <span>APR Fixed</span>
              </div>

              <ul className="fin-product-features">
                <li><CheckCircle2 size={16} color="#10b981" /> Borrow from ₹10,000 to ₹2,00,000</li>
                <li><CheckCircle2 size={16} color="#10b981" /> 10-Week weekend repayment cycle</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Zero prepayment foreclosure penalties</li>
              </ul>
            </div>

            <button className="fin-btn-apply" onClick={() => handleApply({ title: 'Personal Loan', defaultTenure: '10' })}>
              Apply for Personal Loan
            </button>
          </div>

          <div className="fin-product-card">
            <span className="fin-product-badge" style={{ background: '#dcfce7', color: '#166534' }}>Retailers</span>
            <div>
              <div className="fin-product-head">
                <div style={{ padding: 10, background: '#ecfdf5', color: '#10b981', borderRadius: 'var(--radius)' }}>
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 className="fin-product-title">Shopkeeper Business Loan</h3>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Working capital for shop owners</span>
                </div>
              </div>

              <div className="fin-product-rate">
                25% <span>APR Fixed</span>
              </div>

              <ul className="fin-product-features">
                <li><CheckCircle2 size={16} color="#10b981" /> Borrow from ₹25,000 to ₹5,00,000</li>
                <li><CheckCircle2 size={16} color="#10b981" /> 100-Day daily collection cycle</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Quick top-up loan facility on good score</li>
              </ul>
            </div>

            <button
              className="fin-btn-apply"
              style={{ background: '#10b981' }}
              onClick={() => handleApply({ title: 'Shopkeeper Business Loan', defaultTenure: '100' })}
            >
              Apply for Business Loan
            </button>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="fin-section">
        <div className="fin-section-head">
          <h2 className="fin-section-title">Common Questions</h2>
        </div>

        <div className="fin-faq-list">
          {[
            {
              q: 'How do I contact the financier or collection executive?',
              a: 'You can tap the "Talk to Financier" button above or reach our central office directly via phone at +91 98765 43210 or email at support@gdkfinance.com.',
            },
            {
              q: 'How fast is loan approval and disbursement?',
              a: 'Existing chit fund members in good standing are pre-approved and receive payouts within 24 to 48 hours directly into their linked bank accounts.',
            },
            {
              q: 'Are there any hidden fees or foreclosure penalties?',
              a: 'None! GDK Finance operates with 100% transparency. You may close or prepay your loan ahead of schedule with zero penalties.',
            },
            {
              q: 'Can I participate in chit auctions while having an active loan?',
              a: 'Yes, as long as your monthly chit contribution and loan installments are kept up to date.',
            },
          ].map((item, idx) => (
            <div key={idx} className="fin-faq-item">
              <button className="fin-faq-btn" onClick={() => toggleFAQ(idx)}>
                <span>{item.q}</span>
                {expandedFAQ === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedFAQ === idx && <div className="fin-faq-content">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Application Modal */}
      {applyModal.isOpen && (
        <div className="fin-modal-overlay" onClick={() => setApplyModal({ isOpen: false, product: null })}>
          <div className="fin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                Apply for {applyModal.product?.title || 'Loan'}
              </h3>
              <button
                onClick={() => setApplyModal({ isOpen: false, product: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication}>
              <div className="fin-form-group">
                <label className="fin-form-label">Full Name</label>
                <input
                  type="text"
                  className="fin-form-input"
                  required
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="fin-form-group">
                <label className="fin-form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="fin-form-input"
                  required
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="fin-form-group">
                <label className="fin-form-label">Required Amount (₹)</label>
                <input
                  type="number"
                  className="fin-form-input"
                  required
                  step="5000"
                  min="10000"
                  max="500000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              {/* Instant Calculator Preview */}
              <div
                style={{
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius)',
                  padding: 14,
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>Principal Loan:</span>
                  <span style={{ fontWeight: 700 }}>₹{loanAmt.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>Total Repayment:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{totalRepay.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Estimated Installment:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>₹{installmentEst.toLocaleString('en-IN')} / cycle</span>
                </div>
              </div>

              <button
                type="submit"
                className="fin-btn-apply"
                disabled={submitted}
              >
                {submitted ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {supportModal && (
        <div className="fin-modal-overlay" onClick={() => setSupportModal(false)}>
          <div className="fin-modal-box" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Headphones size={32} />
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Financier Support</h3>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Our dedicated financial advisors are available to guide you through loan applications and payment options.
            </p>

            <div
              style={{
                background: 'var(--surface2)',
                borderRadius: 'var(--radius)',
                padding: 16,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Phone size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Direct Hotline</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>+91 98765 43210</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Email Inquiries</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>support@gdkfinance.com</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Clock size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Working Hours</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Mon - Sat: 9:00 AM - 6:30 PM</div>
                </div>
              </div>
            </div>

            <button
              className="fin-btn-apply"
              onClick={() => setSupportModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModal.isOpen && (
        <div className="fin-modal-overlay" onClick={() => setInfoModal({ isOpen: false, title: '', message: '' })}>
          <div className="fin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>{infoModal.title}</h3>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
              {infoModal.message}
            </p>
            <button className="fin-btn-apply" onClick={() => setInfoModal({ isOpen: false, title: '', message: '' })}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
