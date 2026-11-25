import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import brandLogo from '../../assets/logo_crop.png';
import './PrivacyPolicy.css';

const PRIVACY_TOC = [
  { id: 'sec-intro', label: '1. Introduction & Scope' },
  { id: 'sec-collection', label: '2. Personal Data We Collect' },
  { id: 'sec-purpose', label: '3. Legal Basis & Purpose of Use' },
  { id: 'sec-security', label: '4. Data Security & Encryption' },
  { id: 'sec-sharing', label: '5. Zero-Sale Policy & Disclosures' },
  { id: 'sec-app', label: '6. Mobile App & Permissions' },
  { id: 'sec-retention', label: '7. Data Retention & Archival' },
  { id: 'sec-rights', label: '8. Your Rights as a Subscriber' },
  { id: 'sec-updates', label: '9. Policy Revisions & Amendments' },
  { id: 'sec-dpo', label: '10. Data Protection Officer' },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-intro');

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
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
    <div className="pp-page">
      {/* ── Minimal Monochrome Top Bar ── */}
      <header className="pp-header">
        <div className="pp-header__inner">
          <button type="button" className="pp-brand" onClick={() => navigate('/')}>
            <img src={brandLogo} alt="GDK Chit Funds" className="pp-brand__logo" />
            <div className="pp-brand__meta">
              <span className="pp-brand__tamil">ஸ்ரீ பெரியநாயகி அம்மன்</span>
              <span className="pp-brand__name">GDK CHIT FUNDS</span>
            </div>
          </button>

          <div className="pp-header__actions">
            <button type="button" className="pp-btn" onClick={() => navigate('/')} title="Back to Home">
              <ArrowLeft size={15} />
              <span>Home</span>
            </button>
            <Link to="/terms" className="pp-btn" title="Terms & Conditions">
              <FileText size={15} />
              <span>Terms &amp; Conditions</span>
            </Link>
            <button type="button" className="pp-btn" onClick={handlePrint} title="Print Policy">
              <Printer size={15} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Document Area (No Hero Section) ── */}
      <main className="pp-main">
        {/* Clean Editorial Title Header */}
        <div className="pp-doc-header">
          <p className="pp-doc-eyebrow">Legal &amp; Compliance · Privacy Notice</p>
          <h1 className="pp-doc-title">Privacy Policy</h1>
          <p className="pp-doc-lead">
            This Privacy Policy describes how Sri Periyanayaki Amman Chit Funds / GDK Chit Funds collects, protects,
            stores, and processes subscriber personal, KYC, and financial transaction records in accordance with the
            Digital Personal Data Protection Act, 2023 (DPDP), the Central Chit Funds Act, 1982, and Reserve Bank of
            India security standards.
          </p>
          <div className="pp-doc-meta">
            <span className="pp-doc-meta__item">
              Effective Date: <strong>January 1, 2026</strong>
            </span>
            <span>·</span>
            <span className="pp-doc-meta__item">
              Last Revised: <strong>January 2026</strong>
            </span>
            <span>·</span>
            <span className="pp-doc-meta__item">
              Jurisdiction: <strong>Tamil Nadu, India</strong>
            </span>
          </div>
        </div>

        {/* Two-Column Document Body */}
        <div className="pp-layout">
          {/* Sticky Table of Contents */}
          <aside className="pp-sidebar" aria-label="Table of Contents">
            <h2 className="pp-sidebar__label">Contents</h2>
            <ul className="pp-toc">
              {PRIVACY_TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`pp-toc__link ${activeSection === item.id ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="pp-sidebar__note">
              <p className="pp-sidebar__note-title">Zero-Marketing Guarantee</p>
              <p className="pp-sidebar__note-text">
                We never sell, rent, or monetize your personal data. Subscriber records are used exclusively for
                regulated chit administration, statutory audits, and official passbook communications.
              </p>
            </div>
          </aside>

          {/* Document Content */}
          <article className="pp-article">
            {/* Section 1 */}
            <section id="sec-intro" className="pp-section">
              <h2 className="pp-section__heading">1. Introduction &amp; Scope</h2>
              <p>
                At <strong>Sri Periyanayaki Amman Chit Funds / GDK Chit Funds</strong> (“we”, “our”, or “Company”), we
                treat the confidentiality and financial privacy of our subscribers as a foundational obligation. Since
                1999, families, business owners, and salaried professionals across Tamil Nadu have entrusted us with
                their savings and statutory identification records.
              </p>
              <p>
                This Privacy Policy explains how we collect, store, safeguard, and disclose personal and financial
                information gathered through our physical branch network, our official website (
                <strong>gdkchitfunds.com</strong>), and the <strong>GDK Member Mobile Application</strong>.
              </p>

              <div className="pp-notice">
                <p className="pp-notice__title">Statutory Compliance Framework</p>
                <p>
                  This policy is governed by the <strong>Digital Personal Data Protection Act, 2023 (DPDP)</strong>,
                  the Information Technology Act, 2000, the Central Chit Funds Act, 1982, and Master Directions issued
                  by the Reserve Bank of India (RBI) on Know Your Customer (KYC) compliance.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="sec-collection" className="pp-section">
              <h2 className="pp-section__heading">2. Personal Data We Collect</h2>
              <p>
                To maintain statutory compliance and administer chit groups accurately, we collect only the following
                categories of subscriber information:
              </p>
              <ul>
                <li>
                  <strong>Identity &amp; Demographic Data:</strong> Full legal name, date of birth, gender, marital
                  status, father&apos;s or spouse&apos;s name, photograph, and designated nominee particulars.
                </li>
                <li>
                  <strong>Statutory KYC Documents:</strong> Permanent Account Number (PAN), Aadhaar verification
                  records, Voter ID, or Passport copies as mandated under Section 16 of the Chit Funds Act, 1982.
                </li>
                <li>
                  <strong>Financial &amp; Banking Details:</strong> Bank name, branch address, account number, IFSC
                  code, cancelled cheque or passbook copy, and UPI Virtual Payment Address (VPA) for prize money
                  disbursement.
                </li>
                <li>
                  <strong>Transaction &amp; Auction Records:</strong> Monthly subscription payment history, dividend
                  credits, reverse auction bidding logs, prized status, and outstanding instalment balances.
                </li>
                <li>
                  <strong>Surety &amp; Guarantor Records:</strong> Employment verification, salary slips, Form 16, or
                  immovable property title documents furnished by prized subscribers as statutory security.
                </li>
                <li>
                  <strong>Technical &amp; Session Metadata:</strong> IP address, device model, operating system version,
                  and diagnostic crash logs recorded during authenticated mobile application sessions.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="sec-purpose" className="pp-section">
              <h2 className="pp-section__heading">3. Legal Basis &amp; Purpose of Use</h2>
              <p>We process subscriber information strictly for lawful, documented, and operational purposes:</p>
              <ul>
                <li>
                  <strong>Group Administration:</strong> Enrolling your chit ticket with the Registrar of Chits,
                  maintaining group rosters, and executing official chit agreements.
                </li>
                <li>
                  <strong>Auction Management:</strong> Conducting transparent reverse auctions, validating winning bids,
                  and preserving signed digital minute books.
                </li>
                <li>
                  <strong>Dividend Redistribution:</strong> Computing and crediting monthly auction discount dividends to
                  your digital passbook ledger.
                </li>
                <li>
                  <strong>Prize Money Disbursement:</strong> Verifying solvent sureties and executing RTGS/NEFT prize
                  transfers within our 24-hour service commitment.
                </li>
                <li>
                  <strong>Member Communications:</strong> Delivering transactional SMS, WhatsApp receipts, and app
                  notifications regarding auction schedules, payment confirmations, and dividend credits.
                </li>
                <li>
                  <strong>Statutory Audits:</strong> Filing annual audited balance sheets, minute books, and subscriber
                  registers with the Registrar of Chits, Tamil Nadu.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="sec-security" className="pp-section">
              <h2 className="pp-section__heading">4. Data Security &amp; Encryption</h2>
              <p>
                We enforce strict technical and organizational security controls to protect subscriber records from
                unauthorized access, alteration, or disclosure:
              </p>

              <div className="pp-spec-grid">
                <div className="pp-spec-card">
                  <p className="pp-spec-card__label">In Transit</p>
                  <p className="pp-spec-card__val">TLS 1.3 / 256-bit SSL</p>
                  <p className="pp-spec-card__desc">
                    All traffic between your device and our servers is encrypted using modern transport protocols.
                  </p>
                </div>
                <div className="pp-spec-card">
                  <p className="pp-spec-card__label">At Rest</p>
                  <p className="pp-spec-card__val">AES-256 Storage</p>
                  <p className="pp-spec-card__desc">
                    KYC documents, banking details, and passbook ledgers are stored in encrypted databases.
                  </p>
                </div>
                <div className="pp-spec-card">
                  <p className="pp-spec-card__label">Access Control</p>
                  <p className="pp-spec-card__val">Role-Based RBAC</p>
                  <p className="pp-spec-card__desc">
                    Sensitive records are restricted to authorized compliance staff under full audit logging.
                  </p>
                </div>
              </div>

              <p>
                Our systems undergo periodic vulnerability assessments, access reviews, and annual statutory audits to
                maintain continuous security compliance.
              </p>
            </section>

            {/* Section 5 */}
            <section id="sec-sharing" className="pp-section">
              <h2 className="pp-section__heading">5. Zero-Sale Policy &amp; Disclosures</h2>
              <div className="pp-notice">
                <p className="pp-notice__title">Strict Prohibition on Data Monetization</p>
                <p>
                  We do <strong>not</strong> sell, rent, lease, trade, or disclose your personal or financial data to
                  third-party telemarketers, advertising networks, or external credit brokers under any circumstances.
                </p>
              </div>

              <p style={{ marginTop: '16px' }}>
                Personal information is shared only when legally mandated or operationally necessary with the following
                entities:
              </p>
              <ul>
                <li>
                  <strong>Statutory Regulators:</strong> The Registrar of Chits, Government of Tamil Nadu, Income Tax
                  Department, or Reserve Bank of India pursuant to statutory filings or lawful orders.
                </li>
                <li>
                  <strong>Escrow Banking Partners:</strong> Scheduled Commercial Banks holding chit group escrow
                  accounts and security deposits, solely to execute RTGS/NEFT disbursements.
                </li>
                <li>
                  <strong>Authorized Payment Gateways:</strong> RBI-licensed payment aggregators used to process your
                  online instalment payments.
                </li>
                <li>
                  <strong>Statutory Auditors:</strong> Chartered Accountants appointed under Section 61 of the Chit
                  Funds Act, 1982 to audit annual financial statements.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="sec-app" className="pp-section">
              <h2 className="pp-section__heading">6. Mobile App &amp; Permissions</h2>
              <p>
                The GDK Chit Funds Mobile Application requests only permissions strictly required for core member
                services:
              </p>
              <ul>
                <li>
                  <strong>Camera &amp; Storage:</strong> Used solely when you choose to upload KYC documents, cancelled
                  cheques, or surety records during enrolment or prize claims.
                </li>
                <li>
                  <strong>Notifications:</strong> Used exclusively to deliver live auction alerts, bid confirmations,
                  dividend updates, and payment due reminders.
                </li>
                <li>
                  <strong>Coarse Location:</strong> Used only to verify branch proximity and prevent unauthorized remote
                  account access. We do not perform continuous background location tracking.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="sec-retention" className="pp-section">
              <h2 className="pp-section__heading">7. Data Retention &amp; Archival</h2>
              <p>
                Pursuant to Section 17 of the Chit Funds Act, 1982 and Prevention of Money Laundering (PMLA)
                regulations, the Company is legally required to retain chit registers, subscriber ledgers, minute books,
                and KYC documentation for a minimum period of <strong>eight (8) years</strong> following the final
                termination and statutory audit of each chit group.
              </p>
              <p>
                Once statutory retention periods expire and no pending legal obligations remain, records are permanently
                purged using irreversible cryptographic erasure.
              </p>
            </section>

            {/* Section 8 */}
            <section id="sec-rights" className="pp-section">
              <h2 className="pp-section__heading">8. Your Rights as a Subscriber</h2>
              <p>Under the DPDP Act, 2023 and applicable chit bylaws, subscribers hold the following rights:</p>
              <ul>
                <li>
                  <strong>Right to Access:</strong> Inspect your complete contribution passbook, dividend statements,
                  and auction logs at any time via the mobile app or branch office.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Request updates or corrections to your address, phone number,
                  bank account, or nominee details upon submitting verified supporting documents.
                </li>
                <li>
                  <strong>Right to Grievance Redressal:</strong> Escalate any privacy or data handling concern directly
                  to our Data Protection Officer for timely resolution.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="sec-updates" className="pp-section">
              <h2 className="pp-section__heading">9. Policy Revisions &amp; Amendments</h2>
              <p>
                We may update this Privacy Policy periodically to reflect regulatory updates or operational security
                improvements. Any material revisions will be published on this page with an updated revision date and
                communicated via official in-app notice or SMS at least 15 days prior to taking effect.
              </p>
            </section>

            {/* Section 10 */}
            <section id="sec-dpo" className="pp-section">
              <h2 className="pp-section__heading">10. Data Protection Officer</h2>
              <p>
                For questions, access requests, or privacy concerns, please contact our designated Data Protection
                Officer:
              </p>

              <div className="pp-dpo-box">
                <h3 className="pp-dpo-box__title">Office of the Data Protection Officer (DPO)</h3>
                <p className="pp-dpo-box__sub">
                  Sri Periyanayaki Amman Chit Funds / GDK Chit Funds responds to all verified subscriber privacy
                  inquiries within 48 business hours.
                </p>

                <div className="pp-dpo-grid">
                  <div className="pp-dpo-item">
                    <span>Designated Office</span>
                    <strong>Sri Periyanayaki Complex, Main Road, Tiruppur &amp; Coimbatore, Tamil Nadu – 641601</strong>
                  </div>
                  <div className="pp-dpo-item">
                    <span>Privacy Email</span>
                    <strong>privacy@gdkchitfunds.com</strong>
                  </div>
                  <div className="pp-dpo-item">
                    <span>Direct Helpline</span>
                    <strong>+91 86106 96889 / 0421-2244550</strong>
                  </div>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* ── Minimal Monochrome Footer ── */}
      <footer className="pp-footer">
        <div className="pp-footer__inner">
          <p className="pp-footer__copy">
            © {new Date().getFullYear()} GDK Chit Funds (ஸ்ரீ பெரியநாயகி அம்மன்). All rights reserved. Registered under
            Central Chit Funds Act, 1982.
          </p>

          <div className="pp-footer__links">
            <Link to="/" className="pp-footer__link">Home</Link>
            <Link to="/terms" className="pp-footer__link">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="pp-footer__link">Privacy Policy</Link>
            <a href="#sec-intro" className="pp-footer__link">Back to Top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
