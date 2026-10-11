import React, { useState } from 'react';
import {
  BookOpen, X, ChevronRight, ChevronLeft, Bell, Users,
  Gavel, Landmark, Coins, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to GDK Chit Fund',
    icon: Sparkles,
    color: '#2842C4',
    desc: 'Sri Periyanayagi Amman Chit Fund provides safe, legally-compliant monthly chit investments and credit services trusted since 1999.',
    points: [
      'Transparent reverse auctions every month',
      'Guaranteed on-time prize fund disbursements',
      'Automated passbooks & ledger tracking',
    ],
  },
  {
    title: 'Popular Chit Investment Plans',
    icon: Landmark,
    color: '#6B46C1',
    desc: 'Choose from structured 20-month investment schemes tailored to your savings goals:',
    points: [
      '₹1 Lakh Plan — ₹5,000 / month (Popular entry plan)',
      '₹2 Lakh Plan — ₹10,000 / month (Best value family plan)',
      '₹3 Lakh Plan — ₹15,000 / month (Business growth plan)',
      '₹5 Lakh Plan — ₹25,000 / month (Premium corporate scheme)',
    ],
  },
  {
    title: 'Enrolling in a Chit Group',
    icon: Users,
    color: '#10B981',
    desc: 'Join your designated chit group seamlessly using the group invitation code provided by administration:',
    points: [
      'Navigate to "Join the Group" on your left sidebar',
      'Input the unique code (e.g. GDK100K) or choose from active groups',
      'Verify group rules, monthly installment, and member list',
    ],
  },
  {
    title: 'Passbook & Monthly Statements',
    icon: BookOpen,
    color: '#F59E0B',
    desc: 'Track every rupee deposited and earned through your digital chit passbook:',
    points: [
      'Open "Group Card" to inspect your active schemes',
      'View individual installment due dates, discounts, and payment status',
      'Download or print certified ledger statements anytime',
    ],
  },
  {
    title: 'Live Reverse Auctions',
    icon: Gavel,
    color: '#EF4444',
    desc: 'Participate in fair, live reverse bidding to claim the monthly prize money pot:',
    points: [
      'Lowest bid wins the prize amount for that monthly cycle',
      'Real-time timer and instant decrement bid controls',
      'Foregone discount is divided equally as dividend among all members',
    ],
  },
  {
    title: 'Smart Finance & Credit',
    icon: Coins,
    color: '#8B5CF6',
    desc: 'Access emergency financing and working capital loans with micro-repayment terms:',
    points: [
      'Shopkeeper Daily Plan — 100-day daily micro collections',
      'Personal Weekly Plan — 10-week weekend collections',
      'Zero penalty for prepayment and instant digital verification',
    ],
  },
];

const UserManualModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
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
          padding: '36px 32px',
          maxWidth: 520,
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
          }}
        >
          <X size={20} />
        </button>

        {/* Step counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Feature Guide • Step {currentStep + 1} of {STEPS.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentStep ? 'var(--primary)' : 'var(--border)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius)',
              background: `${step.color}15`,
              color: step.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {step.title}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
          {step.desc}
        </p>

        {/* Bullet points */}
        <div
          style={{
            background: 'var(--surface2)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginBottom: 26,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {step.points.map((pt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'var(--text)' }}>
              <CheckCircle2 size={16} color={step.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{pt}</span>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            style={{
              padding: '11px 20px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 600,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 0 ? 0.4 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            onClick={handleNext}
            style={{
              padding: '11px 24px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {currentStep === STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;
