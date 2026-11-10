import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  Calculator,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  HandCoins,
  Heart,
  HelpCircle,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useAuth } from '../../context/AuthContext.jsx';
import GoldenRangoli from '../../assets/UserHomePage/GoldenRangoli.png';
import GoldenRangoliWhite from '../../assets/UserHomePage/GoldenRangoli_White.png';
import RangoliFlankGold from '../../assets/UserHomePage/RangoliFlankGold.png';
import RangoliFlankGoldWhite from '../../assets/UserHomePage/RangoliFlankGold_White.png';
import ZoomGoldenRangoli from '../../assets/UserHomePage/ZoomGoldenRangoli.png';
import ZoomGoldenRangoliWhite from '../../assets/UserHomePage/ZoomGoldenRangoli_White.png';
import ZoomRangoliGold from '../../assets/UserHomePage/ZoomRangoliGold.png';
import ZoomRangoliGoldWhite from '../../assets/UserHomePage/ZoomRangoliGold_White.png';
import './Landing.css';

const STAR_PATH = "M 50 5 C 50 32 68 50 95 50 C 68 50 50 68 50 95 C 50 68 32 50 5 50 C 32 50 50 32 50 5 Z";

/* ══════════════════════════════════════════════════════════════════
   IMAGERY
   Real photography from the Pexels CDN (free for commercial use, no
   attribution required). One id per slot — swap an id to change the
   picture without touching layout, crop or motion code.
   ══════════════════════════════════════════════════════════════════ */

const PHOTO = {
  hero: 8818741, // family gathered around the table at home
  legacy: 8819141, // parents and their daughter in traditional dress
  ledger: 14907378, // rupee notes and coins
  circle: 8818580, // five members seated in a circle around a rangoli
  night: 7686304, // sparklers lit at night
};

const photoUrl = (id, width) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}`;

const photoSet = (id, widths) => widths.map((w) => `${photoUrl(id, w)} ${w}w`).join(', ');

/* ══════════════════════════════════════════════════════════════════
   CONTENT
   ══════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'How It Works' },
  { id: 'plans', label: 'Plans' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'features', label: 'Features' },
  { id: 'platform', label: 'Digital App' },
  { id: 'testimonials', label: 'Testimonials' },
];

const CHAPTERS = [
  { id: 'top', label: 'Intro' },
  { id: 'manifesto', label: 'Manifesto' },
  { id: 'about', label: 'Our Story' },
  { id: 'journey', label: 'The Journey' },
  { id: 'stats', label: 'Numbers' },
  { id: 'plans', label: 'Plans' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'features', label: 'Why Us' },
  { id: 'platform', label: 'Platform' },
  { id: 'testimonials', label: 'Reviews' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
  { id: 'start', label: 'Begin' },
];

const MEMBER_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

const HERO_USP = [
  'Monthly auctions, conducted in the open',
  'Prize money released on the winning day',
  'Contributions and dividends shown in real time',
];

const HERO_GROUP = [
  { label: 'Chit value', value: '₹1,00,000' },
  { label: 'Members', value: '20' },
  { label: 'Term', value: '20 months' },
  { label: 'Instalment', value: '₹5,000' },
];

const MANIFESTO =
  'For more than twenty-five years, families have trusted us with their savings, their dreams and their tomorrow. We return that trust every single month — with transparent auctions, honest numbers and payouts that arrive on time.';

const MANIFESTO_KEYS = new Set(['trusted', 'savings,', 'dreams', 'tomorrow.', 'transparent', 'honest', 'on', 'time.']);

const MANIFESTO_WORDS = MANIFESTO.split(' ');

const STORY = [
  {
    eyebrow: 'Who We Are',
    title: 'Building Wealth & Trust Since 1999',
    body: 'GDK Chit Fund has built a legacy of financial empowerment over 25+ years, helping families save, invest, and access funds through transparent community-based financial solutions.',
    point: 'RBI Registered & Compliant',
    photo: PHOTO.legacy,
    alt: 'Parents standing with their daughter in traditional dress',
  },
  {
    eyebrow: 'Our Promise',
    title: 'Every Rupee, Accounted For',
    body: 'Auctions run in the open, every bid is recorded, and every dividend is shared fairly among the group. No hidden charges and no surprises — just numbers you can read.',
    point: 'Transparent Monthly Auctions',
    photo: PHOTO.ledger,
    alt: 'Close-up of Indian rupee notes and coins',
  },
  {
    eyebrow: 'Our Community',
    title: 'One Circle of Trust',
    body: 'A chit is more than savings. It is a circle of members who lift each other up — so when someone needs funds for a wedding, education or a new venture, the circle is ready.',
    point: 'Guaranteed On-time Payouts',
    photo: PHOTO.circle,
    alt: 'Five members seated in a circle around a rangoli',
  },
];

const JOURNEY = [
  {
    when: 'Month 01',
    title: 'Join a Group',
    text: 'Choose a plan that fits your goals and join a group of members who contribute the same amount every month.',
    icon: Users,
  },
  {
    when: 'Every Month',
    title: 'Contribute Together',
    text: 'Pay a fixed monthly instalment. Every contribution pools together to form the full chit value of the group.',
    icon: HandCoins,
  },
  {
    when: 'Monthly',
    title: 'Transparent Auction',
    text: 'Members who need funds bid openly. The member willing to take the highest discount wins that month’s prize money.',
    icon: Building2,
  },
  {
    when: 'Monthly',
    title: 'Dividends Shared',
    text: 'The discount from the winning bid is shared across the group as a dividend — lowering what everyone pays next.',
    icon: TrendingUp,
  },
  {
    when: 'On Winning',
    title: 'Prize Payout',
    text: 'The winning member receives the prize money promptly, ready for a wedding, education or a new venture.',
    icon: ShieldCheck,
  },
  {
    when: 'Month 20',
    title: 'Maturity',
    text: 'By the end of the term every member has received the chit value — saving with discipline, borrowing without stress.',
    icon: Check,
  },
];

const STATS = [
  {
    value: 500,
    prefix: '',
    suffix: '+',
    label: 'Active Members',
    caption: 'Families and individuals saving together in active chit groups.',
  },
  {
    value: 50,
    prefix: '₹',
    suffix: 'Cr+',
    label: 'Funds Managed',
    caption: 'Pooled contributions managed with complete transparency.',
  },
  {
    value: 25,
    prefix: '',
    suffix: '+',
    label: 'Years Legacy',
    caption: 'A quarter century of serving members, since 1999.',
  },
  {
    value: 100,
    prefix: '',
    suffix: '%',
    label: 'Trust Score',
    caption: 'Built on transparent auctions and guaranteed on-time payouts.',
  },
];

const BAR_HEIGHTS = [22, 30, 36, 44, 50, 58, 66, 74, 86, 100];

const PLANS = [
  {
    id: 1,
    name: 'Standard Plan',
    badge: 'Most Popular',
    total: '₹1,00,000',
    monthly: '₹5,000',
    duration: '20 Months',
    returnAmount: '₹95,000',
  },
  {
    id: 2,
    name: 'Silver Plan',
    badge: 'Best Value',
    total: '₹2,00,000',
    monthly: '₹10,000',
    duration: '20 Months',
    returnAmount: '₹1,90,000',
  },
  {
    id: 3,
    name: 'Gold Plan',
    badge: 'Trending',
    total: '₹3,00,000',
    monthly: '₹15,000',
    duration: '20 Months',
    returnAmount: '₹2,85,000',
  },
  {
    id: 4,
    name: 'Platinum Plan',
    badge: 'Premium',
    total: '₹5,00,000',
    monthly: '₹25,000',
    duration: '20 Months',
    returnAmount: '₹4,75,000',
  },
];

const FEATURES = [
  {
    title: 'RBI Registered',
    description: 'Compliant with applicable Reserve Bank of India chit fund regulations.',
    points: ['Clear terms before you join', 'Documented agreement for every group', 'Compliance-first operations'],
    icon: Building2,
    tone: 'ivory',
  },
  {
    title: 'Transparent Auctions',
    description: 'Monthly bidding with transparent auction processes.',
    points: ['Live bidding in the member portal', 'Every bid recorded', 'Dividends shared with all members'],
    icon: HandCoins,
    tone: 'navy',
  },
  {
    title: 'Guaranteed Payouts',
    description: 'Timely prize money disbursement according to applicable terms.',
    points: ['Prize money released promptly', 'Clear payout schedules', 'Dedicated member support'],
    icon: ShieldCheck,
    tone: 'emerald',
  },
  {
    title: 'Digital Tracking',
    description: 'Real-time investment and auction dividend tracking.',
    points: ['Contribution history at a glance', 'Auction & dividend statements', 'Access on web and mobile'],
    icon: TrendingUp,
    tone: 'gold',
  },
];

const MARQUEE = ['Trust', 'Transparency', 'Growth', 'Community', 'Since 1999'];

const TESTIMONIALS = [
  {
    name: 'Ramesh Kumar',
    role: 'Business Owner',
    location: 'Coimbatore',
    text: 'I have been a member of GDK Chit Funds for over 8 years. The transparency in their auctions and the punctual payouts have helped me fund two of my children\'s education expenses without any financial stress.',
    rating: 5,
    years: '8+ years member',
  },
  {
    name: 'Lakshmi Devi',
    role: 'School Teacher',
    location: 'Salem',
    text: 'As a single mother, saving consistently was my biggest challenge. GDK\'s structured monthly plan made it possible for me to save ₹2 lakhs which I used to renovate my home. The staff treats every member like family.',
    rating: 5,
    years: '5 years member',
  },
  {
    name: 'Senthil Murugan',
    role: 'Auto Parts Dealer',
    location: 'Erode',
    text: 'When I needed capital to expand my shop, GDK\'s chit fund came through perfectly. The auction process is fair and open — I could see every bid. Got my prize money within 24 hours of winning.',
    rating: 5,
    years: '12+ years member',
  },
  {
    name: 'Priya Shankar',
    role: 'Software Engineer',
    location: 'Chennai',
    text: 'Even with modern investment options, chit funds remain the most disciplined way to save. GDK\'s digital tracking lets me monitor my contributions from my phone. Highly recommend for young professionals.',
    rating: 5,
    years: '3 years member',
  },
  {
    name: 'Murugesan K.',
    role: 'Farmer',
    location: 'Tirupur',
    text: 'My family has been with GDK since my father\'s time. Three generations of trust. They helped us during tough harvest seasons with timely payouts. That\'s real commitment.',
    rating: 5,
    years: '15+ years member',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What is a chit fund and how does it work?',
    answer: 'A chit fund is a rotating savings and credit scheme where a group of members contribute a fixed amount monthly. Each month, one member wins the pooled amount through an auction. The discount from the winning bid is shared as dividends among all members, reducing their effective instalment.',
  },
  {
    question: 'Is GDK Chit Fund registered with the RBI?',
    answer: 'Yes, GDK Chit Funds is fully registered and compliant with the Reserve Bank of India\'s chit fund regulations. We operate under the Chit Fund Act and maintain complete transparency in all our operations.',
  },
  {
    question: 'How do the monthly auctions work?',
    answer: 'Each month, members who need funds bid a discount on the chit value. For example, in a ₹1,00,000 chit, a member might bid ₹20,000 as discount — receiving ₹80,000 as prize money. The ₹20,000 discount is then distributed equally as dividends to all members, reducing everyone\'s next instalment.',
  },
  {
    question: 'When do I receive my prize money after winning?',
    answer: 'Prize money is disbursed promptly after the auction — typically within 24 hours of winning. We pride ourselves on our on-time payout guarantee, which has been maintained for over 25 years.',
  },
  {
    question: 'Can I track my payments and dividends online?',
    answer: 'Absolutely. Our digital member portal gives you real-time access to your contribution history, auction results, dividend statements, and group details. You can access it from any device — web or mobile.',
  },
  {
    question: 'What happens if a member defaults on payment?',
    answer: 'We have robust safeguards in place. Members provide security documentation at the time of joining. In case of defaults, our team works with the member to find a resolution. The group\'s interests are always protected.',
  },
];

const MILESTONES = [
  { year: '1999', event: 'Founded', detail: 'GDK Chit Funds established by Sri Periyanayagi Amman trust' },
  { year: '2005', event: '100 Members', detail: 'Crossed 100 active members across multiple groups' },
  { year: '2012', event: '₹10 Cr Managed', detail: 'Total funds under management crossed ₹10 crore' },
  { year: '2018', event: 'Digital Launch', detail: 'Launched member portal for online tracking and payments' },
  { year: '2023', event: '500+ Members', detail: 'Serving 500+ families across Tamil Nadu' },
  { year: '2024', event: '₹50 Cr+', detail: 'Total funds managed surpassed ₹50 crore milestone' },
];

/* ══════════════════════════════════════════════════════════════════
   SCROLL ENGINE
   Every scene is declared in markup with data-scene:
     pin        → tall stage, sticky viewport, --p = 0…1 across the pin
     horizontal → pin + vertical scroll drives a horizontal [data-track]
     stack      → sticky [data-card]s; each gets --c as the next covers it
     pass       → --p = 0…1 while the element crosses the viewport
     enter      → --p = 0…1 until the element's bottom meets the viewport
   One passive listener + one rAF. Values are written straight to the
   DOM as CSS custom properties, so React never re-renders on scroll.
   ══════════════════════════════════════════════════════════════════ */

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollToSection = (id) => {
  const reduced = prefersReducedMotion();
  const behavior = reduced ? 'auto' : 'smooth';

  if (id === 'top') {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior });
};

const formatCount = (node, value) => `${node.dataset.prefix || ''}${value}${node.dataset.suffix || ''}`;

const useScrollytelling = (rootRef, motion, lenisRef, onScrollUpdate) => {
  const onScrollRef = useRef(onScrollUpdate);
  useEffect(() => {
    onScrollRef.current = onScrollUpdate;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const nav = root.querySelector('[data-nav]');
    const railButtons = Array.from(root.querySelectorAll('[data-rail]'));
    const chapters = Array.from(root.querySelectorAll('[data-chapter]'));
    const themed = Array.from(root.querySelectorAll('[data-theme]'));

    const scenes = Array.from(root.querySelectorAll('[data-scene]')).map((el) => ({
      el,
      mode: el.dataset.scene,
      steps: Number(el.dataset.steps) || 0,
      viewport: el.querySelector('[data-viewport]'),
      track: el.querySelector('[data-track]'),
      cards: Array.from(el.querySelectorAll('[data-card]')),
      counters: Array.from(el.querySelectorAll('[data-count]')),
      scrubs: Array.from(el.querySelectorAll('[data-scrub]')),
      measured: el.querySelector('[data-measure]'),
      progress: 0,
      targetProgress: 0,
      currentProgress: 0,
      step: -1,
      active: -1,
      maxShift: 0,
      viewportWidth: 0,
      centers: [],
      spacing: 1,
    }));

    const sceneByElement = new Map(scenes.map((scene) => [scene.el, scene]));

    let vh = window.innerHeight;
    let vw = window.innerWidth;
    let lastY = window.scrollY;
    let frame = null;
    let lastChapter = '';
    let alive = true;

    if (!motion) {
      scenes.forEach((scene) =>
        scene.counters.forEach((node) => {
          node.textContent = formatCount(node, node.dataset.count);
        })
      );
    }

    const measure = () => {
      vh = window.innerHeight;
      vw = window.innerWidth;
      if (!motion) return;

      scenes.forEach((scene) => {
        if (scene.mode === 'horizontal' && scene.track && scene.viewport) {
          scene.viewportWidth = scene.viewport.clientWidth;
          scene.maxShift = Math.max(0, scene.track.offsetWidth - scene.viewportWidth);
          scene.el.style.height = `${Math.round(vh + scene.maxShift * 1.35)}px`;
          scene.centers = scene.cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
          scene.spacing = scene.centers.length > 1 ? scene.centers[1] - scene.centers[0] : 1;
        }

        if (scene.measured) {
          const bottom = scene.measured.offsetTop + scene.measured.offsetHeight;
          scene.el.style.setProperty('--copy-b', `${bottom}px`);
        }
      });

      if (lenisRef?.current) {
        lenisRef.current.resize();
      }
    };

    const probeTheme = (y) => {
      for (const el of themed) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= y && rect.bottom > y) {
          if (!motion) return el.dataset.themeOff || el.dataset.theme;
          const scene = sceneByElement.get(el);
          if (el.dataset.themeAfter && scene && scene.progress >= Number(el.dataset.themeAt)) {
            return el.dataset.themeAfter;
          }
          return el.dataset.theme;
        }
      }
      return 'light';
    };

    const updateScene = (scene, immediate = false) => {
      const { el } = scene;
      const rect = el.getBoundingClientRect();

      let target;
      if (scene.mode === 'pass') {
        target = clamp((vh - rect.top) / (vh + rect.height));
      } else if (scene.mode === 'enter') {
        target = rect.height > 0 ? clamp((vh - rect.top) / rect.height) : 0;
      } else {
        const travel = rect.height - vh;
        target = travel > 0 ? clamp(-rect.top / travel) : 0;
      }

      const progress = target;
      scene.targetProgress = target;
      scene.currentProgress = target;
      scene.progress = target;
      el.style.setProperty('--p', target.toFixed(4));

      // Stepped scenes: scale so the final step fully arrives at 90% scroll and remains visible
      if (scene.steps) {
        const normalized = clamp(target / 0.90);
        const raw = normalized * scene.steps;
        const step = Math.min(scene.steps - 1, Math.floor(raw));
        el.style.setProperty('--s', clamp(raw - step).toFixed(4));
        if (step !== scene.step) {
          scene.step = step;
          el.dataset.step = String(step);
          el.style.setProperty('--step', String(step));
        }
      }

      // Horizontal scenes: scale so the last card reaches center view by 90% and stays fully visible before unpinning
      if (scene.mode === 'horizontal' && scene.track) {
        const shift = Math.min(scene.maxShift, (target / 0.90) * scene.maxShift);
        scene.track.style.transform = `translate3d(${(-shift).toFixed(2)}px, 0, 0)`;

        let nearest = 0;
        let best = Infinity;
        scene.cards.forEach((card, index) => {
          const distance = (scene.centers[index] - shift - scene.viewportWidth / 2) / (scene.spacing || 1);
          const absolute = Math.abs(distance);
          card.style.setProperty('--d', distance.toFixed(3));
          card.style.setProperty('--ad', absolute.toFixed(3));
          if (absolute < best) {
            best = absolute;
            nearest = index;
          }
        });

        if (nearest !== scene.active) {
          scene.active = nearest;
          scene.cards.forEach((card, index) => {
            card.dataset.active = String(index === nearest);
          });
        }
      }

      if (scene.mode === 'stack') {
        scene.cards.forEach((card, index) => {
          const next = scene.cards[index + 1];
          if (!next) return;
          const gap = next.getBoundingClientRect().top - card.getBoundingClientRect().top;
          const covered = clamp(1 - gap / Math.max(1, card.offsetHeight));
          card.style.setProperty('--c', covered.toFixed(4));
        });
      }

      scene.counters.forEach((node) => {
        const segment = Number(node.dataset.seg || 0);
        const local = scene.steps ? clamp(progress * scene.steps - segment) : progress;
        const value = Math.round(Number(node.dataset.count) * easeOut(clamp(local / 0.7)));
        const text = formatCount(node, value);
        if (node.textContent !== text) node.textContent = text;
      });

      scene.scrubs.forEach((node) => {
        const from = Number(node.dataset.from) || 0;
        const to = Number(node.dataset.to) || 0;
        const value = Math.round(from + (to - from) * target);
        const text = String(value).padStart(Number(node.dataset.pad) || 0, '0');
        if (node.textContent !== text) node.textContent = text;
      });
    };

    const update = () => {
      frame = null;

      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - vh;
      root.style.setProperty('--page-p', maxScroll > 0 ? clamp(y / maxScroll).toFixed(4) : '0');

      if (onScrollRef.current) {
        onScrollRef.current(y);
      }

      if (nav) {
        nav.dataset.scrolled = String(y > 24);
        if (Math.abs(y - lastY) > 25) {
          nav.dataset.hidden = String(y > lastY && y > vh * 0.75);
          lastY = y;
        }
      }

      if (motion) {
        scenes.forEach((scene) => {
          updateScene(scene);
        });
      }

      root.dataset.navTheme = probeTheme(40);
      root.dataset.railTheme = probeTheme(vh / 2);

      let current = '';
      for (const chapter of chapters) {
        const rect = chapter.getBoundingClientRect();
        if (rect.top <= vh / 2 && rect.bottom > vh / 2) {
          current = chapter.id;
          break;
        }
      }

      if (current !== lastChapter) {
        lastChapter = current;
        railButtons.forEach((button) => {
          button.dataset.active = String(button.dataset.rail === current);
        });
      }
    };

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      const widthChanged = window.innerWidth !== vw;
      const heightJump = Math.abs(window.innerHeight - vh) > 150;
      if (widthChanged || heightJump) measure();
      schedule();
    };

    const remeasure = () => {
      if (!alive) return;
      measure();
      schedule();
    };

    measure();
    update();

    let lenis = null;
    let rafId = null;

    if (motion && typeof window !== 'undefined') {
      lenis = new Lenis({
        lerp: 0.08,
        duration: 1.25,
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.15,
        orientation: 'vertical',
      });
      if (lenisRef) lenisRef.current = lenis;

      const runRaf = (time) => {
        if (!alive) return;
        lenis.raf(time);
        rafId = requestAnimationFrame(runRaf);
      };
      rafId = requestAnimationFrame(runRaf);

      lenis.on('scroll', schedule);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);

    let observer = null;
    if (motion && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(remeasure);
      scenes.forEach((scene) => {
        if (scene.track) observer.observe(scene.track);
        if (scene.measured) observer.observe(scene.measured);
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    return () => {
      alive = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (lenis) {
        lenis.destroy();
        if (lenisRef) lenisRef.current = null;
      }
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);

      scenes.forEach((scene) => {
        scene.el.style.removeProperty('--p');
        scene.el.style.removeProperty('--s');
        scene.el.style.removeProperty('--step');
        scene.el.style.removeProperty('--copy-b');
        scene.el.style.height = '';
        if (scene.steps) scene.el.dataset.step = '0';
        if (scene.track) scene.track.style.transform = '';
        scene.cards.forEach((card) => {
          card.style.removeProperty('--d');
          card.style.removeProperty('--ad');
          card.style.removeProperty('--c');
          delete card.dataset.active;
        });
      });
    };
  }, [rootRef, motion, lenisRef]);
};

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setReduced(event.matches);

    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleChange);
    else mediaQuery.addListener(handleChange);

    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleChange);
      else mediaQuery.removeListener(handleChange);
    };
  }, []);

  return reduced;
};

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */

const Landing = () => {
  const navigate = useNavigate();
  const { user, status, isAdminRole } = useAuth();

  const rootRef = useRef(null);
  const lenisRef = useRef(null);
  const loaderCountRef = useRef(null);
  const loaderBarRef = useRef(null);

  const reducedMotion = useReducedMotion();
  const motion = !reducedMotion;

  const [rotationDeg, setRotationDeg] = useState(180);
  const [goldWave, setGoldWave] = useState(0);
  const [goldOpacity, setGoldOpacity] = useState(0);

  const [loaded, setLoaded] = useState(() => {
    if (prefersReducedMotion()) return true;
    return false;
  });
  const [loaderGone, setLoaderGone] = useState(() => {
    if (prefersReducedMotion()) return true;
    return false;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isAuthed = status === 'authed';
  const isAdmin = isAdminRole(user?.role);
  const portalPath = !isAuthed ? '/login' : isAdmin ? '/admin/dashboard' : '/user/home';
  const portalLabel = !isAuthed ? 'Sign In' : isAdmin ? 'Open Admin Portal' : 'Open Member Portal';

  useScrollytelling(rootRef, motion, lenisRef, (y) => setShowScrollTop(y > 350));

  const goToSection = (id) => {
    setMenuOpen(false);
    if (lenisRef.current && motion) {
      if (id === 'top') {
        lenisRef.current.scrollTo(0, { duration: 1.8 });
        return;
      }
      const target = document.getElementById(id);
      if (target) {
        lenisRef.current.scrollTo(target, { offset: -70, duration: 1.8 });
        return;
      }
    }
    scrollToSection(id);
  };

  const goToPortal = () => {
    setMenuOpen(false);
    navigate(portalPath);
  };

  /* ── Mobile-app style Splash Screen (2400ms ceremonial entrance) ── */
  useEffect(() => {
    if (loaded) return undefined;

    const duration = 2400;
    let frame = null;
    let timer = null;
    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const t = clamp((now - start) / duration);
      const eased = easeOut(t);

      // Rotating mandalas: 180deg to 270deg (exact match to ceremonial mobile entrance)
      const rot = 180 + eased * 90;
      setRotationDeg(rot);

      // White to Gold revelation wave:
      // Begins as pure celestial silver-white, expands outward into 24K radiant temple gold
      const wave = clamp((t - 0.16) / 0.62);
      const easedWave = easeOut(wave);
      setGoldWave(Math.round(easedWave * 125));
      setGoldOpacity(Math.min(1, easedWave * 1.25));

      if (loaderCountRef.current) loaderCountRef.current.textContent = String(Math.round(eased * 100));
      if (loaderBarRef.current) loaderBarRef.current.style.transform = `scaleX(${eased.toFixed(3)})`;

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        timer = setTimeout(() => setLoaded(true), 120);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      if (timer !== null) clearTimeout(timer);
    };
  }, [loaded]);

  useEffect(() => {
    if (!loaded || loaderGone) return undefined;
    const timer = setTimeout(() => setLoaderGone(true), 650);
    return () => clearTimeout(timer);
  }, [loaded, loaderGone]);

  /* ── Mobile menu body lock ── */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  /* ── One-shot reveals for content outside pinned scenes ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const nodes = root.querySelectorAll('.lx-reveal');

    if (!motion || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-in'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [motion]);

  return (
    <div
      ref={rootRef}
      className={`lx${loaded ? ' is-ready' : ''}`}
      data-motion={motion ? 'on' : 'off'}
      data-menu={menuOpen}
      data-nav-theme="light"
      data-rail-theme="light"
    >
      {/* ═══ Mobile App Authentic Splash Screen ═══ */}
      {!loaderGone && (
        <div
          className="lx-splash"
          data-done={loaded}
          role="dialog"
          aria-label="Welcome to GDK Chit Funds"
        >
          {/* Main Centered Ceremonial Showcase Card */}
          <div className="lx-splash__center-card">
            {/* Multi-depth Rangoli Stage (4 Unique Sized Organic Rangolis with White-to-Gold Transition) */}
            <div className="lx-splash__rangoli-stage" aria-hidden="true">
              {/* Rangoli 1: Hero Crown Rangoli (Largest - Grand Sizing) */}
              <div
                className="lx-splash__rangoli-unit lx-splash__rangoli-unit--hero"
                style={{ transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)` }}
              >
                <img
                  src={GoldenRangoliWhite}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--white"
                />
                <img
                  src={GoldenRangoli}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--gold"
                  style={{
                    clipPath: `circle(${goldWave}% at 50% 50%)`,
                    WebkitClipPath: `circle(${goldWave}% at 50% 50%)`,
                    opacity: goldOpacity,
                  }}
                />
              </div>

              {/* Rangoli 2: Top-Left Floating Rangoli (Medium-Large - Spacious Flank) */}
              <div
                className="lx-splash__rangoli-unit lx-splash__rangoli-unit--left"
                style={{ transform: `translate(-50%, -50%) rotate(${-rotationDeg * 0.75}deg)` }}
              >
                <img
                  src={RangoliFlankGoldWhite}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--white"
                />
                <img
                  src={RangoliFlankGold}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--gold"
                  style={{
                    clipPath: `circle(${goldWave}% at 50% 50%)`,
                    WebkitClipPath: `circle(${goldWave}% at 50% 50%)`,
                    opacity: goldOpacity,
                  }}
                />
              </div>

              {/* Rangoli 3: Top-Right Floating Rangoli (Medium - Spacious Flank) */}
              <div
                className="lx-splash__rangoli-unit lx-splash__rangoli-unit--right"
                style={{ transform: `translate(-50%, -50%) rotate(${rotationDeg * 0.65 + 45}deg)` }}
              >
                <img
                  src={ZoomGoldenRangoliWhite}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--white"
                />
                <img
                  src={ZoomGoldenRangoli}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--gold"
                  style={{
                    clipPath: `circle(${goldWave}% at 50% 50%)`,
                    WebkitClipPath: `circle(${goldWave}% at 50% 50%)`,
                    opacity: goldOpacity,
                  }}
                />
              </div>

              {/* Rangoli 4: Sacred Center Core Jewel (Smallest - Concentrated Radiance) */}
              <div
                className="lx-splash__rangoli-unit lx-splash__rangoli-unit--core"
                style={{ transform: `translate(-50%, -50%) rotate(${-rotationDeg * 1.25}deg)` }}
              >
                <img
                  src={ZoomRangoliGoldWhite}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--white"
                />
                <img
                  src={ZoomRangoliGold}
                  alt=""
                  className="lx-splash__rangoli lx-splash__rangoli--gold"
                  style={{
                    clipPath: `circle(${goldWave}% at 50% 50%)`,
                    WebkitClipPath: `circle(${goldWave}% at 50% 50%)`,
                    opacity: goldOpacity,
                  }}
                />
              </div>
            </div>

            {/* Centered Brand Content Overlay */}
            <div className="lx-splash__content">
              <h1 className="lx-splash__title">
                ஸ்ரீ பெரியநாயகி அம்மன்
              </h1>

              <div className="lx-splash__tagline">
                <span className="lx-splash__line lx-splash__line--left" />
                <span className="lx-splash__star-dot">✦</span>
                <span className="lx-splash__tagline-text">Chitfunds Since 1999</span>
                <span className="lx-splash__star-dot">✦</span>
                <span className="lx-splash__line lx-splash__line--right" />
              </div>

              {/* Progress loader */}
              <div className="lx-splash__progress-wrap">
                <div className="lx-splash__progress-track">
                  <span ref={loaderBarRef} className="lx-splash__progress-bar" />
                </div>
                <span className="lx-splash__count">
                  <span ref={loaderCountRef}>0</span>%
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Brand Footer */}
          <div className="lx-splash__footer" aria-hidden="true">
            <div className="lx-splash__footer-brand">
              <span className="lx-splash__footer-om">ஸ்ரீ</span>
              <svg className="lx-splash__mini-star" width="22" height="22" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="splashMiniStarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFF176" />
                    <stop offset="100%" stopColor="#FFC107" />
                  </linearGradient>
                </defs>
                <path d={STAR_PATH} fill="url(#splashMiniStarGrad)" />
              </svg>
            </div>
            <span className="lx-splash__footer-gold">CHITFUNDS</span>
          </div>
        </div>
      )}

      {/* ═══ Page progress ═══ */}
      <div className="lx-progress" aria-hidden="true">
        <span />
      </div>

      {/* ═══ Fixed navigation ═══ */}
      <header className="lx-nav" data-nav data-scrolled="false" data-hidden="false">
        <div className="lx-nav__inner">
          <button
            type="button"
            className="lx-brand"
            onClick={() => goToSection('top')}
            aria-label="GDK Chit Fund — back to top"
          >
            <span className="lx-brand__mark" aria-hidden="true">
              G
            </span>
            <span className="lx-brand__name">GDK Chit Fund</span>
          </button>

          <nav className="lx-nav__links" aria-label="Landing sections">
            {NAV_LINKS.map((link) => (
              <button type="button" key={link.id} className="lx-nav__link" onClick={() => goToSection(link.id)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="lx-nav__actions">
            <button type="button" className="lx-btn lx-btn--primary lx-nav__cta" onClick={goToPortal}>
              {portalLabel}
              <ChevronRight size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="lx-nav__toggle"
              data-open={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="lx-mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="lx-menu" id="lx-mobile-menu">
          <nav className="lx-menu__links" aria-label="Mobile navigation">
            {NAV_LINKS.map((link, index) => (
              <button
                type="button"
                key={link.id}
                className="lx-menu__link"
                style={{ '--i': index }}
                onClick={() => goToSection(link.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {link.label}
              </button>
            ))}
          </nav>

          <button type="button" className="lx-btn lx-btn--gold lx-menu__cta" onClick={goToPortal}>
            {portalLabel}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ═══ Chapter rail ═══ */}
      <nav className="lx-rail" aria-label="Page chapters">
        {CHAPTERS.map((chapter) => (
          <button
            type="button"
            key={chapter.id}
            className="lx-rail__item"
            data-rail={chapter.id}
            onClick={() => goToSection(chapter.id)}
          >
            <span className="lx-rail__label">{chapter.label}</span>
            <span className="lx-rail__dot" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <main className="lx-main">
        {/* ═══ Scene 01 — Hero: the window opens into the story ═══ */}
        <section
          className="lx-hero"
          id="top"
          data-scene="pin"
          data-steps="3"
          data-step="0"
          data-chapter
          data-theme="light"
          data-theme-after="dark"
          data-theme-at="0.42"
        >
          <div className="lx-sticky lx-hero__sticky">
            <div className="lx-hero__media">
              <div className="lx-hero__zoom">
                <img
                  src={photoUrl(PHOTO.hero, 1800)}
                  srcSet={photoSet(PHOTO.hero, [900, 1400, 1800, 2400])}
                  sizes="100vw"
                  alt="A family gathered around the table at home"
                  width="1800"
                  height="1350"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              <span className="lx-hero__shade" aria-hidden="true" />
            </div>

            <div className="lx-hero__copy" data-measure>
              <p className="lx-hero__brand lx-intro" style={{ '--d': '80ms' }}>
                <span className="lx-hero__tamil">ஸ்ரீ பெரியநாயகி அம்மன்</span>
                <span className="lx-hero__tamilEn">CHITFUNDS</span>
              </p>

              <p className="lx-hero__badge lx-intro" style={{ '--d': '180ms' }}>
                <ShieldCheck size={15} aria-hidden="true" />
                RBI-registered &middot; Serving members since 1999
              </p>

              <h1 className="lx-hero__title">
                <span className="lx-line">
                  <span style={{ '--d': '300ms' }}>The chit fund,</span>
                </span>
                <span className="lx-line">
                  <span style={{ '--d': '410ms' }}>
                    without the <em>guesswork</em>.
                  </span>
                </span>
              </h1>

              <p className="lx-hero__sub lx-intro" style={{ '--d': '560ms' }}>
                GDK Chit Funds has run regulated chit groups for families across Tamil Nadu since
                1999. You pay a fixed instalment each month, bid for the prize money when you
                actually need it, and follow every rupee through a member ledger you can read
                &mdash; from the first instalment to maturity.
              </p>

              <ul className="lx-hero__usp lx-intro" style={{ '--d': '660ms' }}>
                {HERO_USP.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="lx-hero__actions lx-intro" style={{ '--d': '760ms' }}>
                <button type="button" className="lx-btn lx-btn--primary" onClick={() => navigate(portalPath)}>
                  Member Portal
                  <ChevronRight size={17} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="lx-btn lx-btn--ghost"
                  onClick={() => navigate(isAuthed && isAdmin ? '/admin/dashboard' : '/login')}
                >
                  Admin Portal
                </button>

                <button type="button" className="lx-btn lx-btn--link" onClick={() => goToSection('plans')}>
                  View Plans
                </button>
              </div>

              <div className="lx-hero__proof lx-intro" style={{ '--d': '860ms' }}>
                <div className="lx-hero__avatars" aria-hidden="true">
                  {MEMBER_COLORS.map((color, index) => (
                    <span
                      key={color}
                      className="lx-hero__avatar"
                      style={{ backgroundColor: color, '--d': `${900 + index * 80}ms` }}
                    />
                  ))}
                  <span className="lx-hero__avatar lx-hero__avatar--count" style={{ '--d': '1220ms' }}>
                    500+
                  </span>
                </div>

                <p className="lx-hero__proofText">
                  Trusted by <strong>500+ families</strong>
                </p>

                <span className="lx-hero__proofRule" aria-hidden="true" />
                <p className="lx-hero__proofStat">
                  <strong>₹50 Cr+</strong>
                  pooled
                </p>

                <span className="lx-hero__proofRule" aria-hidden="true" />
                <p className="lx-hero__proofStat">
                  <strong>100%</strong>
                  on-time payouts
                </p>
              </div>
            </div>

            <div className="lx-hero__card">
              <div className="lx-hero__cardHead">
                <p className="lx-hero__cardTitle">
                  <Users size={14} aria-hidden="true" />
                  A typical group
                </p>
                <span className="lx-hero__cardRule" aria-hidden="true" />
              </div>

              <dl className="lx-hero__cardRows">
                {HERO_GROUP.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="lx-hero__cardFoot">One member receives the prize money each month.</p>
            </div>

            <div className="lx-hero__chapter">
              <p className="lx-eyebrow lx-eyebrow--gold">Chapter 01 · Since 1999</p>
              <h2 className="lx-hero__chapterTitle">
                Twenty-five years.
                <br />
                One promise.
              </h2>
              <p className="lx-hero__chapterText">
                Your savings, protected by transparency and grown through community — month after month.
              </p>
              <dl className="lx-hero__mini">
                <div>
                  <dt>500+</dt>
                  <dd>Active Members</dd>
                </div>
                <div>
                  <dt>₹50Cr+</dt>
                  <dd>Funds Managed</dd>
                </div>
                <div>
                  <dt>100%</dt>
                  <dd>Trust Score</dd>
                </div>
              </dl>
            </div>

            <div className="lx-hero__cue" aria-hidden="true">
              <span className="lx-hero__cueLine" />
              Scroll to explore
            </div>
          </div>
        </section>

        {/* ═══ Scene 02 — Manifesto: words light up as you read ═══ */}
        <section className="lx-manifesto" id="manifesto" data-scene="pin" data-chapter data-theme="light">
          <div className="lx-sticky lx-manifesto__sticky">
            <span className="lx-manifesto__ghost" aria-hidden="true">
              25
            </span>

            <div className="lx-manifesto__inner">
              <p className="lx-eyebrow">Our Manifesto</p>

              <p className="lx-manifesto__text" style={{ '--n': MANIFESTO_WORDS.length }}>
                {MANIFESTO_WORDS.map((word, index) => (
                  <Fragment key={`${word}-${index}`}>
                    <span
                      className={`lx-word${MANIFESTO_KEYS.has(word) ? ' is-key' : ''}`}
                      style={{ '--i': index }}
                    >
                      {word}
                    </span>{' '}
                  </Fragment>
                ))}
              </p>

              <p className="lx-manifesto__sign">
                <span aria-hidden="true" />
                GDK Chit Funds, since 1999
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Scene 03 — Our story: three chapters, one stage ═══ */}
        <section
          className="lx-story"
          id="about"
          data-scene="pin"
          data-steps="3"
          data-step="0"
          data-chapter
          data-theme="light"
        >
          <div className="lx-sticky lx-story__sticky">
            <div className="lx-story__media">
              {STORY.map((chapter, index) => (
                <figure className="lx-story__shot" data-index={index} key={chapter.title}>
                  <img
                    src={photoUrl(chapter.photo, 1000)}
                    srcSet={photoSet(chapter.photo, [600, 1000, 1400])}
                    sizes="(max-width: 1023px) 100vw, 46vw"
                    alt={chapter.alt}
                    width="1000"
                    height="1250"
                    decoding="async"
                    fetchPriority="low"
                  />
                </figure>
              ))}

              <div className="lx-story__badge">
                <span className="lx-story__badgeNum">25+</span>
                <span className="lx-story__badgeLabel">
                  Years of Trust
                  <em>Since 1999</em>
                </span>
              </div>
            </div>

            <div className="lx-story__copy">
              <div className="lx-story__counter" aria-hidden="true">
                <span className="lx-story__digits">
                  <span className="lx-story__digitCol">
                    <span>01</span>
                    <span>02</span>
                    <span>03</span>
                  </span>
                </span>
                <span className="lx-story__total">/ 03</span>
              </div>

              <div className="lx-story__items">
                {STORY.map((chapter, index) => (
                  <article className="lx-story__item" data-index={index} key={chapter.title}>
                    <p className="lx-eyebrow">{chapter.eyebrow}</p>
                    <h2 className="lx-display">{chapter.title}</h2>
                    <p className="lx-body">{chapter.body}</p>
                    <p className="lx-story__point">
                      <span aria-hidden="true">
                        <Check size={15} />
                      </span>
                      {chapter.point}
                    </p>
                  </article>
                ))}
              </div>

              <div className="lx-story__rail" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Scene 04 — The 20-month journey (horizontal) ═══ */}
        <section className="lx-journey" id="journey" data-scene="horizontal" data-chapter data-theme="dark">
          <div className="lx-sticky lx-journey__sticky" data-viewport>
            <div className="lx-journey__bg" aria-hidden="true">
              <img
                src={photoUrl(PHOTO.night, 1600)}
                srcSet={photoSet(PHOTO.night, [800, 1600, 2200])}
                sizes="100vw"
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>

            <header className="lx-journey__head">
              <div>
                <p className="lx-eyebrow lx-eyebrow--gold">How a Chit Works</p>
                <h2 className="lx-display lx-display--light">Your 20-Month Journey</h2>
              </div>

              <p className="lx-journey__month" aria-hidden="true">
                <span>Month</span>
                <strong data-scrub data-from="1" data-to="20" data-pad="2">
                  01
                </strong>
                <span>/ 20</span>
              </p>
            </header>

            <div className="lx-journey__track" data-track>
              {JOURNEY.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article className="lx-journey__panel" data-card key={step.title}>
                    <span className="lx-journey__num" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="lx-journey__content">
                      <span className="lx-journey__icon" aria-hidden="true">
                        <Icon size={22} />
                      </span>
                      <p className="lx-journey__when">{step.when}</p>
                      <h3 className="lx-journey__title">{step.title}</h3>
                      <p className="lx-journey__text">{step.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="lx-journey__ticks" aria-hidden="true">
              {Array.from({ length: 20 }, (_, index) => (
                <span key={index} style={{ '--i': index }} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Scene 05 — The numbers, annual-report style ═══ */}
        <section
          className="lx-stats"
          id="stats"
          data-scene="pin"
          data-steps="4"
          data-step="0"
          data-chapter
          data-theme="light"
        >
          <div className="lx-sticky lx-stats__sticky">
            <header className="lx-stats__head">
              <p className="lx-eyebrow">By the Numbers</p>
              <h2 className="lx-stats__title">Numbers That Tell the Story</h2>
            </header>

            <div className="lx-stats__stage">
              <div className="lx-stats__numbers">
                {STATS.map((stat, index) => (
                  <div className="lx-stats__item" data-index={index} key={stat.label}>
                    <span
                      className="lx-stats__value"
                      data-count={stat.value}
                      data-seg={index}
                      data-prefix={stat.prefix}
                      data-suffix={stat.suffix}
                    >
                      {`${stat.prefix}${stat.value}${stat.suffix}`}
                    </span>
                    <h3 className="lx-stats__label">{stat.label}</h3>
                    <p className="lx-stats__caption">{stat.caption}</p>
                  </div>
                ))}
              </div>

              <div className="lx-stats__viz" aria-hidden="true">
                <div className="lx-viz lx-viz--dots" data-index="0">
                  {Array.from({ length: 50 }, (_, index) => (
                    <span key={index} style={{ '--i': index }} />
                  ))}
                </div>

                <div className="lx-viz lx-viz--bars" data-index="1">
                  {BAR_HEIGHTS.map((height, index) => (
                    <span key={height} style={{ '--i': index, '--h': `${height}%` }} />
                  ))}
                </div>

                <div className="lx-viz lx-viz--ticks" data-index="2">
                  {Array.from({ length: 25 }, (_, index) => (
                    <span key={index} style={{ '--i': index }} />
                  ))}
                  <p className="lx-viz__center">
                    <strong>1999</strong>
                    <em>to today</em>
                  </p>
                </div>

                <div className="lx-viz lx-viz--ring" data-index="3">
                  <svg viewBox="0 0 200 200" focusable="false">
                    <circle className="lx-viz__track" cx="100" cy="100" r="80" />
                    <circle className="lx-viz__fill" cx="100" cy="100" r="80" />
                  </svg>
                  <ShieldCheck className="lx-viz__shield" size={44} />
                </div>
              </div>
            </div>

            <div className="lx-stats__tabs" aria-hidden="true">
              {STATS.map((stat, index) => (
                <div className="lx-stats__tab" data-index={index} style={{ '--k': index }} key={stat.label}>
                  <span className="lx-stats__tabBar">
                    <i />
                  </span>
                  <span className="lx-stats__tabLabel">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Scene 06 — Plans coverflow (horizontal) ═══ */}
        <section className="lx-plans" id="plans" data-scene="horizontal" data-chapter data-theme="light">
          <div className="lx-sticky lx-plans__sticky" data-viewport>
            <header className="lx-plans__head">
              <div>
                <p className="lx-eyebrow">Investment Plans</p>
                <h2 className="lx-display">Find the Right Plan for Your Financial Goals</h2>
              </div>
              <p className="lx-body">Flexible chit fund plans designed to support your financial ambitions.</p>
            </header>

            <div className="lx-plans__track" data-track>
              {PLANS.map((plan) => (
                <article className="lx-plan" data-card key={plan.id} onClick={() => navigate('/login')}>
                  <div className="lx-plan__top">
                    <span className="lx-plan__badge">{plan.badge}</span>
                    <span className="lx-plan__id" aria-hidden="true">
                      {String(plan.id).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="lx-plan__name">{plan.name}</h3>
                  <p className="lx-plan__total">{plan.total}</p>
                  <p className="lx-plan__totalLabel">Total Chit Value</p>

                  <dl className="lx-plan__rows">
                    <div className="lx-plan__row">
                      <dt>Monthly Contribution</dt>
                      <dd>
                        {plan.monthly}
                        <em>/month</em>
                      </dd>
                    </div>
                    <div className="lx-plan__row">
                      <dt>Duration</dt>
                      <dd>{plan.duration}</dd>
                    </div>
                    <div className="lx-plan__row lx-plan__row--accent">
                      <dt>Expected Return</dt>
                      <dd>{plan.returnAmount}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    className="lx-btn lx-btn--primary lx-plan__cta"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate('/login');
                    }}
                  >
                    Invest Now
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            <div className="lx-plans__progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </section>

        {/* ═══ Scene 07 — Features: cards stack over each other ═══ */}
        <section className="lx-features" id="features" data-scene="stack" data-chapter data-theme="light">
          <header className="lx-features__head">
            <p className="lx-eyebrow lx-reveal">Why GDK Chit Funds</p>
            <h2 className="lx-display lx-reveal" style={{ '--i': 1 }}>
              Everything You Need.
              <br />
              Nothing Hidden.
            </h2>
          </header>

          <div className="lx-features__stack">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <article
                  className="lx-fcard"
                  data-card
                  data-tone={feature.tone}
                  style={{ '--i': index }}
                  key={feature.title}
                >
                  <div className="lx-fcard__inner">
                    <div className="lx-fcard__main">
                      <span className="lx-fcard__num" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="lx-fcard__icon" aria-hidden="true">
                        <Icon size={24} />
                      </span>
                      <h3 className="lx-fcard__title">{feature.title}</h3>
                      <p className="lx-fcard__desc">{feature.description}</p>
                    </div>

                    <ul className="lx-fcard__points">
                      {feature.points.map((point) => (
                        <li key={point}>
                          <Check size={16} aria-hidden="true" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ═══ Scene 08 — Values marquee ═══ */}
        <section className="lx-marquee" data-scene="pass" data-theme="light" aria-hidden="true">
          {[0, 1].map((row) => (
            <div className={`lx-marquee__row${row ? ' lx-marquee__row--reverse' : ''}`} key={row}>
              {Array.from({ length: 3 }, (_, copy) =>
                MARQUEE.map((word) => (
                  <span className="lx-marquee__word" key={`${copy}-${word}`}>
                    {word}
                    <i />
                  </span>
                ))
              )}
            </div>
          ))}
        </section>

        {/* ═══ Scene 08b — Testimonials: member voices ═══ */}
        <section className="lx-testimonials" id="testimonials" data-chapter data-theme="light">
          <header className="lx-testimonials__head">
            <p className="lx-eyebrow lx-reveal">What Our Members Say</p>
            <h2 className="lx-display lx-reveal" style={{ '--i': 1 }}>
              Voices of Trust
            </h2>
            <p className="lx-body lx-reveal" style={{ '--i': 2 }}>
              Real stories from real members who have experienced the GDK promise firsthand.
            </p>
          </header>

          <div className="lx-testimonials__grid">
            {TESTIMONIALS.map((t, index) => (
              <article
                className="lx-testimonial lx-reveal"
                style={{ '--i': index % 3 }}
                key={t.name}
              >
                <div className="lx-testimonial__stars" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }, (_, i) => (
                    <Star key={i} size={14} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="lx-testimonial__text">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <footer className="lx-testimonial__author">
                  <span className="lx-testimonial__avatar" aria-hidden="true">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <cite className="lx-testimonial__name">{t.name}</cite>
                    <p className="lx-testimonial__role">
                      {t.role} · {t.location}
                    </p>
                    <p className="lx-testimonial__years">
                      <Clock size={12} aria-hidden="true" />
                      {t.years}
                    </p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>

        {/* ═══ Scene 08c — Timeline: our milestones ═══ */}
        <section className="lx-timeline" data-theme="dark">
          <div className="lx-timeline__inner">
            <header className="lx-timeline__head">
              <p className="lx-eyebrow lx-eyebrow--gold lx-reveal">Our Journey</p>
              <h2 className="lx-display lx-display--light lx-reveal" style={{ '--i': 1 }}>
                25 Years of Milestones
              </h2>
            </header>

            <div className="lx-timeline__track">
              <span className="lx-timeline__line" aria-hidden="true" />
              {MILESTONES.map((m, index) => (
                <div
                  className="lx-timeline__item lx-reveal"
                  style={{ '--i': index % 3 }}
                  key={m.year}
                >
                  <span className="lx-timeline__dot" aria-hidden="true" />
                  <span className="lx-timeline__year">{m.year}</span>
                  <h3 className="lx-timeline__event">{m.event}</h3>
                  <p className="lx-timeline__detail">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Scene 08d — FAQ section ═══ */}
        <section className="lx-faq" id="faq" data-chapter data-theme="light">
          <div className="lx-faq__inner">
            <header className="lx-faq__head">
              <p className="lx-eyebrow lx-reveal">Common Questions</p>
              <h2 className="lx-display lx-reveal" style={{ '--i': 1 }}>
                Everything You
                <br />
                Want to Know
              </h2>
            </header>

            <div className="lx-faq__list">
              {FAQ_ITEMS.map((item, index) => (
                <details className="lx-faq__item lx-reveal" style={{ '--i': index % 3 }} key={item.question}>
                  <summary className="lx-faq__question">
                    <span className="lx-faq__qnum" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{item.question}</span>
                    <ChevronRight className="lx-faq__chevron" size={18} aria-hidden="true" />
                  </summary>
                  <div className="lx-faq__answer">
                    <p>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Scene 08e — Contact / Office info ═══ */}
        <section className="lx-contact" id="contact" data-chapter data-theme="light">
          <div className="lx-contact__inner">
            <header className="lx-contact__head">
              <p className="lx-eyebrow lx-reveal">Get in Touch</p>
              <h2 className="lx-display lx-reveal" style={{ '--i': 1 }}>
                Visit Our Office
              </h2>
              <p className="lx-body lx-reveal" style={{ '--i': 2 }}>
                Come meet us in person. Our team is always ready to help you choose the right plan and answer all your questions.
              </p>
            </header>

            <div className="lx-contact__cards">
              <div className="lx-contact__card lx-reveal" style={{ '--i': 0 }}>
                <span className="lx-contact__icon" aria-hidden="true">
                  <MapPin size={22} />
                </span>
                <h3>Office Address</h3>
                <p>GDK Chit Funds, Sri Periyanayagi Amman Complex, Main Road, Tamil Nadu, India</p>
              </div>

              <div className="lx-contact__card lx-reveal" style={{ '--i': 1 }}>
                <span className="lx-contact__icon" aria-hidden="true">
                  <Phone size={22} />
                </span>
                <h3>Phone / WhatsApp</h3>
                <p>Call or message us for inquiries, plan details, and membership support.</p>
              </div>

              <div className="lx-contact__card lx-reveal" style={{ '--i': 2 }}>
                <span className="lx-contact__icon" aria-hidden="true">
                  <Clock size={22} />
                </span>
                <h3>Office Hours</h3>
                <p>Monday to Saturday: 9:00 AM – 6:00 PM<br />Sunday: Closed</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Scene 09 — Conversion: the circle closes ═══ */}
        <section
          className="lx-cta"
          id="start"
          data-scene="pin"
          data-steps="3"
          data-step="0"
          data-chapter
          data-theme="light"
          data-theme-after="dark"
          data-theme-at="0.52"
          data-theme-off="dark"
        >
          <div className="lx-sticky lx-cta__sticky">
            <div className="lx-cta__layer lx-cta__layer--base">
              <h2 className="lx-cta__title">
                Ready to Build
                <br />
                Your Wealth?
              </h2>
            </div>

            <div className="lx-cta__layer lx-cta__layer--reveal" aria-hidden="true">
              <span className="lx-cta__arc" />
              <span className="lx-cta__glow" />
              <p className="lx-cta__title">
                Ready to Build
                <br />
                Your Wealth?
              </p>
            </div>

            <div className="lx-cta__foot">
              <p className="lx-cta__sub">
                Take the next step towards a more secure financial future with GDK Chit Funds.
              </p>
              <button type="button" className="lx-btn lx-btn--gold lx-cta__button" onClick={() => navigate('/login')}>
                Start Investing Now
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="lx-footer" data-scene="enter" data-theme="dark">
        <div className="lx-footer__top">
          <div className="lx-footer__brand">
            <div className="lx-footer__brandRow">
              <span className="lx-brand__mark lx-brand__mark--gold" aria-hidden="true">
                G
              </span>
              <h3>GDK Chit Funds</h3>
            </div>
            <p className="lx-footer__desc">
              Empowering families through secure, transparent, and profitable financial solutions since 1999.
            </p>
          </div>

          <div className="lx-footer__cols">
            <div className="lx-footer__col">
              <h4>Company</h4>
              <button type="button" onClick={() => goToSection('about')}>
                About Us
              </button>
              <button type="button" onClick={() => goToSection('features')}>
                Why Us
              </button>
              <button type="button" onClick={() => goToSection('stats')}>
                Our Numbers
              </button>
            </div>

            <div className="lx-footer__col">
              <h4>Legal</h4>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Privacy Policy</a>
              <a href="#">RBI Guidelines</a>
            </div>
          </div>
        </div>

        <div className="lx-footer__mark" aria-hidden="true">
          <span>GDK Chit Funds</span>
        </div>

        <div className="lx-footer__bottom">
          <p className="lx-footer__copy">
            © {new Date().getFullYear()} GDK Chit Funds (ஸ்ரீ பெரியநாயகி அம்மன்). All rights reserved.
          </p>

          <div className="lx-footer__socials">
            <button type="button" className="lx-social" aria-label="Instagram">
              <Camera size={17} aria-hidden="true" />
            </button>
            <button type="button" className="lx-social" aria-label="YouTube">
              <Play size={17} aria-hidden="true" />
            </button>
            <button type="button" className="lx-social" aria-label="WhatsApp">
              <MessageCircle size={17} aria-hidden="true" />
            </button>
            <button type="button" className="lx-social lx-social--top" onClick={() => goToSection('top')}>
              Back to top
            </button>
          </div>
        </div>
      </footer>

      {/* ═══ Floating Smooth Scroll-to-Top ═══ */}
      <button
        type="button"
        className={`lx-scroll-top${showScrollTop ? ' is-visible' : ''}`}
        onClick={() => goToSection('top')}
        aria-label="Scroll back to top"
      >
        <ChevronUp size={20} aria-hidden="true" />
      </button>
    </div>
  );
};

export default Landing;
