import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Scale,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Printer,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Download,
  Coins,
  Award,
  Users,
} from 'lucide-react';
import brandLogo from '../../assets/logo_crop.png';
import './LegalPages.css';

const TOC_ITEMS = [
  { id: 'sec-preamble', label: '1. Regulatory Framework & Preamble' },
  { id: 'sec-eligibility', label: '2. Member Eligibility & KYC Mandates' },
  { id: 'sec-pooling', label: '3. Group Subscriptions & Monthly Dues' },
  { id: 'sec-auction', label: '4. Reverse Auction & 30% Discount Ceiling' },
  { id: 'sec-dividend', label: '5. Dividend Sharing & Calculation' },
  { id: 'sec-disbursal', label: '6. 24-Hour Prize Money Disbursal' },
  { id: 'sec-surety', label: '7. Security & Solvent Surety Norms' },
  { id: 'sec-defaulters', label: '8. Non-Payment, Penalty & Substitution' },
  { id: 'sec-exit', label: '9. Chit Transfer & Pre-Mature Exit' },
  { id: 'sec-grievance', label: '10. Dispute Resolution & Grievance' },
];

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sec-preamble');

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const item of TOC_ITEMS) {
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
            <button type="button" className="legal-btn-ghost" onClick={handlePrint} title="Print Document">
              <Printer size={16} />
              <span>Print Terms</span>
            </button>
            <Link to="/privacy" className="legal-btn-ghost">
              <ShieldCheck size={16} />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="legal-hero">
        <div className="legal-hero__pattern" aria-hidden="true" />
        <div className="legal-hero__inner">
          <div className="legal-hero__badge">
            <Scale size={14} />
            <span>Statutory Subscriber Agreement</span>
          </div>

          <h1 className="legal-hero__title">Terms &amp; Conditions</h1>
          <p className="legal-hero__desc">
            Rules, obligations, and operating procedures governing chit group enrolment, monthly contributions,
            transparent reverse auctions, dividend redistribution, and prize money disbursement under the Central Chit
            Funds Act, 1982.
          </p>

          <div className="legal-hero__chips">
            <div className="legal-chip legal-chip--accent">
              <CheckCircle2 size={14} />
              <span>Central Chit Funds Act, 1982 Registered</span>
            </div>
            <div className="legal-chip">
              <Calendar size={14} />
              <span>Effective Date: 1st January 2026</span>
            </div>
            <div className="legal-chip">
              <Building2 size={14} />
              <span>Tamil Nadu Chit Funds Rules, 1984</span>
            </div>
            <div className="legal-chip">
              <Award size={14} />
              <span>25+ Years Legacy of Trust (Est. 1999)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Legal Body ── */}
      <main className="legal-body">
        {/* Sticky Table of Contents */}
        <aside className="legal-sidebar">
          <h2 className="legal-sidebar__title">Table of Contents</h2>
          <ul className="legal-toc">
            {TOC_ITEMS.map((item) => (
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
              <ShieldCheck size={16} color="#059669" />
              <span>100% Escrow Protected</span>
            </h3>
            <p className="legal-sidebar__card-text">
              Every chit circle runs under a 100% bank-backed security deposit placed with the Registrar of Chits,
              ensuring zero capital default risk for subscribers.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <article className="legal-content">
          {/* Section 1 */}
          <section id="sec-preamble" className="legal-section">
            <span className="legal-section__badge">Clause 01</span>
            <h2 className="legal-section__heading">
              <Building2 size={24} color="#059669" />
              1. Regulatory Framework &amp; Preamble
            </h2>
            <p>
              This Subscriber Agreement (“Terms and Conditions”) governs the financial and operational relationship
              between <strong>Sri Periyanayaki Amman Chit Funds / GDK Chit Funds</strong> (hereinafter referred to as the
              <strong> “Foreman”</strong> or <strong>“Company”</strong>) and each participating member (hereinafter
              referred to as the <strong>“Subscriber”</strong> or <strong>“Member”</strong>).
            </p>
            <p>
              The Foreman is a duly registered chit fund enterprise incorporated in the State of Tamil Nadu, operating in
              strict conformity with the <strong>Central Chit Funds Act, 1982 (Act No. 40 of 1982)</strong>, the
              <strong> Tamil Nadu Chit Funds Rules, 1984</strong>, and applicable regulatory directives of the Reserve Bank
              of India (RBI).
            </p>

            <div className="legal-callout legal-callout--emerald">
              <div className="legal-callout__title">
                <CheckCircle2 size={18} color="#059669" />
                <span>Statutory Prior Sanction &amp; Escrow Guarantee</span>
              </div>
              <p>
                In compliance with Section 4 of the Chit Funds Act, 1982, no chit group is commenced without obtaining
                prior written sanction from the Registrar of Chits and filing the approved Chit Agreement. A 100%
                cash/bank guarantee equal to the full chit value is deposited in an approved bank in the name of the
                Registrar before group launch.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="sec-eligibility" className="legal-section">
            <span className="legal-section__badge">Clause 02</span>
            <h2 className="legal-section__heading">
              <Users size={24} color="#059669" />
              2. Member Eligibility &amp; KYC Mandates
            </h2>
            <p>
              To join any GDK Chit Funds savings or borrowing circle, prospective subscribers must satisfy all statutory
              eligibility and Know-Your-Customer (KYC) criteria:
            </p>
            <ul>
              <li>
                <strong>Legal Capacity:</strong> The applicant must be an Indian citizen or Registered Business Entity, at
                least 18 years of age, legally capable of entering into binding contracts.
              </li>
              <li>
                <strong>Proof of Identity:</strong> Government-issued Permanent Account Number (PAN Card) and Aadhaar Card
                with biometric verification.
              </li>
              <li>
                <strong>Proof of Address:</strong> Recent bank statement (last 3 months), Aadhaar, or utility bill showing
                residence within Tamil Nadu or adjacent authorized operational zones.
              </li>
              <li>
                <strong>Bank Mandate:</strong> A valid active bank account held in the applicant's name with UPI, NEFT, or
                NACH auto-debit capability.
              </li>
              <li>
                <strong>Nominee Declaration:</strong> Every subscriber must register a verified nominee entitled to receive
                chit proceeds in accordance with Section 16 of the Act.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="sec-pooling" className="legal-section">
            <span className="legal-section__badge">Clause 03</span>
            <h2 className="legal-section__heading">
              <Coins size={24} color="#059669" />
              3. Group Subscriptions &amp; Monthly Dues
            </h2>
            <p>
              Subscribers agree to contribute fixed monthly instalments as defined by the specific group's face value and
              tenure (typically 20 months across 20 members).
            </p>
            <ul>
              <li>
                <strong>Due Date:</strong> Monthly subscriptions are payable on or before the <strong>10th day</strong> of
                each calendar month.
              </li>
              <li>
                <strong>Authorized Payment Modes:</strong> GDK Mobile App UPI, Instant Net Banking, NACH Auto-Debit, or
                direct branch deposit via crossed cheque/DD. Cash transactions exceeding statutory limits are strictly
                prohibited.
              </li>
              <li>
                <strong>Digital Passbook:</strong> Every contribution is logged real-time in the member's digital passbook
                accessible via the official mobile application.
              </li>
            </ul>

            <div className="legal-grid">
              <div className="legal-card">
                <div className="legal-card__label">Due Date</div>
                <div className="legal-card__val">10th of Every Month</div>
                <p className="legal-card__desc">Punctual payment ensures full eligibility for monthly dividend discount credits.</p>
              </div>
              <div className="legal-card">
                <div className="legal-card__label">Grace Period</div>
                <div className="legal-card__val">5 Business Days</div>
                <p className="legal-card__desc">Payments cleared before the 15th incur zero late penalties or interest charges.</p>
              </div>
              <div className="legal-card">
                <div className="legal-card__label">Standard Tenure</div>
                <div className="legal-card__val">20 Months</div>
                <p className="legal-card__desc">Synchronized 20-member circles for predictable, disciplined capital creation.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="sec-auction" className="legal-section">
            <span className="legal-section__badge">Clause 04</span>
            <h2 className="legal-section__heading">
              <Scale size={24} color="#059669" />
              4. Reverse Auction &amp; 30% Discount Ceiling
            </h2>
            <p>
              Auctions are conducted monthly at the registered branch office and live-streamed simultaneously on the GDK
              Member Mobile Application on the 10th of every month at 5:00 PM.
            </p>
            <ul>
              <li>
                <strong>Reverse Bidding Principle:</strong> Members requiring immediate liquidity bid down the prize amount
                by offering a discount. The subscriber offering the highest discount wins that month’s auction.
              </li>
              <li>
                <strong>Statutory 30% Discount Cap:</strong> In strict compliance with Section 6(3) of the Chit Funds Act,
                the maximum discount any subscriber can bid is legally capped at <strong>30% of the gross chit value</strong>.
              </li>
              <li>
                <strong>Tie-Breaker Mechanism:</strong> If multiple subscribers bid the ceiling 30% discount, the winning
                ticket is drawn by an open, verifiable transparent lottery conducted in full view of present members and
                live-streamed via the app.
              </li>
              <li>
                <strong>Foreman Commission:</strong> A statutory commission of exactly <strong>5% of the gross chit value</strong> is
                charged by the Foreman as permitted under Section 21(1)(b) of the Act for organizing, managing, and guaranteeing
                group recovery.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="sec-dividend" className="legal-section">
            <span className="legal-section__badge">Clause 05</span>
            <h2 className="legal-section__heading">
              <Award size={24} color="#059669" />
              5. Dividend Sharing &amp; Calculation
            </h2>
            <p>
              A cornerstone of the chit fund model is mutual prosperity: the winning discount is returned to all members
              as a cash dividend.
            </p>
            <div className="legal-callout">
              <div className="legal-callout__title">
                <Coins size={18} color="#C8A45D" />
                <span>Statutory Dividend Distribution Formula</span>
              </div>
              <p>
                <strong>Net Distributable Dividend = Winning Bid Discount – 5% Foreman Commission</strong>
                <br />
                Each subscriber's individual dividend = Net Distributable Dividend ÷ Total Number of Members (20).
                This amount is automatically credited against the subscriber's next month's payable instalment.
              </p>
            </div>
            <p>
              <em>Example:</em> In a ₹5,00,000 group, if the auction is won at the maximum 30% discount (₹1,50,000), the
              Foreman fee is ₹25,000 (5%). The remaining ₹1,25,000 is distributed equally among all 20 members, granting each
              member an immediate dividend of <strong>₹6,250</strong>. The next monthly instalment is reduced from ₹25,000 to
              just <strong>₹18,750</strong>.
            </p>
          </section>

          {/* Section 6 */}
          <section id="sec-disbursal" className="legal-section">
            <span className="legal-section__badge">Clause 06</span>
            <h2 className="legal-section__heading">
              <CheckCircle2 size={24} color="#059669" />
              6. 24-Hour Prize Money Disbursal SLA
            </h2>
            <p>
              The Foreman guarantees prompt prize money disbursement under strict Service Level Agreements (SLAs):
            </p>
            <ul>
              <li>
                <strong>Disbursal Window:</strong> Prize proceeds are wired via direct bank RTGS/NEFT within
                <strong> 24 business hours</strong> of the winning subscriber submitting the required solvent surety
                documentation and completing KYC verification.
              </li>
              <li>
                <strong>Direct Bank Wire:</strong> Funds are credited strictly to the registered bank account of the
                subscriber. Third-party disbursements are prohibited under AML guidelines.
              </li>
              <li>
                <strong>Zero Processing Fees:</strong> GDK Chit Funds charges zero hidden documentation, administrative, or
                disbursal processing fees on prize releases.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="sec-surety" className="legal-section">
            <span className="legal-section__badge">Clause 07</span>
            <h2 className="legal-section__heading">
              <Lock size={24} color="#059669" />
              7. Security &amp; Solvent Surety Norms
            </h2>
            <p>
              Under Section 31 of the Chit Funds Act, a prized subscriber is legally required to furnish sufficient security
              for the regular payment of future instalments before prize money can be released:
            </p>
            <ul>
              <li>
                <strong>Acceptable Securities:</strong> Personal guarantors of salaried employees / income-tax payees,
                government employee co-signers, bank guarantees, fixed deposit pledges, or mortgage of unencumbered immovable
                property.
              </li>
              <li>
                <strong>Verification:</strong> The Foreman undertakes rapid, courteous verification within 24 hours to ensure
                mutual safety for all group participants.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="sec-defaulters" className="legal-section">
            <span className="legal-section__badge">Clause 08</span>
            <h2 className="legal-section__heading">
              <AlertCircle size={24} color="#D97706" />
              8. Non-Payment, Penalty &amp; Substitution
            </h2>
            <p>
              To protect non-prized savers, strict statutory guidelines govern late payments and defaults:
            </p>
            <ul>
              <li>
                <strong>Late Fee / Penal Interest:</strong> Subscriptions unpaid after the 15th of the month attract penal
                interest of 1.5% per month on the overdue balance.
              </li>
              <li>
                <strong>Statutory Notice (Section 28):</strong> If a non-prized subscriber defaults on three consecutive
                instalments, a written notice of 15 days is served. Upon failure to pay, the Foreman may remove the defaulter
                and substitute a new subscriber.
              </li>
              <li>
                <strong>Refund to Defaulter:</strong> Any balance due to a removed non-prized subscriber (after statutory
                deductions) is refunded at the conclusion of the group tenure as required under Section 30 of the Act.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="sec-exit" className="legal-section">
            <span className="legal-section__badge">Clause 09</span>
            <h2 className="legal-section__heading">
              <FileText size={24} color="#059669" />
              9. Chit Transfer &amp; Pre-Mature Exit
            </h2>
            <p>
              A subscriber may transfer their non-prized chit ticket to another qualified individual subject to the prior
              written consent of the Foreman in accordance with Section 37 of the Act.
            </p>
            <p>
              Upon verification and execution of the transfer deed, all accrued dividends, rights, and liabilities are
              transferred to the incoming member without loss of tenure or credit history.
            </p>
          </section>

          {/* Section 10 */}
          <section id="sec-grievance" className="legal-section">
            <span className="legal-section__badge">Clause 10</span>
            <h2 className="legal-section__heading">
              <Scale size={24} color="#059669" />
              10. Dispute Resolution &amp; Grievance Redressal
            </h2>
            <p>
              Any dispute between the Foreman and a Subscriber relating to group membership, auctions, or accounts is
              subject to arbitration before the <strong>Registrar of Chits under Section 64 of the Chit Funds Act, 1982</strong>.
            </p>
            <p>
              The civil courts situated within the jurisdiction of the Registered Office of the Foreman in Tamil Nadu shall
              have exclusive jurisdiction.
            </p>

            {/* Grievance Box */}
            <div className="legal-contact-box">
              <h3>Official Grievance &amp; Nodal Compliance Officer</h3>
              <p>
                In case of queries, clarifications, or complaints regarding chit operations, members may reach out directly
                to our designated Nodal Compliance Officer:
              </p>

              <div className="legal-contact-grid">
                <div className="legal-contact-item">
                  <MapPin size={20} />
                  <div>
                    <span>Registered Head Office</span>
                    <strong>Sri Periyanayaki Complex, Main Road, Tiruppur &amp; Coimbatore, Tamil Nadu – 641601</strong>
                  </div>
                </div>
                <div className="legal-contact-item">
                  <Phone size={20} />
                  <div>
                    <span>Direct Helpline &amp; Desk</span>
                    <strong>+91 86106 96889 / 0421-2244550</strong>
                  </div>
                </div>
                <div className="legal-contact-item">
                  <Mail size={20} />
                  <div>
                    <span>Compliance &amp; Grievance Email</span>
                    <strong>compliance@gdkchitfunds.com</strong>
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
            <a href="#sec-preamble" className="legal-footer__link">Back to Top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsAndConditions;
