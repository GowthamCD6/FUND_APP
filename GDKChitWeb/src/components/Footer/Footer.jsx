import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import brandLogo from '../../assets/logo_crop.png';
import './Footer.css';

const Footer = ({ onSectionClick, onPortalClick }) => {
  const navigate = useNavigate();

  const handleSection = (id) => {
    if (onSectionClick) {
      onSectionClick(id);
      return;
    }
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(`/#${id}`);
  };

  const handlePortal = () => {
    if (onPortalClick) {
      onPortalClick();
      return;
    }
    navigate('/login');
  };

  return (
    <footer className="lx-footer" data-scene="enter" data-theme="dark">
      <div className="lx-footer__top">
        {/* Left Column: Brand Identity, Regulatory Badge & Inspiring Quote */}
        <div className="lx-footer__brand">
          <div className="lx-footer__brandRow">
            <img src={brandLogo} alt="GDK Chit Funds Emblem" className="lx-footer__brand-logo" />
            <div className="lx-footer__brand-text">
              <span className="lx-footer__tamil">ஸ்ரீ பெரியநாயகி அம்மன்</span>
              <h3 className="lx-footer__brand-name">GDK CHIT FUNDS</h3>
            </div>
          </div>

          <div className="lx-footer__reg-badge">
            <ShieldCheck size={14} className="lx-footer__reg-icon" aria-hidden="true" />
            <span>Govt. Regd. Chit Fund • Act 1982 Compliant • Estd. 1999</span>
          </div>

          <blockquote className="lx-footer__quote">
            <p className="lx-footer__quote-tamil">“நம்பிக்கையே நமது மூலதனம் — சேமிப்பே குடும்பத்தின் உறுதியான எதிர்காலம்.”</p>
            <p className="lx-footer__quote-en">
              “Trust is our greatest capital. For over 25 years, transforming modest monthly contributions into family
              milestones, generational security, and debt-free prosperity across Tamil Nadu.”
            </p>
          </blockquote>
        </div>

        {/* Right Columns: Company, Legal & Real Head Office Location in the same row */}
        <div className="lx-footer__cols">
          <div className="lx-footer__col">
            <h4>Company</h4>
            <button type="button" onClick={() => handleSection('about')}>About Us</button>
            <button type="button" onClick={() => handleSection('features')}>Why GDK Chits</button>
            <button type="button" onClick={() => handleSection('stats')}>Our Numbers</button>
            <button type="button" onClick={() => handleSection('journey')}>20-Month Journey</button>
            <button type="button" onClick={() => handleSection('testimonials')}>Member Stories</button>
            <button type="button" onClick={handlePortal}>Member Portal</button>
          </div>

          <div className="lx-footer__col">
            <h4>Legal &amp; Trust</h4>
            <button type="button" onClick={() => navigate('/terms')}>Terms &amp; Conditions</button>
            <button type="button" onClick={() => navigate('/privacy')}>Privacy Policy</button>
            <button type="button" onClick={() => navigate('/terms#sec-preamble')}>Chit Funds Act 1982</button>
            <button type="button" onClick={() => navigate('/terms#sec-auction')}>30% Auction Cap</button>
            <button type="button" onClick={() => navigate('/terms#sec-disbursal')}>24-Hour Payout SLA</button>
            <button type="button" onClick={() => navigate('/terms#sec-grievance')}>Grievance Officer</button>
          </div>

          {/* Real Head Office Location & Contact Details from App Data */}
          <div className="lx-footer__col lx-footer__col--office">
            <h4>Head Office &amp; Contact</h4>
            <div className="lx-footer__office-card">
              <div className="lx-footer__office-head">
                <Building2 size={16} className="lx-footer__office-ico" aria-hidden="true" />
                <strong>Periyanayagi Amman ChitFunds</strong>
              </div>
              <div className="lx-footer__office-row">
                <MapPin size={15} className="lx-footer__office-ico" aria-hidden="true" />
                <span>No. 45, Commercial Complex,<br />Coimbatore, Tamil Nadu – 641 001</span>
              </div>
              <div className="lx-footer__office-row">
                <Phone size={15} className="lx-footer__office-ico" aria-hidden="true" />
                <a href="tel:+918610696889" className="lx-footer__contact-link">+91 86106 96889</a>
              </div>
              <div className="lx-footer__office-row">
                <Mail size={15} className="lx-footer__office-ico" aria-hidden="true" />
                <a href="mailto:Gowthamnaveen124@gmail.com" className="lx-footer__contact-link">Gowthamnaveen124@gmail.com</a>
              </div>
              <div className="lx-footer__office-row lx-footer__office-row--hours">
                <Clock size={15} className="lx-footer__office-ico" aria-hidden="true" />
                <span>Mon – Sat: 9:30 AM – 6:30 PM<br /><small>Live Auction: 10th of Every Month at 5:00 PM</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Text Watermark — Height reduced for refined elegance */}
      <div className="lx-footer__mark" aria-hidden="true">
        <span>GDK Chit Funds</span>
      </div>

      <div className="lx-footer__bottom">
        <p className="lx-footer__copy">
          © {new Date().getFullYear()} GDK Chit Funds (ஸ்ரீ பெரியநாயகி அம்மன்). All rights reserved. Central Chit Funds Act, 1982 Registered.
        </p>

        <div className="lx-footer__socials">
          {/* WhatsApp */}
          <a
            href="https://wa.me/918610696889?text=Hello%20GDK%20Chit%20Funds,%20I%20would%20like%20to%20know%20more%20about%20your%20registered%20chit%20plans."
            target="_blank"
            rel="noopener noreferrer"
            className="lx-social"
            aria-label="Chat with GDK Chit Funds on WhatsApp"
            title="WhatsApp: +91 86106 96889"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.98-.276-.1-.476-.15-.676.15-.2.3-.777.98-.952 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.494-.895-.799-1.5-1.786-1.675-2.086-.175-.301-.019-.463.132-.613.136-.135.301-.35.452-.526.15-.175.2-.3.301-.5.1-.2.05-.376-.025-.526-.075-.15-.677-1.631-.927-2.233-.244-.585-.492-.506-.677-.515-.175-.008-.376-.01-.577-.01-.2 0-.526.075-.802.375-.276.3-1.053 1.029-1.053 2.508 0 1.48 1.078 2.909 1.229 3.109.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.379.197 1.898.12.578-.087 1.782-.728 2.033-1.431.25-.703.25-1.306.175-1.432-.075-.125-.276-.2-.577-.35zM12.04 2C6.52 2 2.03 6.49 2.03 12.01c0 1.764.46 3.488 1.334 5.006L2 22l5.122-1.343a9.98 9.98 0 0 0 4.918 1.285h.005c5.518 0 10.008-4.49 10.008-10.01 0-2.673-1.041-5.186-2.932-7.078A9.94 9.94 0 0 0 12.04 2z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/gdkchitfunds"
            target="_blank"
            rel="noopener noreferrer"
            className="lx-social"
            aria-label="Follow GDK Chit Funds on Instagram"
            title="Instagram"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="https://facebook.com/gdkchitfunds"
            target="_blank"
            rel="noopener noreferrer"
            className="lx-social"
            aria-label="Visit GDK Chit Funds on Facebook"
            title="Facebook"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <button type="button" className="lx-social lx-social--top" onClick={() => handleSection('top')}>
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
