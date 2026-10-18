import React, { useState } from 'react';
import Lottie from 'lottie-react';
import financeAnimation from '../../../animation/Finance.json';
import {
  Coins, Briefcase, UserCheck, ShieldCheck, Zap, Headphones,
  CheckCircle2, ChevronDown, ChevronUp, Phone, Mail, Clock,
  ArrowRight, X, Sparkles, FileText, Calculator, Landmark,
  HelpCircle, Check
} from 'lucide-react';
import './Finance.css';

const formatINR = (amt) => {
  if (amt == null || amt === '' || isNaN(Number(amt))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amt));
};

const Finance = () => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [applyModal, setApplyModal] = useState({ isOpen: false, product: null });
  const [supportModal, setSupportModal] = useState(false);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });

  // Interactive Live Calculator on page
  const [calcAmount, setCalcAmount] = useState(50000);
  const [calcType, setCalcType] = useState('personal'); // 'personal' (10 weeks) | 'shopkeeper' (100 days)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '50000',
    tenureType: 'personal',
  });
  const [submitted, setSubmitted] = useState(false);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleApply = (product) => {
    const tenure = product?.defaultTenure === '100' ? 'shopkeeper' : 'personal';
    setFormData(prev => ({
      ...prev,
      amount: String(calcAmount || 50000),
      tenureType: tenure
    }));
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

  // Calculator Estimates
  const calcTenureCount = calcType === 'shopkeeper' ? 100 : 10;
  const calcTotalRepay = Math.round(calcAmount * 1.25);
  const calcInstallment = Math.round(calcTotalRepay / calcTenureCount);
  const calcUnitLabel = calcType === 'shopkeeper' ? 'day' : 'week';

  return (
    <div className="fin-container">
      {/* ── 1. Hero Overview Banner with Animation ── */}
      <div className="fin-hero-banner">
        <div className="fin-hero-content">
          <div className="fin-hero-tag">
            <Sparkles size={13} color="#4ADE80" />
            <span>Sri Periyanayagi Amman Micro-Credit</span>
          </div>
          <h1 className="fin-hero-title">
            Working Capital & Flexible Personal Finance
          </h1>
          <p className="fin-hero-desc">
            Direct institutional micro-finance designed for shopkeepers and enrolled chit members.
            Instant digital evaluation, transparent daily or weekly collections, and zero pre-closure charges.
          </p>

          <div className="fin-hero-actions">
            <button
              type="button"
              className="fin-btn-primary"
              onClick={() => handleApply({ title: 'Personal Loan', defaultTenure: '10' })}
            >
              Apply for Loan
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="fin-btn-secondary"
              onClick={() => setSupportModal(true)}
            >
              <Phone size={14} />
              Financier Hotline
            </button>
          </div>
        </div>

        <div className="fin-hero-animation-wrap">
          <Lottie
            animationData={financeAnimation}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%', maxHeight: 220 }}
          />
        </div>
      </div>

      {/* ── 2. Interactive Live EMI Calculator ── */}
      <div className="fin-section-card">
        <div className="fin-card-header">
          <div className="fin-card-icon-wrap emerald">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="fin-card-title">Instant Repayment Estimator</h2>
            <p className="fin-card-sub">
              Slide to adjust your desired loan amount and toggle tenure between Personal (Weekly) and Business (Daily)
            </p>
          </div>
        </div>

        <div className="fin-calc-grid">
          {/* Controls Side */}
          <div className="fin-calc-controls">
            <div className="fin-calc-group">
              <div className="fin-calc-label-row">
                <span className="fin-calc-label">Borrow Amount</span>
                <span className="fin-calc-val-pill">{formatINR(calcAmount)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="fin-range-slider"
              />
              <div className="fin-slider-markers">
                <span>₹10,000</span>
                <span>₹2,50,000</span>
                <span>₹5,00,000</span>
              </div>
            </div>

            <div className="fin-calc-group">
              <span className="fin-calc-label">Repayment Schedule Model</span>
              <div className="fin-type-toggles">
                <button
                  type="button"
                  className={`fin-type-btn ${calcType === 'personal' ? 'active' : ''}`}
                  onClick={() => setCalcType('personal')}
                >
                  <UserCheck size={16} />
                  <span>Personal (10 Weeks)</span>
                </button>
                <button
                  type="button"
                  className={`fin-type-btn ${calcType === 'shopkeeper' ? 'active' : ''}`}
                  onClick={() => setCalcType('shopkeeper')}
                >
                  <Briefcase size={16} />
                  <span>Shopkeeper (100 Days)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Result Card Side */}
          <div className="fin-calc-summary">
            <div className="fin-summary-header">
              <span className="fin-summary-kicker">ESTIMATED INSTALLMENT</span>
              <div className="fin-summary-large-val">
                {formatINR(calcInstallment)} <small>/{calcUnitLabel}</small>
              </div>
              <span className="fin-summary-tenure">
                Over {calcTenureCount} {calcType === 'shopkeeper' ? 'Daily Cycles' : 'Weekend Cycles'}
              </span>
            </div>

            <div className="fin-summary-breakdown">
              <div className="fin-breakdown-row">
                <span>Principal Disbursal:</span>
                <strong>{formatINR(calcAmount)}</strong>
              </div>
              <div className="fin-breakdown-row">
                <span>Flat Rate (Fixed APR):</span>
                <strong className="text-emerald">25% Total</strong>
              </div>
              <div className="fin-breakdown-row">
                <span>Total Repayment Amount:</span>
                <strong>{formatINR(calcTotalRepay)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="fin-btn-calc-apply"
              onClick={() => handleApply({
                title: calcType === 'shopkeeper' ? 'Shopkeeper Business Loan' : 'Personal Loan',
                defaultTenure: calcType === 'shopkeeper' ? '100' : '10'
              })}
            >
              Apply with This Calculation <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Loan Products (2 Side-by-Side Cards) ── */}
      <div className="fin-section-wrap">
        <h2 className="fin-section-title">
          <Coins size={18} color="#2E7D32" />
          <span>Tailored Credit Facilities</span>
        </h2>

        <div className="fin-products-grid">
          {/* Product 1: Personal Loan */}
          <div className="fin-product-card">
            <div className="fin-prod-top">
              <div className="fin-prod-icon-box blue">
                <UserCheck size={22} />
              </div>
              <div>
                <span className="fin-prod-badge blue">Salaried & Households</span>
                <h3 className="fin-prod-title">Personal Credit Loan</h3>
              </div>
            </div>

            <p className="fin-prod-desc">
              Short-term liquidity for medical, festive, family, and home needs with convenient weekend installments.
            </p>

            <div className="fin-prod-specs">
              <div className="fin-spec-col">
                <span className="fin-spec-label">Loan Limit</span>
                <strong className="fin-spec-val">₹10K - ₹2,00,000</strong>
              </div>
              <div className="fin-spec-col end">
                <span className="fin-spec-label">Tenure</span>
                <strong className="fin-spec-val">10 Weeks</strong>
              </div>
            </div>

            <ul className="fin-prod-checklist">
              <li><Check size={14} color="#2E7D32" /> Weekly weekend collection cycles</li>
              <li><Check size={14} color="#2E7D32" /> Instant disbursement within 24 hours</li>
              <li><Check size={14} color="#2E7D32" /> Zero penalty on early foreclosure</li>
            </ul>

            <button
              type="button"
              className="fin-btn-prod-apply"
              onClick={() => handleApply({ title: 'Personal Credit Loan', defaultTenure: '10' })}
            >
              Apply for Personal Credit
            </button>
          </div>

          {/* Product 2: Shopkeeper Business Loan */}
          <div className="fin-product-card highlight">
            <div className="fin-prod-top">
              <div className="fin-prod-icon-box green">
                <Briefcase size={22} />
              </div>
              <div>
                <span className="fin-prod-badge green">Retailers & Shops</span>
                <h3 className="fin-prod-title">Shopkeeper Working Capital</h3>
              </div>
            </div>

            <p className="fin-prod-desc">
              Daily micro-installment finance structured specifically around daily store sales cash flows.
            </p>

            <div className="fin-prod-specs">
              <div className="fin-spec-col">
                <span className="fin-spec-label">Loan Limit</span>
                <strong className="fin-spec-val">₹25K - ₹5,00,000</strong>
              </div>
              <div className="fin-spec-col end">
                <span className="fin-spec-label">Tenure</span>
                <strong className="fin-spec-val">100 Days</strong>
              </div>
            </div>

            <ul className="fin-prod-checklist">
              <li><Check size={14} color="#2E7D32" /> Daily doorstep / UPI micro-dues</li>
              <li><Check size={14} color="#2E7D32" /> Immediate top-up on regular repayment</li>
              <li><Check size={14} color="#2E7D32" /> No stock or asset hypothecation</li>
            </ul>

            <button
              type="button"
              className="fin-btn-prod-apply green"
              onClick={() => handleApply({ title: 'Shopkeeper Working Capital', defaultTenure: '100' })}
            >
              Apply for Working Capital
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Structured Collection Schedules ── */}
      <div className="fin-section-wrap">
        <h2 className="fin-section-title">
          <Clock size={18} color="#2E7D32" />
          <span>Transparent Collection Schedules</span>
        </h2>

        <div className="fin-schedules-grid">
          <div
            className="fin-sched-card"
            onClick={() =>
              setInfoModal({
                isOpen: true,
                title: 'Shopkeeper Daily Collection Model',
                message:
                  'For shopkeeper accounts, collections are conducted daily over a structured 100-day schedule. This model aligns seamlessly with daily retail cash flows, keeping repayments minimal, predictable, and manageable without impacting running inventory funds.',
              })
            }
          >
            <div className="fin-sched-icon green">
              <Briefcase size={22} />
            </div>
            <div className="fin-sched-info">
              <h3 className="fin-sched-title">Shopkeeper Daily Account</h3>
              <p className="fin-sched-desc">
                Daily micro-collections tailored for continuous retail business cash flows across a 100-day tenure.
              </p>
              <span className="fin-sched-pill green">100 Days • Daily Dues (Tap to learn more)</span>
            </div>
          </div>

          <div
            className="fin-sched-card"
            onClick={() =>
              setInfoModal({
                isOpen: true,
                title: 'Personal Weekend Collection Model',
                message:
                  'For personal loan members, payments are collected on weekends across a 10-week schedule. This gives salaried individuals and households ample buffer to manage their monthly dues comfortably.',
              })
            }
          >
            <div className="fin-sched-icon blue">
              <UserCheck size={22} />
            </div>
            <div className="fin-sched-info">
              <h3 className="fin-sched-title">Personal Weekend Account</h3>
              <p className="fin-sched-desc">
                Convenient weekly collections scheduled on weekends across a structured 10-week tenure.
              </p>
              <span className="fin-sched-pill blue">10 Weeks • Weekend Dues (Tap to learn more)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Trust & Benefits Grid ── */}
      <div className="fin-section-wrap">
        <h2 className="fin-section-title">
          <ShieldCheck size={18} color="#2E7D32" />
          <span>Why Choose GDK Finance?</span>
        </h2>

        <div className="fin-benefits-grid">
          <div className="fin-benefit-card">
            <div className="fin-benefit-icon amber">
              <Zap size={20} />
            </div>
            <h4 className="fin-benefit-title">Swift Approvals</h4>
            <p className="fin-benefit-desc">Disbursements processed within 24 to 48 business hours.</p>
          </div>

          <div className="fin-benefit-card">
            <div className="fin-benefit-icon green">
              <ShieldCheck size={20} />
            </div>
            <h4 className="fin-benefit-title">Transparent Ledger</h4>
            <p className="fin-benefit-desc">Audited accounting with automated SMS and app receipts.</p>
          </div>

          <div className="fin-benefit-card">
            <div className="fin-benefit-icon purple">
              <FileText size={20} />
            </div>
            <h4 className="fin-benefit-title">Zero Paperwork</h4>
            <p className="fin-benefit-desc">100% digital KYC verification linking Aadhaar and PAN.</p>
          </div>

          <div className="fin-benefit-card">
            <div className="fin-benefit-icon pink">
              <Headphones size={20} />
            </div>
            <h4 className="fin-benefit-title">Dedicated Support</h4>
            <p className="fin-benefit-desc">Direct hotline assistance from verified community field agents.</p>
          </div>
        </div>
      </div>

      {/* ── 6. FAQ Accordion ── */}
      <div className="fin-section-wrap">
        <h2 className="fin-section-title">
          <HelpCircle size={18} color="#2E7D32" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="fin-faq-list">
          {[
            {
              q: 'How do I contact the financier or collection executive?',
              a: 'You can tap the "Financier Hotline" button above or reach our central office directly via phone at +91 98765 43210 or email at support@gdkfinance.com.',
            },
            {
              q: 'How fast is loan approval and disbursement?',
              a: 'Existing chit fund members in good standing are pre-approved and receive payouts within 24 to 48 hours directly into their linked bank accounts.',
            },
            {
              q: 'Are there any hidden fees or foreclosure penalties?',
              a: 'None! Sri Periyanayagi Amman Finance operates with 100% transparency. You may close or prepay your loan ahead of schedule with zero penalties.',
            },
            {
              q: 'Can I participate in chit auctions while having an active loan?',
              a: 'Yes, as long as your monthly chit contribution and loan installments are kept up to date.',
            },
          ].map((item, idx) => (
            <div key={idx} className="fin-faq-item">
              <button
                type="button"
                className="fin-faq-btn"
                onClick={() => toggleFAQ(idx)}
              >
                <span>{item.q}</span>
                {expandedFAQ === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedFAQ === idx && (
                <div className="fin-faq-content">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal 1: Loan Application ── */}
      {applyModal.isOpen && (
        <div className="fin-modal-overlay" onClick={() => setApplyModal({ isOpen: false, product: null })}>
          <div className="fin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="fin-modal-head">
              <h3 className="fin-modal-title">
                Apply for {applyModal.product?.title || 'Loan'}
              </h3>
              <button
                type="button"
                className="fin-modal-close"
                onClick={() => setApplyModal({ isOpen: false, product: null })}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="fin-form">
              <div className="fin-form-group">
                <label className="fin-form-label">Full Name</label>
                <input
                  type="text"
                  className="fin-form-input"
                  required
                  placeholder="Enter your legal full name"
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
                <label className="fin-form-label">Requested Amount (₹)</label>
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

              {/* Instant Calculation Preview */}
              <div className="fin-modal-calc-box">
                <div className="fin-modal-calc-row">
                  <span>Principal:</span>
                  <strong>{formatINR(formData.amount)}</strong>
                </div>
                <div className="fin-modal-calc-row">
                  <span>Repayment Total:</span>
                  <strong className="text-emerald">{formatINR(Number(formData.amount) * 1.25)}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="fin-btn-submit"
                disabled={submitted}
              >
                {submitted ? 'Submitting Application...' : 'Confirm & Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Financier Support ── */}
      {supportModal && (
        <div className="fin-modal-overlay" onClick={() => setSupportModal(false)}>
          <div className="fin-modal-box center" onClick={(e) => e.stopPropagation()}>
            <div className="fin-support-icon">
              <Headphones size={28} />
            </div>

            <h3 className="fin-modal-title">Financier Direct Support</h3>
            <p className="fin-modal-sub">
              Our financial officers are available to assist with loan eligibility, verification, and repayment queries.
            </p>

            <div className="fin-support-contact-list">
              <div className="fin-support-row">
                <Phone size={16} color="#1B3322" />
                <div>
                  <div className="fin-support-label">Direct Hotline</div>
                  <div className="fin-support-val">+91 98765 43210</div>
                </div>
              </div>

              <div className="fin-support-row">
                <Mail size={16} color="#1B3322" />
                <div>
                  <div className="fin-support-label">Email Support</div>
                  <div className="fin-support-val">support@gdkfinance.com</div>
                </div>
              </div>

              <div className="fin-support-row">
                <Clock size={16} color="#1B3322" />
                <div>
                  <div className="fin-support-label">Business Hours</div>
                  <div className="fin-support-val">Mon - Sat: 9:00 AM - 6:30 PM</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="fin-btn-submit"
              onClick={() => setSupportModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Modal 3: Info Dialog ── */}
      {infoModal.isOpen && (
        <div className="fin-modal-overlay" onClick={() => setInfoModal({ isOpen: false, title: '', message: '' })}>
          <div className="fin-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="fin-modal-title">{infoModal.title}</h3>
            <p className="fin-modal-desc">{infoModal.message}</p>
            <button
              type="button"
              className="fin-btn-submit"
              onClick={() => setInfoModal({ isOpen: false, title: '', message: '' })}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
