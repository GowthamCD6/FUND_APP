import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Camera,
  Check,
  ChevronRight,
  ChevronUp,
  HandCoins,
  MessageCircle,
  Play,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useAuth } from '../../context/AuthContext.jsx';
import './Landing.css';

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
  { id: 'features', label: 'Features' },
];

const CHAPTERS = [
  { id: 'top', label: 'Intro' },
  { id: 'manifesto', label: 'Manifesto' },
  { id: 'about', label: 'Our Story' },
  { id: 'journey', label: 'The Journey' },
  { id: 'stats', label: 'Numbers' },
  { id: 'plans', label: 'Plans' },
  { id: 'features', label: 'Why Us' },
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
          scene.el.style.height = `${Math.round(vh + scene.maxShift)}px`;
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

    const updateScene = (scene) => {
      const { el } = scene;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) return;

      let progress;
      if (scene.mode === 'pass') {
        progress = clamp((vh - rect.top) / (vh + rect.height));
      } else if (scene.mode === 'enter') {
        progress = rect.height > 0 ? clamp((vh - rect.top) / rect.height) : 0;
      } else {
        const travel = rect.height - vh;
        progress = travel > 0 ? clamp(-rect.top / travel) : 0;
      }

      scene.progress = progress;
      el.style.setProperty('--p', progress.toFixed(4));

      if (scene.steps) {
        const raw = progress * scene.steps;
        const step = Math.min(scene.steps - 1, Math.floor(raw));
        el.style.setProperty('--s', clamp(raw - step).toFixed(4));
        if (step !== scene.step) {
          scene.step = step;
          el.dataset.step = String(step);
          el.style.setProperty('--step', String(step));
        }
      }

      if (scene.mode === 'horizontal' && scene.track) {
        const shift = progress * scene.maxShift;
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
        const value = Math.round(from + (to - from) * progress);
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

      if (motion) scenes.forEach(updateScene);

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
        lerp: 0.1,
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.6,
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

  const [loaded, setLoaded] = useState(() => {
    if (prefersReducedMotion()) return true;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gdk_landing_seen')) return true;
    return false;
  });
  const [loaderGone, setLoaderGone] = useState(() => {
    if (prefersReducedMotion()) return true;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gdk_landing_seen')) return true;
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
        lenisRef.current.scrollTo(0, { duration: 1.15 });
        return;
      }
      const target = document.getElementById(id);
      if (target) {
        lenisRef.current.scrollTo(target, { offset: -70, duration: 1.15 });
        return;
      }
    }
    scrollToSection(id);
  };

  const goToPortal = () => {
    setMenuOpen(false);
    navigate(portalPath);
  };

  /* ── Opening curtain: snappy, elegant 480ms entrance ── */
  useEffect(() => {
    if (loaded) return undefined;

    const duration = 480;
    let frame = null;
    let timer = null;
    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const t = clamp((now - start) / duration);
      const eased = easeOut(t);

      if (loaderCountRef.current) loaderCountRef.current.textContent = String(Math.round(eased * 100));
      if (loaderBarRef.current) loaderBarRef.current.style.transform = `scaleX(${eased.toFixed(3)})`;

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('gdk_landing_seen', 'true');
        }
        timer = setTimeout(() => setLoaded(true), 60);
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
      {/* ═══ Opening curtain ═══ */}
      {!loaderGone && (
        <div className="lx-loader" data-done={loaded} aria-hidden="true">
          <div className="lx-loader__inner">
            <p className="lx-loader__tamil">ஸ்ரீ பெரியநாயகி அம்மன் CHITFUNDS</p>
            <div className="lx-loader__row">
              <span className="lx-loader__brand">GDK</span>
              <span className="lx-loader__count">
                <span ref={loaderCountRef}>0</span>
                <em>%</em>
              </span>
            </div>
            <div className="lx-loader__bar">
              <span ref={loaderBarRef} />
            </div>
            <p className="lx-loader__caption">Trusted Financial Partner Since 1999</p>
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
