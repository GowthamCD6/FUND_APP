import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  DeviceEventEmitter,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from './usermanulesty';
import { useLanguage } from '../../../utils/LanguageContext';

const { width: W, height: H } = Dimensions.get('window');

export const USER_MANUAL_STORAGE_KEY = 'has_seen_user_manual_v1';

// ──────────────────────────────────────────────────────────
// Step definitions
// ──────────────────────────────────────────────────────────
// cutout = {x, y, w, h} — transparent rectangle in screen coords
// If cutout is null the step uses dynamic measurement via events
// waitForPress: true → user MUST press the actual element; no "Next" button shown
// ──────────────────────────────────────────────────────────
const isIOS = Platform.OS === 'ios';
const statusBarH = isIOS ? 47 : (StatusBar.currentHeight || 24);
const bottomBarY = H - (isIOS ? 85 : 80);

const STEPS = [
  {
    id: 'notif_bell',
    title: 'Notification Bell',
    icon: 'bell-ring',
    iconColor: '#F59E0B',
    description: 'Press the notification bell to see your real-time alerts, payment reminders, and admin announcements!',
    waitForPress: true,
    pressLabel: 'Tap the Bell',
    routeName: 'Home',
    homeScrollY: 0,
    cutout: { x: W - 55, y: statusBarH + 15, w: 45, h: 45 },
    isCircle: true,
    textPosition: 'below',
  },
  {
    id: 'notif_reading',
    title: 'Read Your Notifications',
    icon: 'email-open',
    iconColor: '#3B82F6',
    description: 'This is your notification center! Read all your alerts, payment updates, OTP requests, and admin messages right here.',
    waitForPress: false,
    routeName: 'Home',
    cutout: { x: W * 0.05, y: H * 0.1, w: W * 0.9, h: H * 0.6 },
    textPosition: 'below',
  },
  {
    id: 'notif_close',
    title: 'Close Notifications',
    icon: 'close-circle',
    iconColor: '#EF4444',
    description: 'Press the ✕ cross button to close the notification window and continue your tour!',
    waitForPress: true,
    pressLabel: 'Tap the ✕',
    routeName: 'Home',
    // cutout: dynamic based on NOTIF_CROSS_LAYOUT_MEASURED
    cutout: null,
    isCircle: true,
    textPosition: 'below',
  },
  {
    id: 'chit_plans',
    title: 'Popular Chit Plans',
    icon: 'format-list-bulleted-square',
    iconColor: '#6B46C1',
    description: 'Browse all chit investment plans here! Swipe through ₹1L, ₹2L, ₹3L, and ₹5L plans with transparent monthly installments.',
    waitForPress: false,
    routeName: 'Home',
    homeScrollY: 0,
    cutout: null, // filled dynamically via PLANS_LAYOUT_MEASURED
    textPosition: 'below',
  },
  {
    id: 'community',
    title: 'WhatsApp & Instagram',
    icon: 'account-group',
    iconColor: '#25D366',
    description: 'Join our WhatsApp community and follow us on Instagram for daily news, announcements, and scheme updates!',
    waitForPress: false,
    routeName: 'Home',
    homeScrollY: 1000,
    cutout: null, // filled dynamically via SOCIAL_LAYOUT_MEASURED
    textPosition: 'above',
  },
  {
    id: 'portfolio_press',
    title: 'Open Portfolio',
    icon: 'briefcase',
    iconColor: '#10B981',
    description: 'Press the Portfolio tab to open your personal savings & dividend ledger!',
    waitForPress: true,
    routeName: 'Home',
    homeScrollY: 0,
    cutout: null,
    textPosition: 'above',
    pointFromTop: true,
  },
  {
    id: 'portfolio_explain',
    title: 'Your Savings Portfolio',
    icon: 'briefcase',
    iconColor: '#10B981',
    description: 'Track all active chits, total saved amount, dividend profits, paid dues, and download your statements right here!',
    waitForPress: false,
    routeName: 'Portfolio',
    cutout: { x: 10, y: statusBarH + 10, w: W - 20, h: H * 0.5 },
    textPosition: 'below',
  },
  {
    id: 'plus_press',
    title: 'Quick Actions (+)',
    icon: 'plus-circle',
    iconColor: '#EC4899',
    description: 'Press this (+) button to open the 4 primary quick action options!',
    waitForPress: true,
    routeName: 'Home',
    homeScrollY: 0,
    cutout: null,
    isCircle: true,
    textPosition: 'above',
    pointFromTop: true,
  },
  {
    id: 'plus_join',
    title: 'Join the Group',
    icon: 'account-group',
    iconColor: '#EC4899',
    description: 'Enter a group code provided to join a new chit group instantly.',
    waitForPress: false,
    routeName: 'Home',
    cutout: null, // filled dynamically
    textPosition: 'above',
  },
  {
    id: 'plus_group_card',
    title: 'Group Card',
    icon: 'credit-card',
    iconColor: '#EC4899',
    description: 'View and confirm your payment details and upcoming dues.',
    waitForPress: false,
    routeName: 'Home',
    cutout: null,
    textPosition: 'above',
  },
  {
    id: 'plus_auction',
    title: 'Auction',
    icon: 'gavel',
    iconColor: '#EC4899',
    description: 'Participate in live chit auction bidding directly from here.',
    waitForPress: false,
    routeName: 'Home',
    cutout: null,
    textPosition: 'above',
  },
  {
    id: 'plus_finance',
    title: 'Finance',
    icon: 'cash-multiple',
    iconColor: '#EC4899',
    description: 'Contribute funds and earn extra interest on your savings.',
    waitForPress: false,
    routeName: 'Home',
    cutout: null,
    textPosition: 'above',
  },
  {
    id: 'plus_close',
    title: 'Close Options',
    icon: 'close-circle',
    iconColor: '#EC4899',
    description: 'Press the X button to close the quick actions menu.',
    waitForPress: true, // User must press X to close the modal
    routeName: 'Home',
    cutout: null,
    isCircle: true,
    textPosition: 'above',
  },
  {
    id: 'chat_tab',
    title: 'Direct Admin Chat',
    icon: 'message',
    iconColor: '#3B82F6',
    description: 'Use the Chat tab to communicate directly with chit fund administrators for instant assistance and document verification!',
    waitForPress: true,
    routeName: 'Home',
    cutout: null,
    textPosition: 'above',
    pointFromTop: true,
  },
  {
    id: 'chat_admin',
    title: 'Admin Support',
    icon: 'shield-account',
    iconColor: '#3B82F6',
    description: 'Tap here to chat with the official GDK Chit Funds Admin. Get instant support for your account!',
    waitForPress: false,
    routeName: 'Chat',
    cutout: { x: 10, y: statusBarH + 10, w: W - 20, h: H * 0.6 },
    textPosition: 'below',
  },
  {
    id: 'profile_nominee',
    title: 'Nominee Details',
    icon: 'account-outline',
    iconColor: '#8B5CF6',
    description: 'Add or update your nominee details to secure your investments for your family!',
    waitForPress: false,
    routeName: 'Profile',
    profileScrollY: 0,
    cutout: null,
    textPosition: 'below',
  },
  {
    id: 'profile_security',
    title: 'Security & Permissions',
    icon: 'shield-lock-outline',
    iconColor: '#F59E0B',
    description: 'Manage your app security settings and permissions from here.',
    waitForPress: false,
    routeName: 'Profile',
    profileScrollY: 180,
    cutout: null,
    textPosition: 'below',
  },
  {
    id: 'profile_language',
    title: 'Dual Language Support',
    icon: 'translate',
    iconColor: '#6B46C1',
    description: 'Switch between English and Tamil (தமிழ்) anytime from your profile settings!',
    waitForPress: false,
    routeName: 'Profile',
    profileScrollY: 360,
    cutout: null,
    textPosition: 'below',
  },
  {
    id: 'profile_location',
    title: 'Admin & Branch Locations',
    icon: 'map-marker-radius',
    iconColor: '#EF4444',
    description: 'View physical office addresses, GPS maps, and registered branch details of Periyanayagi Amman Chit Fund!',
    waitForPress: false,
    routeName: 'Profile',
    profileScrollY: 680,
    cutout: null,
    textPosition: 'below',
  },
  {
    id: 'tour_end',
    title: 'You\'re All Set! 🎉',
    icon: 'check-decagram',
    iconColor: '#10B981',
    description: 'You now know all the features of GDK Chit Funds! Start investing, track your portfolio, and grow your wealth!',
    waitForPress: false,
    routeName: 'Home',
    homeScrollY: 0,
    cutout: { x: 10, y: statusBarH + 10, w: W - 20, h: H * 0.65 },
    textPosition: 'below',
    isLast: true,
  },
];

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────
const UserManual = ({ visible = false, onClose = null, forceShow = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  // Dynamic cutout overrides from measured layouts
  const [dynamicCutouts, setDynamicCutouts] = useState({});

  // Animated values
  const handPos = useRef(new Animated.ValueXY({ x: W / 2, y: H })).current;
  const handOpacity = useRef(new Animated.Value(0)).current;
  const handBounce = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Ref for the next button to measure its position
  const nextButtonRef = useRef(null);
  const hasAnimatedToNextBtn = useRef(false);

  // ─── Get active cutout for current step ───
  const getCutout = useCallback((stepIdx) => {
    const step = STEPS[stepIdx];
    if (!step) return { x: 0, y: 0, w: W, h: H };
    
    // Use dynamically measured cutout if available
    if (dynamicCutouts[step.id]) {
      return dynamicCutouts[step.id];
    }
    
    return step.cutout || { x: W / 2, y: H / 2, w: 0, h: 0 };
  }, [dynamicCutouts, insets.bottom]);

  // ─── Typewriter effect ───
  useEffect(() => {
    const step = STEPS[currentStep];
    if (!step || !isVisible) return;

    let fullText = t(step.description) || '';
    // Special override when notification modal is open during step 1
    if (step.id === 'notif_reading' && isNotifModalOpen) {
      fullText = t('Great! You opened the notification center. Read your alerts, payment reminders, and OTP requests here!');
    }

    setDisplayedText('');
    let currentLength = 0;

    const timer = setInterval(() => {
      currentLength++;
      setDisplayedText(fullText.slice(0, currentLength));
      if (currentLength >= fullText.length) {
        clearInterval(timer);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [currentStep, isVisible, isNotifModalOpen]);

  // Reset tracking ref on step change
  useEffect(() => {
    hasAnimatedToNextBtn.current = false;
  }, [currentStep]);

  // ─── Animate hand from bottom/top to cutout center ───
  const animateHandTo = useCallback((cutout, shouldBounce = true, pointFromTop = false) => {
    const targetX = cutout.x + cutout.w / 2 - 18;
    // Position the hand above the cutout if pointFromTop is true
    const targetY = pointFromTop ? cutout.y - 45 : cutout.y + cutout.h + 5;

    handOpacity.setValue(1);
    handBounce.setValue(0);

    Animated.sequence([
      // Fly up from bottom to target
      Animated.spring(handPos, {
        toValue: { x: targetX, y: targetY },
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
      // Bounce/tap animation (loop if waitForPress)
      ]).start(() => {
      if (shouldBounce) {
        startBounceLoop(pointFromTop);
      }
    });
  }, [handPos, handOpacity, handBounce]);

  const bounceLoopRef = useRef(null);

  const startBounceLoop = useCallback((pointFromTop = false) => {
    stopBounceLoop();
    bounceLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(handBounce, {
          toValue: pointFromTop ? 12 : -12,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(handBounce, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    bounceLoopRef.current.start();
  }, [handBounce]);

  const stopBounceLoop = useCallback(() => {
    if (bounceLoopRef.current) {
      bounceLoopRef.current.stop();
      bounceLoopRef.current = null;
    }
  }, []);

  // ─── Hide hand ───
  const hideHand = useCallback(() => {
    stopBounceLoop();
    Animated.timing(handOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [handOpacity, stopBounceLoop]);

  // ─── Navigate to a step ───
  const goToStep = useCallback((stepIdx) => {
    const step = STEPS[stepIdx];
    if (!step) return;

    setCurrentStep(stepIdx);

    // Hide hand initially for dynamic cutouts or Next button tracking steps
    // This ensures synchronous layout events can safely call animateHandTo without being overwritten
    if (!step.waitForPress || !step.cutout) {
      hideHand();
    }

    // Emit step change
    DeviceEventEmitter.emit('USER_MANUAL_STEP_CHANGED', {
      stepIndex: stepIdx,
      stepId: step.id,
    });

    // Navigate to correct tab via event to bypass nested navigator errors
    if (step.routeName) {
      DeviceEventEmitter.emit('SWITCH_TAB', step.routeName);
    }

    // Scroll if needed
    if (step.routeName === 'Home' && step.homeScrollY !== undefined) {
      if (step.id === 'community') {
        DeviceEventEmitter.emit('SCROLL_TO_SOCIAL');
      } else {
        DeviceEventEmitter.emit('SCROLL_HOME', step.homeScrollY);
      }
    } else if (step.routeName === 'Profile' && step.profileScrollY !== undefined) {
      DeviceEventEmitter.emit('SCROLL_PROFILE', step.profileScrollY);
    }

    // Request layout measurements for dynamic steps
    if (step.id === 'notif_bell') {
      DeviceEventEmitter.emit('REQUEST_NOTIF_LAYOUT');
    } else if (step.id === 'notif_reading') {
      DeviceEventEmitter.emit('REQUEST_NOTIF_MODAL_LAYOUT');
    } else if (step.id === 'notif_close') {
      DeviceEventEmitter.emit('REQUEST_NOTIF_CROSS_LAYOUT');
    } else if (step.id === 'chit_plans') {
      DeviceEventEmitter.emit('REQUEST_PLANS_LAYOUT');
    } else if (step.id === 'community') {
      setTimeout(() => DeviceEventEmitter.emit('REQUEST_SOCIAL_LAYOUT'), 400);
    } else if (['plus_join', 'plus_group_card', 'plus_auction', 'plus_finance'].includes(step.id)) {
      DeviceEventEmitter.emit('REQUEST_MORE_LAYOUT');
    } else if (['portfolio_press', 'plus_press', 'chat_tab'].includes(step.id)) {
      DeviceEventEmitter.emit('REQUEST_TAB_LAYOUT');
    } else if (['profile_nominee', 'profile_security', 'profile_language', 'profile_location'].includes(step.id)) {
      setTimeout(() => DeviceEventEmitter.emit('REQUEST_PROFILE_LAYOUT'), 400);
    }

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate hand after a short delay (to allow navigation)
    // Only animate here if it's a STATIC cutout and we are not tracking the Next button.
    if (step.waitForPress && step.cutout) {
      setTimeout(() => {
        animateHandTo(step.cutout, true, step.pointFromTop);
      }, 400);
    }
  }, [STEPS, navigation, fadeAnim, getCutout, animateHandTo, hideHand]);

  // ─── Handle "Next Step" button ───
  const handleNext = useCallback(() => {
    const step = STEPS[currentStep];

    // If we're at notif_reading, don't advance — wait for user to close notifs
    if (step?.id === 'notif_reading') {
      // Advance to notif_close which waits for the cross press
      goToStep(currentStep + 1);
      return;
    }

    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, goToStep]);

  // ─── Handle completion ───
  const handleComplete = useCallback(async () => {
    DeviceEventEmitter.emit('USER_MANUAL_STEP_CHANGED', { stepIndex: -1, stepId: null });
    stopBounceLoop();

    try {
      await AsyncStorage.setItem(USER_MANUAL_STORAGE_KEY, 'true');
    } catch (err) {
      console.error('Error saving manual completion:', err);
    }

    // Reset scrolls & navigate home
    DeviceEventEmitter.emit('SCROLL_HOME', 0);
    DeviceEventEmitter.emit('SCROLL_PROFILE', 0);

    DeviceEventEmitter.emit('SWITCH_TAB', 'Home');

    setIsVisible(false);
    if (onClose) onClose();
  }, [navigation, onClose, stopBounceLoop]);

  // ─── Listen for notification events ───
  useEffect(() => {
    const notifOpenSub = DeviceEventEmitter.addListener('OPEN_NOTIFICATIONS', () => {
      setIsNotifModalOpen(true);
    });

    const notifCloseSub = DeviceEventEmitter.addListener('NOTIFICATIONS_CLOSED', () => {
      setIsNotifModalOpen(false);
      // If on notif_close step, advance to next
      if (STEPS[currentStep]?.id === 'notif_close') {
        setTimeout(() => goToStep(currentStep + 1), 300);
      }
    });

    return () => {
      notifOpenSub.remove();
      notifCloseSub.remove();
    };
  }, [currentStep, goToStep]);

  // ─── Listen for More modal events ───
  useEffect(() => {
    const moreSub = DeviceEventEmitter.addListener('MORE_MODAL_CLOSED', () => {
      setIsMoreModalOpen(false);
      // If on plus_close step, advance
      if (STEPS[currentStep]?.id === 'plus_close') {
        setTimeout(() => goToStep(currentStep + 1), 300);
      }
    });

    const moreOpenSub = DeviceEventEmitter.addListener('OPEN_MORE_MODAL', () => {
      setIsMoreModalOpen(true);
    });

    return () => {
      moreSub.remove();
      moreOpenSub.remove();
    };
  }, [currentStep, goToStep]);

  // ─── Listen for dynamic layout measurements ───
  useEffect(() => {
    const yOffset = Platform.OS === 'android' ? statusBarH : 0;

    const notifSub = DeviceEventEmitter.addListener('NOTIF_LAYOUT_MEASURED', ({ x, y, width: bw, height: bh }) => {
      const padding = 6;
      const cutout = {
        x: x - padding,
        y: y + yOffset - padding,
        w: bw + padding * 2,
        h: bh + padding * 2,
      };
      setDynamicCutouts(prev => ({ ...prev, notif_bell: cutout }));

      // If currently on step 0, re-animate hand
      if (STEPS[currentStep]?.id === 'notif_bell' && isVisible) {
        animateHandTo(cutout, true);
      }
    });

    const notifCrossSub = DeviceEventEmitter.addListener('NOTIF_CROSS_LAYOUT_MEASURED', ({ x, y, width: cw, height: ch }) => {
      const cutout = { x: x - 10, y: y + yOffset - 10, w: cw + 20, h: ch + 20 };
      setDynamicCutouts(prev => ({ ...prev, notif_close: cutout }));
    });

    const notifModalSub = DeviceEventEmitter.addListener('NOTIF_MODAL_MEASURED', ({ x, y, width: mw, height: mh }) => {
      // Add a slight padding around the modal for the glowing border
      const cutout = { x: x - 4, y: y + yOffset - 4, w: mw + 8, h: mh + 8 };
      setDynamicCutouts(prev => ({ ...prev, notif_reading: cutout }));
    });

    const plansSub = DeviceEventEmitter.addListener('PLANS_LAYOUT_MEASURED', ({ x, y, width: pw, height: ph }) => {
      const cutout = { x: 0, y: y + yOffset, w: W, h: Math.min(ph, H * 0.35) };
      setDynamicCutouts(prev => ({ ...prev, chit_plans: cutout }));
    });

    const socialSub = DeviceEventEmitter.addListener('SOCIAL_LAYOUT_MEASURED', ({ x, y, width: sw, height: sh }) => {
      // Allow full height to cover both WhatsApp and Instagram completely
      const cutout = { x: 5, y: y + yOffset, w: W - 10, h: sh + 5 };
      setDynamicCutouts(prev => ({ ...prev, community: cutout }));

      const step = STEPS[currentStep];
      if (step?.id === 'community' && step.waitForPress) {
        animateHandTo(cutout, true, step.pointFromTop);
      }
    });

    const moreLayoutSub = DeviceEventEmitter.addListener('MORE_LAYOUT_MEASURED', (layouts) => {
      const cutouts = {};
      if (layouts.plus_join) cutouts.plus_join = { x: layouts.plus_join.x, y: layouts.plus_join.y + yOffset, w: layouts.plus_join.width, h: layouts.plus_join.height };
      if (layouts.plus_group_card) cutouts.plus_group_card = { x: layouts.plus_group_card.x, y: layouts.plus_group_card.y + yOffset, w: layouts.plus_group_card.width, h: layouts.plus_group_card.height };
      if (layouts.plus_auction) cutouts.plus_auction = { x: layouts.plus_auction.x, y: layouts.plus_auction.y + yOffset, w: layouts.plus_auction.width, h: layouts.plus_auction.height };
      if (layouts.plus_finance) cutouts.plus_finance = { x: layouts.plus_finance.x, y: layouts.plus_finance.y + yOffset, w: layouts.plus_finance.width, h: layouts.plus_finance.height };
      if (layouts.plus_close) cutouts.plus_close = { x: layouts.plus_close.x - 5, y: layouts.plus_close.y + yOffset - 5, w: layouts.plus_close.width + 10, h: layouts.plus_close.height + 10 };
      setDynamicCutouts(prev => ({ ...prev, ...cutouts }));

      const step = STEPS[currentStep];
      if (['plus_join', 'plus_group_card', 'plus_auction', 'plus_finance', 'plus_close'].includes(step?.id) && cutouts[step.id] && step.waitForPress) {
        animateHandTo(cutouts[step.id], true, step.pointFromTop);
      }
    });

    const profileLayoutSub = DeviceEventEmitter.addListener('PROFILE_LAYOUT_MEASURED', (layouts) => {
      const cutouts = {};
      if (layouts.profile_nominee) cutouts.profile_nominee = { x: layouts.profile_nominee.x, y: layouts.profile_nominee.y + yOffset, w: layouts.profile_nominee.width, h: layouts.profile_nominee.height };
      if (layouts.profile_security) cutouts.profile_security = { x: layouts.profile_security.x, y: layouts.profile_security.y + yOffset, w: layouts.profile_security.width, h: layouts.profile_security.height };
      if (layouts.profile_language) cutouts.profile_language = { x: layouts.profile_language.x, y: layouts.profile_language.y + yOffset, w: layouts.profile_language.width, h: layouts.profile_language.height };
      if (layouts.profile_location) cutouts.profile_location = { x: layouts.profile_location.x, y: layouts.profile_location.y + yOffset, w: layouts.profile_location.width, h: layouts.profile_location.height };
      setDynamicCutouts(prev => ({ ...prev, ...cutouts }));

      const step = STEPS[currentStep];
      if (['profile_nominee', 'profile_security', 'profile_language', 'profile_location'].includes(step?.id) && cutouts[step.id] && step.waitForPress) {
        animateHandTo(cutouts[step.id], true, step.pointFromTop);
      }
    });

    const tabLayoutSub = DeviceEventEmitter.addListener('TAB_LAYOUT_MEASURED', (layouts) => {
      const cutouts = {};
      const padding = 10;
      if (layouts.portfolio_press) cutouts.portfolio_press = { x: layouts.portfolio_press.x - padding, y: layouts.portfolio_press.y + yOffset - padding, w: layouts.portfolio_press.width + padding * 2, h: layouts.portfolio_press.height + padding * 2 };
      if (layouts.plus_press) cutouts.plus_press = { x: layouts.plus_press.x - padding, y: layouts.plus_press.y + yOffset - padding, w: layouts.plus_press.width + padding * 2, h: layouts.plus_press.height + padding * 2 };
      if (layouts.chat_tab) cutouts.chat_tab = { x: layouts.chat_tab.x - padding, y: layouts.chat_tab.y + yOffset - padding, w: layouts.chat_tab.width + padding * 2, h: layouts.chat_tab.height + padding * 2 };
      setDynamicCutouts(prev => ({ ...prev, ...cutouts }));

      const currentId = STEPS[currentStep]?.id;
      if (['portfolio_press', 'plus_press', 'chat_tab'].includes(currentId) && cutouts[currentId] && STEPS[currentStep]?.waitForPress) {
        animateHandTo(cutouts[currentId], true, STEPS[currentStep].pointFromTop);
      }
    });



    return () => {
      notifSub.remove();
      notifCrossSub.remove();
      notifModalSub.remove();
      plansSub.remove();
      socialSub.remove();
      moreLayoutSub.remove();
      profileLayoutSub.remove();
      tabLayoutSub.remove();
    };
  }, [currentStep, isVisible, animateHandTo]);

  // ─── Listen for tab navigation events (portfolio_press, plus_press) ───
  useEffect(() => {
    const tabPressSub = DeviceEventEmitter.addListener('TAB_PRESSED_DURING_TOUR', ({ tabName }) => {
      const step = STEPS[currentStep];
      if (step?.id === 'portfolio_press' && tabName === 'Portfolio') {
        setTimeout(() => goToStep(currentStep + 1), 300);
      }
    });

    return () => tabPressSub.remove();
  }, [currentStep, goToStep]);

  // ─── Handle spotlight area press (for waitForPress steps) ───
  const isAdvancingRef = useRef(false);
  const handleCutoutPress = useCallback(() => {
    if (isAdvancingRef.current) return;
    const step = STEPS[currentStep];
    if (!step?.waitForPress) return;

    isAdvancingRef.current = true;
    setTimeout(() => { isAdvancingRef.current = false; }, 800);

    if (step.id === 'notif_bell') {
      DeviceEventEmitter.emit('OPEN_NOTIFICATIONS');
      hideHand();
      // Temporarily hide tour so the Notification Modal mounts underneath it,
      // then remount tour 500ms later so it appears ON TOP of the Notification Modal.
      setIsVisible(false);
      setTimeout(() => {
        setIsVisible(true);
        goToStep(currentStep + 1);
      }, 500);
    } else if (step.id === 'notif_close') {
      // The user should press the actual ✕ on the notification modal
      // This is handled by NOTIFICATIONS_CLOSED event
      DeviceEventEmitter.emit('CLOSE_NOTIFICATIONS_TOUR');
    } else if (step.id === 'portfolio_press') {
      hideHand();
      DeviceEventEmitter.emit('SWITCH_TAB', 'Portfolio');
      setTimeout(() => goToStep(currentStep + 1), 400);
    } else if (step.id === 'plus_press') {
      hideHand();
      DeviceEventEmitter.emit('OPEN_MORE_MODAL');
      // Temporarily hide tour so the More Modal mounts underneath it
      setIsVisible(false);
      setTimeout(() => {
        setIsVisible(true);
        goToStep(currentStep + 1);
      }, 500);
    } else if (step.id === 'plus_close') {
      hideHand();
      DeviceEventEmitter.emit('CLOSE_MORE_MODAL');
      setTimeout(() => goToStep(currentStep + 1), 300);
    } else if (step.id === 'chat_tab') {
      hideHand();
      DeviceEventEmitter.emit('SWITCH_TAB', 'Chat');
      setTimeout(() => goToStep(currentStep + 1), 400);
    }
  }, [currentStep, goToStep, hideHand, navigation]);

  // ─── Initialization ───
  useEffect(() => {
    const checkStatus = async () => {
      if (forceShow || visible) {
        setIsVisible(true);
        setCurrentStep(0);
        setTimeout(() => goToStep(0), 200);
        return;
      }
      setIsVisible(false);
    };

    checkStatus();
  }, [forceShow, visible]);

  // Cleanup
  useEffect(() => {
    return () => stopBounceLoop();
  }, [stopBounceLoop]);

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const cutout = getCutout(currentStep);
  const isLast = step?.isLast || currentStep === STEPS.length - 1;
  const showNextButton = !step?.waitForPress;

  // Calculate text position
  const textTop = step?.textPosition === 'above'
    ? Math.max(cutout.y - 180, 30)
    : cutout.y + cutout.h + 16;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleComplete}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.rootOverlay}>
        {/* ─── SVG DIM OVERLAY (True circular and rounded holes) ─── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Mask id="cutout-mask">
                <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                {step?.isCircle ? (
                  <Rect
                    x={cutout.x + cutout.w / 2 - Math.max(cutout.w, cutout.h) / 2}
                    y={cutout.y + cutout.h / 2 - Math.max(cutout.w, cutout.h) / 2}
                    width={Math.max(cutout.w, cutout.h)}
                    height={Math.max(cutout.w, cutout.h)}
                    rx={Math.max(cutout.w, cutout.h) / 2}
                    fill="black"
                  />
                ) : (
                  <Rect
                    x={cutout.x}
                    y={cutout.y}
                    width={cutout.w}
                    height={cutout.h}
                    rx={16}
                    fill="black"
                  />
                )}
              </Mask>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.78)"
              mask="url(#cutout-mask)"
            />
          </Svg>
        </View>

        {/* ─── CUTOUT BORDER (glowing frame) ─── */}
        <View
          style={[styles.cutoutWindow, {
            width: step?.isCircle ? Math.max(cutout.w, cutout.h) + 5 : cutout.w + 5,
            height: step?.isCircle ? Math.max(cutout.w, cutout.h) + 5 : cutout.h + 5,
            left: step?.isCircle ? cutout.x + cutout.w / 2 - Math.max(cutout.w, cutout.h) / 2 - 2.5 : cutout.x - 2.5,
            top: step?.isCircle ? cutout.y + cutout.h / 2 - Math.max(cutout.w, cutout.h) / 2 - 2.5 : cutout.y - 2.5,
            borderRadius: step?.isCircle ? 999 : 16,
          }]}
        />

        {/* ─── TOUCH AREA over cutout (for waitForPress steps) ─── */}
        {step?.waitForPress && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCutoutPress}
            style={{
              position: 'absolute',
              left: cutout.x,
              top: cutout.y,
              width: cutout.w,
              height: cutout.h,
              zIndex: 10010,
              backgroundColor: 'transparent',
            }}
          />
        )}

        {/* ─── ANIMATED HAND POINTER ─── */}
        <Animated.View
          style={[
            styles.handContainer,
            {
              opacity: handOpacity,
              transform: [
                { translateX: handPos.x },
                { translateY: Animated.add(handPos.y, handBounce) },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <MaterialCommunityIcons
            name={STEPS[currentStep]?.pointFromTop ? "hand-pointing-down" : "hand-pointing-up"}
            size={40}
            color="#FFFFFF"
          />
        </Animated.View>



        {/* ─── TEXT CONTENT (typewriter) ─── */}
        <TouchableWithoutFeedback onPress={showNextButton ? handleNext : undefined}>
          <View
            style={[
              styles.textContainer,
              { top: textTop },
            ]}
            onLayout={() => {
              if (!STEPS[currentStep]?.waitForPress && nextButtonRef.current) {
                setTimeout(() => {
                  if (nextButtonRef.current) {
                    nextButtonRef.current.measureInWindow((x, y, width, height) => {
                      if (typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number') {
                        if (!hasAnimatedToNextBtn.current) {
                          hasAnimatedToNextBtn.current = true;
                          animateHandTo({ x, y, w: width, h: height }, true, false);
                        } else {
                          const targetX = x + width / 2 - 18;
                          const targetY = y + height + 5;
                          if (!isNaN(targetX) && !isNaN(targetY)) {
                            Animated.spring(handPos, {
                              toValue: { x: targetX, y: targetY },
                              tension: 30,
                              friction: 8,
                              useNativeDriver: true,
                            }).start();
                          }
                        }
                      }
                    });
                  }
                }, 50);
              }
            }}
          >
            {/* Title Row */}
            <View style={styles.titleRow}>
              <View style={[styles.titleIconCircle, { backgroundColor: step?.iconColor || '#6B46C1' }]}>
                <MaterialCommunityIcons
                  name={step?.icon || 'information'}
                  size={18}
                  color="#FFFFFF"
                />
              </View>
              <Text style={[styles.titleText, language === 'ta' && { fontSize: 16 }]}>{step?.title ? t(step.title) : ''}</Text>
            </View>

            {/* Description with typewriter cursor */}
            <Text style={[styles.descriptionText, language === 'ta' && { fontSize: 13, lineHeight: 20 }]}>
              {displayedText}
              {displayedText.length < (step?.description ? (t(step.description)?.length || 0) : 0) && (
                <Text style={styles.typewriterCursor}>|</Text>
              )}
            </Text>

            {/* Footer: dots + next button */}
            <View style={styles.footerRow}>
              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                {STEPS.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === currentStep
                        ? styles.activeDot
                        : idx < currentStep
                          ? styles.completedDot
                          : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>

              {/* Next / Explore App Button */}
              {showNextButton && (
                <View ref={nextButtonRef} collapsable={false} style={{ alignSelf: 'flex-start' }}>
                  <TouchableOpacity
                    style={[
                      styles.nextButton,
                      { backgroundColor: step?.iconColor || '#6B46C1' },
                    ]}
                    onPress={isLast ? handleComplete : handleNext}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.nextButtonText, language === 'ta' && { fontSize: 13 }]}>
                      {isLast ? t('Explore App') : t('Next Step')}
                    </Text>
                    <MaterialCommunityIcons
                      name={isLast ? 'check' : 'arrow-right'}
                      size={16}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

export default UserManual;
