import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import brandLogo from '../../assets/logo_crop.png';
import Footer from '../../components/Footer/Footer.jsx';
import './PrivacyPolicy.css';

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
  const { hash } = useLocation();
  const [activeSection, setActiveSection] = useState('sec-preamble');

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
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
  }, [hash]);

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
            <Link to="/privacy" className="pp-btn" title="Privacy Policy">
              <ShieldCheck size={15} />
              <span>Privacy Policy</span>
            </Link>
            <button type="button" className="pp-btn" onClick={handlePrint} title="Print Document">
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
          <p className="pp-doc-eyebrow">Legal &amp; Compliance · Statutory Subscriber Agreement</p>
          <h1 className="pp-doc-title">Terms &amp; Conditions</h1>
          <p className="pp-doc-lead">
            Rules, obligations, and operating procedures governing chit group enrolment, monthly contributions,
            transparent reverse auctions, dividend redistribution, and prize money disbursement under the Central Chit
            Funds Act, 1982 and the Tamil Nadu Chit Funds Rules, 1984.
          </p>
          <div className="pp-doc-meta">
            <span className="pp-doc-meta__item">
              Effective Date: <strong>January 1, 2026</strong>
            </span>
            <span>·</span>
            <span className="pp-doc-meta__item">
              Governing Statute: <strong>Central Chit Funds Act, 1982</strong>
            </span>
            <span>·</span>
            <span className="pp-doc-meta__item">
              Established: <strong>1999 (Tamil Nadu)</strong>
            </span>
          </div>
        </div>

        {/* Two-Column Document Body */}
        <div className="pp-layout">
          {/* Sticky Table of Contents */}
          <aside className="pp-sidebar" aria-label="Table of Contents">
            <h2 className="pp-sidebar__label">Contents</h2>
            <ul className="pp-toc">
              {TOC_ITEMS.map((item) => (
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
              <p className="pp-sidebar__note-title">100% Escrow Protected</p>
              <p className="pp-sidebar__note-text">
                Every chit circle runs under a 100% bank-backed security deposit placed with the Registrar of Chits,
                ensuring zero capital default risk for subscribers.
              </p>
            </div>
          </aside>

          {/* Document Content */}
          <article className="pp-article">
            {/* Section 1 */}
            <section id="sec-preamble" className="pp-section">
              <h2 className="pp-section__heading">1. Regulatory Framework &amp; Preamble</h2>
              <p>
                This Subscriber Agreement (“Terms and Conditions”) governs the financial and operational relationship
                between <strong>Sri Periyanayaki Amman Chit Funds / GDK Chit Funds</strong> (hereinafter referred to as
                the <strong>“Foreman”</strong> or <strong>“Company”</strong>) and each participating member
                (hereinafter referred to as the <strong>“Subscriber”</strong> or <strong>“Member”</strong>).
              </p>
              <p>
                The Foreman is a duly registered chit fund enterprise incorporated in the State of Tamil Nadu, operating
                in strict conformity with the <strong>Central Chit Funds Act, 1982 (Act No. 40 of 1982)</strong>, the
                <strong> Tamil Nadu Chit Funds Rules, 1984</strong>, and applicable regulatory directives of the Reserve
                Bank of India (RBI).
              </p>

              <div className="pp-notice">
                <p className="pp-notice__title">Statutory Prior Sanction &amp; Escrow Guarantee</p>
                <p>
                  In compliance with Section 4 of the Chit Funds Act, 1982, no chit group is commenced without obtaining
                  prior written sanction from the Registrar of Chits and filing the approved Chit Agreement. A 100%
                  cash/bank guarantee equal to the full chit value is deposited in an approved bank in the name of the
                  Registrar before group launch.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="sec-eligibility" className="pp-section">
              <h2 className="pp-section__heading">2. Member Eligibility &amp; KYC Mandates</h2>
              <p>
                To join any GDK Chit Funds savings or borrowing circle, prospective subscribers must satisfy all
                statutory eligibility and Know-Your-Customer (KYC) criteria:
              </p>
              <ul>
                <li>
                  <strong>Legal Capacity:</strong> The applicant must be an Indian citizen or Registered Business
                  Entity, at least 18 years of age, legally capable of entering into binding contracts.
                </li>
                <li>
                  <strong>Proof of Identity:</strong> Government-issued Permanent Account Number (PAN Card) and Aadhaar
                  Card with biometric verification.
                </li>
                <li>
                  <strong>Proof of Address:</strong> Recent bank statement (last 3 months), Aadhaar, or utility bill
                  showing residence within Tamil Nadu or adjacent authorized operational zones.
                </li>
                <li>
                  <strong>Bank Mandate:</strong> A valid active bank account held in the applicant&apos;s name with UPI,
                  NEFT, or NACH auto-debit capability.
                </li>
                <li>
                  <strong>Nominee Declaration:</strong> Every subscriber must register a verified nominee entitled to
                  receive chit proceeds in accordance with Section 16 of the Act.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="sec-pooling" className="pp-section">
              <h2 className="pp-section__heading">3. Group Subscriptions &amp; Monthly Dues</h2>
              <p>
                Subscribers agree to contribute fixed monthly instalments as defined by the specific group&apos;s face
                value and tenure (typically 20 months across 20 members).
              </p>
              <ul>
                <li>
                  <strong>Due Date:</strong> Monthly subscriptions are payable on or before the{' '}
                  <strong>10th day</strong> of each calendar month.
                </li>
                <li>
                  <strong>Authorized Payment Modes:</strong> GDK Mobile App UPI, Instant Net Banking, NACH Auto-Debit,
                  or direct branch deposit via crossed cheque/DD. Cash transactions exceeding statutory limits are
                  strictly prohibited.
                </li>
                <li>
                  <strong>Digital Passbook:</strong> Every contribution is logged real-time in the member&apos;s digital
                  passbook accessible via the official mobile application.
                </li>
              </ul>

              <div className="pp-spec-grid">
                <div className="pp-spec-card">
                  <p className="pp-spec-card__label">Due Date</p>
                  <p className="pp-spec-card__val">10th of Every Month</p>
                  <p className="pp-spec-card__desc">
                    Punctual payment ensures full eligibility for monthly dividend discount credits.
                  </p>
                </div>
                <div className="pp-spec-card">
                  <p className="pp-spec-card__label">Grace Period</p>
                  <p className="pp-spec-card__val">5 Business Days</p>
                  <p className="pp-spec-card__desc">
                    Payments cleared before the 15th incur zero late penalties or interest charges.
                  </p>
                </div>
                <div className="pp-spec-card">
                  <p className="pp-spec-card__label">Standard Tenure</p>
                  <p className="pp-spec-card__val">20 Months</p>
                  <p className="pp-spec-card__desc">
                    Synchronized 20-member circles for predictable, disciplined capital creation.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="sec-auction" className="pp-section">
              <h2 className="pp-section__heading">4. Reverse Auction &amp; 30% Discount Ceiling</h2>
              <p>
                Auctions are conducted monthly at the registered branch office and live-streamed simultaneously on the
                GDK Member Mobile Application on the 10th of every month at 5:00 PM.
              </p>
              <ul>
                <li>
                  <strong>Reverse Bidding Principle:</strong> Members requiring immediate liquidity bid down the prize
                  amount by offering a discount. The subscriber offering the highest discount wins that month’s auction.
                </li>
                <li>
                  <strong>Statutory 30% Discount Cap:</strong> In strict compliance with Section 6(3) of the Chit Funds
                  Act, the maximum discount any subscriber can bid is legally capped at{' '}
                  <strong>30% of the gross chit value</strong>.
                </li>
                <li>
                  <strong>Tie-Breaker Mechanism:</strong> If multiple subscribers bid the ceiling 30% discount, the
                  winning ticket is drawn by an open, verifiable transparent lottery conducted in full view of present
                  members and live-streamed via the app.
                </li>
                <li>
                  <strong>Foreman Commission:</strong> A statutory commission of exactly{' '}
                  <strong>5% of the gross chit value</strong> is charged by the Foreman as permitted under Section
                  21(1)(b) of the Act for organizing, managing, and guaranteeing group recovery.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="sec-dividend" className="pp-section">
              <h2 className="pp-section__heading">5. Dividend Sharing &amp; Calculation</h2>
              <p>
                A cornerstone of the chit fund model is mutual prosperity: the winning discount is returned to all
                members as a cash dividend.
              </p>
              <div className="pp-notice">
                <p className="pp-notice__title">Statutory Dividend Distribution Formula</p>
                <p>
                  <strong>Net Distributable Dividend = Winning Bid Discount – 5% Foreman Commission</strong>
                  <br />
                  Each subscriber&apos;s individual dividend = Net Distributable Dividend ÷ Total Number of Members (20).
                  This amount is automatically credited against the subscriber&apos;s next month&apos;s payable
                  instalment.
                </p>
              </div>
              <p style={{ marginTop: '16px' }}>
                <em>Example:</em> In a ₹5,00,000 group, if the auction is won at the maximum 30% discount (₹1,50,000),
                the Foreman fee is ₹25,000 (5%). The remaining ₹1,25,000 is distributed equally among all 20 members,
                granting each member an immediate dividend of <strong>₹6,250</strong>. The next monthly instalment is
                reduced from ₹25,000 to just <strong>₹18,750</strong>.
              </p>
            </section>

            {/* Section 6 */}
            <section id="sec-disbursal" className="pp-section">
              <h2 className="pp-section__heading">6. 24-Hour Prize Money Disbursal SLA</h2>
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
                  <strong>Zero Processing Fees:</strong> GDK Chit Funds charges zero hidden documentation,
                  administrative, or disbursal processing fees on prize releases.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="sec-surety" className="pp-section">
              <h2 className="pp-section__heading">7. Security &amp; Solvent Surety Norms</h2>
              <p>
                Under Section 31 of the Chit Funds Act, a prized subscriber is legally required to furnish sufficient
                security for the regular payment of future instalments before prize money can be released:
              </p>
              <ul>
                <li>
                  <strong>Acceptable Securities:</strong> Personal guarantors of salaried employees / income-tax payees,
                  government employee co-signers, bank guarantees, fixed deposit pledges, or mortgage of unencumbered
                  immovable property.
                </li>
                <li>
                  <strong>Verification:</strong> The Foreman undertakes rapid, courteous verification within 24 hours to
                  ensure mutual safety for all group participants.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="sec-defaulters" className="pp-section">
              <h2 className="pp-section__heading">8. Non-Payment, Penalty &amp; Substitution</h2>
              <p>To protect non-prized savers, strict statutory guidelines govern late payments and defaults:</p>
              <ul>
                <li>
                  <strong>Late Fee / Penal Interest:</strong> Subscriptions unpaid after the 15th of the month attract
                  penal interest of 1.5% per month on the overdue balance.
                </li>
                <li>
                  <strong>Statutory Notice (Section 28):</strong> If a non-prized subscriber defaults on three consecutive
                  instalments, a written notice of 15 days is served. Upon failure to pay, the Foreman may remove the
                  defaulter and substitute a new subscriber.
                </li>
                <li>
                  <strong>Refund to Defaulter:</strong> Any balance due to a removed non-prized subscriber (after
                  statutory deductions) is refunded at the conclusion of the group tenure as required under Section 30
                  of the Act.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="sec-exit" className="pp-section">
              <h2 className="pp-section__heading">9. Chit Transfer &amp; Pre-Mature Exit</h2>
              <p>
                A subscriber may transfer their non-prized chit ticket to another qualified individual subject to the
                prior written consent of the Foreman in accordance with Section 37 of the Act.
              </p>
              <p>
                Upon verification and execution of the transfer deed, all accrued dividends, rights, and liabilities are
                transferred to the incoming member without loss of tenure or credit history.
              </p>
            </section>

            {/* Section 10 */}
            <section id="sec-grievance" className="pp-section">
              <h2 className="pp-section__heading">10. Dispute Resolution &amp; Grievance Redressal</h2>
              <p>
                Any dispute between the Foreman and a Subscriber relating to group membership, auctions, or accounts is
                subject to arbitration before the{' '}
                <strong>Registrar of Chits under Section 64 of the Chit Funds Act, 1982</strong>.
              </p>
              <p>
                The civil courts situated within the jurisdiction of the Registered Office of the Foreman in Tamil Nadu
                shall have exclusive jurisdiction.
              </p>

              <div className="pp-dpo-box">
                <h3 className="pp-dpo-box__title">Official Grievance &amp; Nodal Compliance Officer</h3>
                <p className="pp-dpo-box__sub">
                  In case of queries, clarifications, or complaints regarding chit operations, members may reach out
                  directly to our designated Nodal Compliance Officer:
                </p>

                <div className="pp-dpo-grid">
                  <div className="pp-dpo-item">
                    <span>Registered Head Office</span>
                    <strong>Sri Periyanayaki Complex, Main Road, Tiruppur &amp; Coimbatore, Tamil Nadu – 641601</strong>
                  </div>
                  <div className="pp-dpo-item">
                    <span>Direct Helpline</span>
                    <strong>+91 86106 96889 / 0421-2244550</strong>
                  </div>
                  <div className="pp-dpo-item">
                    <span>Compliance Email</span>
                    <strong>compliance@gdkchitfunds.com</strong>
                  </div>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* ── Shared Home Page Footer ── */}
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
