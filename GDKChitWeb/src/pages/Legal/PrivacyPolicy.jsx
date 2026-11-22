import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  FileCheck,
  Database,
  Server,
  UserCheck,
  AlertTriangle,
  Printer,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import brandLogo from '../../assets/logo_crop.png';
import './LegalPages.css';

const PRIVACY_TOC = [
  { id: 'sec-intro', label: '1. Introduction & Scope' },
  { id: 'sec-collection', label: '2. Personal Data We Collect' },
  { id: 'sec-purpose', label: '3. Legal Basis & How We Use Data' },
  { id: 'sec-security', label: '4. Bank-Grade Data Security & Encryption' },
  { id: 'sec-sharing', label: '5. Zero-Sale Policy & Third-Party Sharing' },
  { id: 'sec-app', label: '6. Mobile App & Device Permissions' },
  { id: 'sec-retention', label: '7. Data Retention & Archival Norms' },
  { id: 'sec-rights', label: '8. Your Rights as a Subscriber' },
  { id: 'sec-updates', label: '9. Policy Revisions & Amendments' },
  { id: 'sec-dpo', label: '10. Grievance Officer & Contact' },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-intro');

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const item of PRIVACY_TOC) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-page">
      {/* ── Top Header ── */}
      <header className="legal-header">
        <div className="legal-header__inner">
          <button type="button" className="legal-brand" onClick={() => navigate('/')}>
            <img src={brandLogo} alt="GDK Chit Funds" className="legal-brand__logo" />
            <div className="legal-brand__meta">
              <span className="legal-brand__tamil">ஸ்ரீ பெரியநாயகி அம்மன்</span>
              <span className="legal-brand__name">GDK CHIT FUNDS</span>
            </div>
          </button>

          <div className="legal-header__actions">
            <button type="button" className="legal-btn-ghost" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
            <button type="button" className="legal-btn-ghost" onClick={handlePrint} title="Print Policy">
              <Printer size={16} />
              <span>Print Policy</span>
            </button>
            <Link to="/terms" className="legal-btn-ghost">
              <FileCheck size={16} />
              <span>Terms &amp; Conditions</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="legal-hero">
        <div className="legal-hero__pattern" aria-hidden="true" />
        <div className="legal-hero__inner">
          <div className="legal-hero__badge">
            <ShieldCheck size={14} />
            <span>Information Security &amp; Privacy Mandate</span>
          </div>

          <h1 className="legal-hero__title">Privacy Policy</h1>
          <p className="legal-hero__desc">
            How Sri Periyanayaki Amman Chit Funds collects, protects, encrypts, and processes your identity, KYC,
            and financial transaction records in strict accordance with the Digital Personal Data Protection Act (DPDP),
            Chit Funds Act, 1982, and RBI security standards.
          </p>

          <div className="legal-hero__chips">
            <div className="legal-chip legal-chip--accent">
              <Lock size={14} />
              <span>256-bit AES Bank-Grade Encryption</span>
            </div>
            <div className="legal-chip">
              <Calendar size={14} />
              <span>Last Revised: January 2026</span>
            </div>
            <div className="legal-chip">
              <Eye size={14} />
              <span>Strict Zero Data Selling Policy</span>
            </div>
            <div className="legal-chip">
              <Building2 size={14} />
              <span>RBI &amp; Chit Registrar Audit Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Legal Body ── */}
      <main className="legal-body">
        {/* Sticky Sidebar */}
        <aside className="legal-sidebar">
          <h2 className="legal-sidebar__title">Privacy Sections</h2>
          <ul className="legal-toc">
            {PRIVACY_TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`legal-toc__link ${activeSection === item.id ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ChevronRight size={13} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="legal-sidebar__card">
            <h3 className="legal-sidebar__card-title">
              <Lock size={16} color="#059669" />
              <span>Zero-Marketing Guarantee</span>
            </h3>
            <p className="legal-sidebar__card-text">
              We never sell or monetise your personal data. Your contact and financial details are exclusively used
              for chit group management, statutory audits, and member passbook alerts.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <article className="legal-content">
          {/* Section 1 */}
          <section id="sec-intro" className="legal-section">
            <span className="legal-section__badge">Section 01</span>
            <h2 className="legal-section__heading">
              <ShieldCheck size={24} color="#059669" />
              1. Introduction &amp; Privacy Commitment
            </h2>
            <p>
              At <strong>Sri Periyanayaki Amman Chit Funds / GDK Chit Funds</strong> (“we”, “our”, or “Company”), we hold
              the financial privacy of our subscribers as sacred. For over 25 years since 1999, families, business owners,
              and professionals across Tamil Nadu have trusted us with their savings, dreams, and personal records.
            </p>
            <p>
              This Privacy Policy details how we collect, store, safeguard, and disclose personal and financial
              information gathered through our physical branch network, website (<strong>gdkchitfunds.com</strong>), and
              the <strong>GDK Member Mobile Application</strong>.
            </p>

            <div className="legal-callout legal-callout--emerald">
              <div className="legal-callout__title">
                <CheckCircle2 size={18} color="#059669" />
                <span>Statutory Compliance Umbrella</span>
              </div>
              <p>
                This policy is formulated in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP)</strong>,
                the Information Technology Act, 2000, the Central Chit Funds Act, 1982, and the Master Directions issued by
                the Reserve Bank of India on Know Your Customer (KYC) norms.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="sec-collection" className="legal-section">
            <span className="legal-section__badge">Section 02</span>
            <h2 className="legal-section__heading">
              <Database size={24} color="#059669" />
              2. Personal Data We Collect
            </h2>
            <p>
              To maintain statutory compliance and provide seamless chit operations, we collect the following categories
              of subscriber information:
            </p>
            <ul>
              <li>
                <strong>Identity &amp; Demographic Data:</strong> Full legal name, date of birth, gender, marital status,
                father's / spouse's name, photograph, and nominee information.
              </li>
              <li>
                <strong>Statutory KYC Documents:</strong> Permanent Account Number (PAN Card), Aadhaar Card details,
                Voter ID, or Passport copies as required by Section 16 of the Chit Funds Act.
              </li>
              <li>
                <strong>Financial &amp; Banking Details:</strong> Bank name, branch address, account number, IFSC code,
                cancelled cheque / bank passbook copy, and UPI Virtual Payment Address (VPA) for prize disbursements.
              </li>
              <li>
                <strong>Transaction &amp; Auction Records:</strong> Historical monthly instalments paid, dividend credits
                earned, auction bidding logs, prized status, and outstanding liability balances.
              </li>
              <li>
                <strong>Surety &amp; Guarantor Records:</strong> Employment proofs, salary slips, Form 16, or property
                title documents submitted by prized subscribers as statutory security.
              </li>
              <li>
                <strong>Technical &amp; Device Information:</strong> IP address, device model, operating system version,
                mobile network details, and app crash diagnostics collected during authenticated app sessions.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="sec-purpose" className="legal-section">
            <span className="legal-section__badge">Section 03</span>
            <h2 className="legal-section__heading">
              <FileCheck size={24} color="#059669" />
              3. Legal Basis &amp; How We Use Your Data
            </h2>
            <p>We process subscriber information strictly for lawful, documented purposes:</p>
            <ul>
              <li>
                <strong>Group Administration:</strong> Registering your ticket with the Registrar of Chits, creating group
                rosters, and issuing official chit agreements.
              </li>
              <li>
                <strong>Live Auction Management:</strong> Conducting reverse auctions, verifying winning bids, and maintaining
                digital gavel records.
              </li>
              <li>
                <strong>Dividend Redistribution:</strong> Calculating and crediting monthly auction discount dividends to
                your digital passbook.
              </li>
              <li>
                <strong>Prize Money Disbursement:</strong> Verifying solvent sureties and executing RTGS/NEFT prize money
                transfers within our 24-hour SLA.
              </li>
              <li>
                <strong>Member Notifications:</strong> Sending automated transactional SMS, WhatsApp updates, and app push
                notifications regarding auction schedules, payment receipts, and dividend credits.
              </li>
              <li>
                <strong>Statutory Audits:</strong> Submitting annual audited accounts, minute books, and subscriber lists to
                the Registrar of Chits, Tamil Nadu.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="sec-security" className="legal-section">
            <span className="legal-section__badge">Section 04</span>
            <h2 className="legal-section__heading">
              <Lock size={24} color="#059669" />
              4. Bank-Grade Data Security &amp; Encryption
            </h2>
            <p>
              We implement industry-leading technical and organizational security controls to protect your data from
              unauthorized access, loss, or alteration:
            </p>

            <div className="legal-grid">
              <div className="legal-card">
                <div className="legal-card__label">Encryption in Transit</div>
                <div className="legal-card__val">TLS 1.3 / 256-bit SSL</div>
                <p className="legal-card__desc">All communications between your device and our servers are encrypted with military-grade protocols.</p>
              </div>
              <div className="legal-card">
                <div className="legal-card__label">Encryption at Rest</div>
                <div className="legal-card__val">AES-256 Storage</div>
                <p className="legal-card__desc">KYC documents, banking credentials, and passbook ledgers are stored in encrypted databases.</p>
              </div>
              <div className="legal-card">
                <div className="legal-card__label">Access Governance</div>
                <div className="legal-card__val">Role-Based RBAC</div>
                <p className="legal-card__desc">Only authorized compliance personnel can view sensitive documents under dual-custody audit logs.</p>
              </div>
            </div>

            <p>
              Additionally, our infrastructure undergoes routine vulnerability assessments, penetration testing, and annual
              statutory cybersecurity audits.
            </p>
          </section>

          {/* Section 5 */}
          <section id="sec-sharing" className="legal-section">
            <span className="legal-section__badge">Section 05</span>
            <h2 className="legal-section__heading">
              <Eye size={24} color="#059669" />
              5. Zero-Sale Policy &amp; Third-Party Sharing
            </h2>
            <div className="legal-callout legal-callout--alert">
              <div className="legal-callout__title">
                <AlertTriangle size={18} color="#D97706" />
                <span>Our Uncompromising Zero Data Selling Guarantee</span>
              </div>
              <p>
                <strong>We do NOT sell, rent, trade, or monetize your personal or financial data to third-party telemarketers,
                advertising networks, or credit brokers under any circumstances.</strong>
              </p>
            </div>

            <p>Personal data is disclosed only in the following legally defined circumstances:</p>
            <ul>
              <li>
                <strong>Statutory Regulators:</strong> The Registrar of Chits, State Government of Tamil Nadu, Income Tax
                Department, or Reserve Bank of India pursuant to a lawful subpoena or mandatory inspection.
              </li>
              <li>
                <strong>Escrow Banking Partners:</strong> Scheduled Commercial Banks where chit group escrow accounts and
                security deposits are maintained, solely for RTGS/NEFT transfer execution.
              </li>
              <li>
                <strong>Payment Aggregators:</strong> RBI-authorized payment gateways (e.g., Razorpay/Cashfree/UPI) for
                processing your online instalment deposits.
              </li>
              <li>
                <strong>Statutory Auditors:</strong> Certified Chartered Accountants appointed under Section 61 of the
                Chit Funds Act to audit annual financial balance sheets.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="sec-app" className="legal-section">
            <span className="legal-section__badge">Section 06</span>
            <h2 className="legal-section__heading">
              <Server size={24} color="#059669" />
              6. Mobile App &amp; Device Permissions
            </h2>
            <p>
              The GDK Chit Funds Mobile Application requests only permissions strictly necessary for core functionality:
            </p>
            <ul>
              <li>
                <strong>Camera &amp; Storage:</strong> Required only when uploading KYC documents, cancelled cheques, or
                surety papers during enrolment or prize claim.
              </li>
              <li>
                <strong>Push Notifications:</strong> Used solely to alert you of live auction commencement, bid confirmations,
                dividend announcements, and payment due date reminders.
              </li>
              <li>
                <strong>Location (Coarse):</strong> Used to confirm branch proximity and prevent fraudulent remote account
                hijacking. We never track your ongoing physical movements.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="sec-retention" className="legal-section">
            <span className="legal-section__badge">Section 07</span>
            <h2 className="legal-section__heading">
              <Database size={24} color="#059669" />
              7. Data Retention &amp; Archival Norms
            </h2>
            <p>
              In accordance with Section 17 of the Chit Funds Act, 1982 and Prevention of Money Laundering (PMLA) rules,
              the Company is legally required to preserve chit registers, subscriber ledgers, minute books, and KYC records
              for a minimum period of <strong>eight (8) years</strong> following the final termination and audit of the group.
            </p>
            <p>
              Upon expiration of statutory retention windows, records are purged using irreversible cryptographic shredding
              procedures.
            </p>
          </section>

          {/* Section 8 */}
          <section id="sec-rights" className="legal-section">
            <span className="legal-section__badge">Section 08</span>
            <h2 className="legal-section__heading">
              <UserCheck size={24} color="#059669" />
              8. Your Rights as a Subscriber
            </h2>
            <p>Under the DPDP Act and Chit Fund bylaws, subscribers enjoy clear data prerogatives:</p>
            <ul>
              <li>
                <strong>Right to Access:</strong> View complete historical contribution passbooks, dividend logs, and
                auction certificates anytime via the mobile app.
              </li>
              <li>
                <strong>Right to Rectification:</strong> Request correction of outdated address, phone number, bank account,
                or nominee information by submitting verified proofs.
              </li>
              <li>
                <strong>Right to Grievance Redressal:</strong> Prompt resolution of any data handling concern by our
                designated Data Protection Officer.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="sec-updates" className="legal-section">
            <span className="legal-section__badge">Section 09</span>
            <h2 className="legal-section__heading">
              <Calendar size={24} color="#059669" />
              9. Policy Revisions &amp; Amendments
            </h2>
            <p>
              We reserve the right to amend this Privacy Policy to reflect evolving regulatory directives or security
              enhancements. Any material changes will be notified via our official website, SMS alert, and prominent in-app
              announcement at least 15 days before taking effect.
            </p>
          </section>

          {/* Section 10 */}
          <section id="sec-dpo" className="legal-section">
            <span className="legal-section__badge">Section 10</span>
            <h2 className="legal-section__heading">
              <ShieldCheck size={24} color="#059669" />
              10. Data Protection Officer &amp; Grievance Redressal
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding the processing of your personal data, you may
              contact our designated Data Protection Officer:
            </p>

            <div className="legal-contact-box">
              <h3>Office of the Data Protection Officer (DPO)</h3>
              <p>
                Sri Periyanayaki Amman Chit Funds / GDK Chit Funds is committed to resolving all subscriber privacy
                inquiries within 48 business hours.
              </p>

              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <MapPin size={20} />
                  <div>
                    <span>Designated Office</span>
                    <strong>Compliance &amp; Data Security Cell, Main Branch, Tamil Nadu, India</strong>
                  </div>
                </div>
                <div className="legal-contact-item">
                  <Mail size={20} />
                  <div>
                    <span>Privacy Email</span>
                    <strong>privacy@gdkchitfunds.com</strong>
                  </div>
                </div>
                <div className="legal-contact-item">
                  <Phone size={20} />
                  <div>
                    <span>Toll-Free Grievance Desk</span>
                    <strong>+91 94432 00000 / 0422-2400000</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>

      {/* ── Footer ── */}
      <footer className="legal-footer">
        <div className="legal-footer__inner">
          <p className="legal-footer__copy">
            © {new Date().getFullYear()} GDK Chit Funds (ஸ்ரீ பெரியநாயகி அம்மன்). All rights reserved. Registered under
            Central Chit Funds Act, 1982.
          </p>

          <div className="legal-footer__links">
            <Link to="/" className="legal-footer__link">Home</Link>
            <Link to="/terms" className="legal-footer__link">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="legal-footer__link">Privacy Policy</Link>
            <a href="#sec-intro" className="legal-footer__link">Back to Top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
