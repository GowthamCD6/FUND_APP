import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Linking,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, RadialGradient as SvgRadialGradient, Stop, Rect, Path } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ChitPlans from '../Home/Chit Plans/ChitPlans';
import ApiService from '../../../../services/ApiService';
import styles from './Homesty';
import { useLanguage } from '../../../../utils/LanguageContext';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 0);

const iconMap = {
  'bell-outline': 'bell-outline',
  percent: 'percent-outline',
  'shield-check': 'shield-check',
  'arrow-right': 'arrow-right',
  'account-group': 'account-group',
  'currency-inr': 'currency-inr',
  'calendar-check': 'calendar-check',
  'star-circle': 'star-circle-outline',
  gavel: 'gavel',
  'cash-check': 'cash-check',
  'cellphone-check': 'cellphone-check',
  close: 'close',
  'bell-sleep': 'bell-sleep',
  'alert-circle': 'alert-circle-outline',
  'clock-alert': 'clock-alert-outline',
  'badge-check': 'check-decagram-outline',
  'map-pin': 'map-marker',
  fingerprint: 'fingerprint',
  'credit-card': 'credit-card-outline',
  languages: 'translate',
  'check-circle': 'check-circle',
  'check-all': 'check-all',
  'trash-can-outline': 'trash-can-outline',
  check: 'check',
};

const Icon = ({ name, size = 16, color = '#000' }) => {
  const iconName = iconMap[name] || 'check-decagram-outline';

  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

const WhatsappIcon = ({ size = 28, color = '#25D366' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.762.455 3.42 1.257 4.872L2 22l5.244-1.222A9.957 9.957 0 0012.004 22C17.528 22 22 17.528 22 12.004 22 6.48 17.528 2 12.004 2z"
      fill={color}
    />
    <Path
      d="M16.924 14.184c-.27-.136-1.597-.79-1.844-.88-.248-.09-.43-.136-.61.136-.18.27-.7.88-.86 1.06-.157.18-.315.203-.585.068a7.378 7.378 0 01-2.176-1.344 8.136 8.136 0 01-1.508-1.879c-.157-.27-.015-.417.12-.552.124-.12.27-.315.405-.473.136-.157.18-.27.27-.45.09-.18.045-.338-.023-.473-.068-.135-.61-1.467-.834-2.012-.22-.527-.443-.455-.61-.462-.158-.008-.338-.008-.518-.008-.18 0-.473.068-.72.338-.248.27-.946.923-.946 2.25 0 1.328.968 2.61 1.103 2.79.136.18 1.905 2.91 4.613 4.078.645.278 1.148.444 1.54.569.65.207 1.24.178 1.706.108.52-.078 1.598-.653 1.823-1.283.225-.63.225-1.17.157-1.283-.067-.113-.247-.203-.517-.338z"
      fill="#FFFFFF"
    />
  </Svg>
);

const { width } = Dimensions.get('window');

// Configuration for the Perfect Slider
const CARD_WIDTH = width * 0.80; // Card takes 80% of screen width
const SPACING = -4; // Gap between cards
const SNAP_INTERVAL = CARD_WIDTH + SPACING; // Total scroll distance per slide

const plans = [
  {
    id: 1,
    name: '1 Lakh Plan',
    badge: 'Popular',
    amount: '₹1,00,000',
    monthly: '₹5,000',
    duration: '20 Months',
    return: '₹95,000',
    color: '#D97706',
    gradient: ['#D97706', '#B45309'],
    lottie: require('../../../../animation/UserHome/1LAkhLotte.json'),
  },
  {
    id: 2,
    name: '2 Lakh Plan',
    badge: 'Best Value',
    amount: '₹2,00,000',
    monthly: '₹10,000',
    duration: '20 Months',
    return: '₹1,90,000',
    color: '#0D9488',
    gradient: ['#0D9488', '#0F766E'],
    lottie: require('../../../../animation/UserHome/2LakhLotte.json'),
  },
  {
    id: 3,
    name: '3 Lakh Plan',
    badge: 'Trending',
    amount: '₹3,00,000',
    monthly: '₹15,000',
    duration: '20 Months',
    return: '₹2,85,000',
    color: '#7C3AED',
    gradient: ['#7C3AED', '#6D28D9'],
    lottie: require('../../../../animation/UserHome/3LakhLotte.json'),
  },
  {
    id: 4,
    name: '5 Lakh Plan',
    badge: 'Premium',
    amount: '₹5,00,000',
    monthly: '₹25,000',
    duration: '20 Months',
    return: '₹4,75,000',
    color: '#DB2777',
    gradient: ['#DB2777', '#BE185D'],
    lottie: require('../../../../animation/UserHome/5LakhLotte.json'),
  },
];

// Create infinite loop data by duplicating plans multiple times
const infiniteData = [...plans, ...plans, ...plans];
const initialIndex = plans.length; // Start from middle set

const Home = () => {
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const [userName, setUserName] = useState('User Name');
  const [totalInvested, setTotalInvested] = useState('');
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [activePlanSlide, setActivePlanSlide] = useState(0);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollTimer = useRef(null);
  const mainScrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(plans.length * SNAP_INTERVAL)).current;
  const autoScrollVal = useRef(new Animated.Value(0)).current;
  const currentScrollX = useRef(plans.length * SNAP_INTERVAL);

  const [notifications, setNotifications] = useState([
    {
      title: 'Welcome to GDK Chit Funds',
      message: 'Your latest plan updates will appear here.',
      type: 'info',
    },
  ]);
  const [readNotifIds, setReadNotifIds] = useState(new Set());
  const [clearedNotifIds, setClearedNotifIds] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const notifBtnRef = useRef(null);
  const notifModalRef = useRef(null);
  const plansSectionRef = useRef(null);
  const socialSectionRef = useRef(null);
  const notifCrossRef = useRef(null);

  const measureNotifBtn = useCallback(() => {
    if (notifBtnRef.current) {
      notifBtnRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          DeviceEventEmitter.emit('NOTIF_LAYOUT_MEASURED', { x, y, width: w, height: h });
        }
      });
    }
  }, []);

  const measureNotifModal = useCallback(() => {
    if (notifModalRef.current) {
      notifModalRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          DeviceEventEmitter.emit('NOTIF_MODAL_MEASURED', { x, y, width: w, height: h });
        }
      });
    }
  }, []);

  const measureNotifCrossBtn = useCallback(() => {
    if (notifCrossRef.current) {
      notifCrossRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          DeviceEventEmitter.emit('NOTIF_CROSS_LAYOUT_MEASURED', { x, y, width: w, height: h });
        }
      });
    }
  }, []);

  const measurePlansSection = useCallback(() => {
    if (plansSectionRef.current) {
      plansSectionRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          DeviceEventEmitter.emit('PLANS_LAYOUT_MEASURED', { x, y, width: w, height: h });
        }
      });
    }
  }, []);

  const measureSocialSection = useCallback(() => {
    if (socialSectionRef.current) {
      socialSectionRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          DeviceEventEmitter.emit('SOCIAL_LAYOUT_MEASURED', { x, y, width: w, height: h });
        }
      });
    }
  }, []);

  const handleCloseNotificationsModal = useCallback(() => {
    setShowNotifications(false);
    DeviceEventEmitter.emit('NOTIFICATIONS_CLOSED');
  }, []);

  useEffect(() => {
    const reqSub = DeviceEventEmitter.addListener('REQUEST_NOTIF_LAYOUT', () => {
      measureNotifBtn();
      setTimeout(measureNotifBtn, 100);
      setTimeout(measureNotifBtn, 300);
    });

    const reqNotifModalSub = DeviceEventEmitter.addListener('REQUEST_NOTIF_MODAL_LAYOUT', () => {
      measureNotifModal();
      setTimeout(measureNotifModal, 200);
      setTimeout(measureNotifModal, 500);
    });

    const reqNotifCrossSub = DeviceEventEmitter.addListener('REQUEST_NOTIF_CROSS_LAYOUT', () => {
      measureNotifCrossBtn();
      setTimeout(measureNotifCrossBtn, 200);
      setTimeout(measureNotifCrossBtn, 500);
    });

    const reqPlansSub = DeviceEventEmitter.addListener('REQUEST_PLANS_LAYOUT', () => {
      measurePlansSection();
      setTimeout(measurePlansSection, 200);
    });

    const reqSocialSub = DeviceEventEmitter.addListener('REQUEST_SOCIAL_LAYOUT', () => {
      measureSocialSection();
      setTimeout(measureSocialSection, 200);
      setTimeout(measureSocialSection, 500);
      setTimeout(measureSocialSection, 800);
    });

    const stepSub = DeviceEventEmitter.addListener('USER_MANUAL_STEP_CHANGED', (data) => {
      if (data?.stepId === 'notif_bell') {
        measureNotifBtn();
      }
    });

    const closeNotifTourSub = DeviceEventEmitter.addListener('CLOSE_NOTIFICATIONS_TOUR', () => {
      handleCloseNotificationsModal();
    });

    const switchTabSub = DeviceEventEmitter.addListener('SWITCH_TAB', (tabName) => {
      navigation.navigate(tabName);
    });

    return () => {
      reqSub.remove();
      reqNotifModalSub.remove();
      reqNotifCrossSub.remove();
      reqPlansSub.remove();
      reqSocialSub.remove();
      stepSub.remove();
      closeNotifTourSub.remove();
      switchTabSub.remove();
    };
  }, [measureNotifBtn, measureNotifModal, measurePlansSection, measureSocialSection, handleCloseNotificationsModal, navigation]);

  const fetchHomeData = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      }

      // Fetch user profile from ApiService.getProfile() for dynamic name updates
      const profileRes = await ApiService.getProfile();
      if (profileRes?.success && profileRes?.data?.user) {
        const u = profileRes.data.user;
        const name = u.name || u.username || storedName || 'User Name';
        setUserName(name);
        await AsyncStorage.setItem('userName', name);
      }

      // Fetch portfolio data for total investment sum
      const portRes = await ApiService.getPortfolio();
      if (portRes?.success && Array.isArray(portRes.data)) {
        const totalPaid = portRes.data.reduce((sum, g) => sum + (Number(g.totalPaid) || 0), 0);
        const totalInvestVal = portRes.data.reduce((sum, g) => sum + (Number(g.investmentAmount) || 0), 0);
        const finalInvested = totalPaid > 0 ? totalPaid : totalInvestVal;
        setTotalInvested(finalInvested > 0 ? finalInvested.toLocaleString('en-IN') : '0');
      }

      // Fetch user notifications
      const notifRes = await ApiService.getNotifications();
      if (notifRes?.success && Array.isArray(notifRes.data) && notifRes.data.length > 0) {
        setNotifications(notifRes.data);
      }
    } catch (e) {
      console.log('Error fetching home data:', e);
    }
  }, []);

  const handleExplorePress = (id) => {
    switch (id) {
      case 'location':
        navigation.navigate('UserAdminLocation');
        break;
      case 'biometric':
        navigation.navigate('SecurityPerm');
        break;
      case 'online':
        navigation.navigate('Portfolio');
        break;
      case 'language':
        navigation.navigate('LanguageSettings');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const xListener = scrollX.addListener(({ value }) => {
      currentScrollX.current = value;
    });
    const autoScrollListener = autoScrollVal.addListener(({ value }) => {
      if (flatListRef.current) {
        flatListRef.current.scrollTo({
          x: value,
          animated: false,
        });
      }
    });

    return () => {
      scrollX.removeListener(xListener);
      autoScrollVal.removeListener(autoScrollListener);
    };
  }, [scrollX, autoScrollVal]);

  const plansLayoutY = useRef(0);
  const socialLayoutY = useRef(0);

  const goldenFade = useRef(new Animated.Value(0)).current;

  const loadStoredNotifState = useCallback(async () => {
    try {
      const [storedRead, storedCleared, cachedNotifs] = await Promise.all([
        AsyncStorage.getItem('read_notification_ids'),
        AsyncStorage.getItem('cleared_notification_ids'),
        AsyncStorage.getItem('cached_user_notifications'),
      ]);
      if (storedRead) {
        setReadNotifIds(new Set(JSON.parse(storedRead)));
      }
      if (storedCleared) {
        setClearedNotifIds(new Set(JSON.parse(storedCleared)));
      }
      if (cachedNotifs) {
        const parsed = JSON.parse(cachedNotifs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadStoredNotifState();
  }, [loadStoredNotifState]);

  useFocusEffect(
    useCallback(() => {
      loadStoredNotifState();
    }, [loadStoredNotifState])
  );

  const visibleNotifications = notifications.filter((n, idx) => {
    const id = n.id || `notif-${idx}`;
    return !clearedNotifIds.has(id);
  });

  const unreadCount = visibleNotifications.filter((n, idx) => {
    const id = n.id || `notif-${idx}`;
    return !readNotifIds.has(id);
  }).length;

  const handleOpenNotifications = () => {
    navigation.navigate('Notifications');
  };

  useEffect(() => {
    const notifUpdatedSub = DeviceEventEmitter.addListener('NOTIFICATIONS_UPDATED', () => {
      loadStoredNotifState();
    });
    const sub = DeviceEventEmitter.addListener('OPEN_NOTIFICATIONS', () => {
      navigation.navigate('Notifications');
    });
    const scrollSub = DeviceEventEmitter.addListener('SCROLL_HOME', (y) => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ y: y, animated: true });
      }
    });
    const scrollToSocialSub = DeviceEventEmitter.addListener('SCROLL_TO_SOCIAL', () => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ y: Math.max(socialLayoutY.current - 220, 0), animated: true });
      }
    });
    return () => {
      notifUpdatedSub.remove();
      sub.remove();
      scrollSub.remove();
      scrollToSocialSub.remove();
    };
  }, [loadStoredNotifState, navigation]);

  const triggerRangoliAnimation = useCallback(() => {
    goldenFade.setValue(0);
    Animated.sequence([
      Animated.timing(goldenFade, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(goldenFade, {
        toValue: 0,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [goldenFade]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      triggerRangoliAnimation();
      fetchHomeData();

      return () => {
        StatusBar.setBarStyle('dark-content');
      };
    }, [triggerRangoliAnimation, fetchHomeData])
  );

  // Scroll to Popular Plans section
  // eslint-disable-next-line no-unused-vars
  const scrollToPlans = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        y: plansLayoutY.current - 20,
        animated: true,
      });
    }
  };


  // --- START: INFINITE CAROUSEL LOGIC ---

  // Initialize scroll position to middle set
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollTo({
          x: initialIndex * SNAP_INTERVAL,
          animated: false
        });
      }, 100);
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollTimer.current) {
      clearInterval(scrollTimer.current);
      scrollTimer.current = null;
    }
    autoScrollVal.stopAnimation();
  }, [autoScrollVal]);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    scrollTimer.current = setInterval(() => {
      if (flatListRef.current) {
        setActivePlanSlide((prev) => {
          const nextIndex = prev + 1;

          autoScrollVal.setValue(currentScrollX.current);
          Animated.timing(autoScrollVal, {
            toValue: nextIndex * SNAP_INTERVAL,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) {
              if (nextIndex >= plans.length * 2) {
                const resetIndex = nextIndex - plans.length;
                scrollX.setValue(resetIndex * SNAP_INTERVAL);
                autoScrollVal.setValue(resetIndex * SNAP_INTERVAL);
                if (flatListRef.current) {
                  flatListRef.current.scrollTo({
                    x: resetIndex * SNAP_INTERVAL,
                    animated: false,
                  });
                }
                setActivePlanSlide(resetIndex);
              }
            }
          });

          return nextIndex;
        });
      }
    }, 5000);
  }, [autoScrollVal, stopAutoScroll, scrollX]);

  // Reset to middle when reaching edges (seamless loop)
  const handleScrollEnd = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / SNAP_INTERVAL);

    // If we've scrolled past the middle set, reset to middle
    if (currentIndex >= plans.length * 2) {
      const resetIndex = currentIndex - plans.length;
      scrollX.setValue(resetIndex * SNAP_INTERVAL);
      autoScrollVal.setValue(resetIndex * SNAP_INTERVAL);
      if (flatListRef.current) {
        flatListRef.current.scrollTo({
          x: resetIndex * SNAP_INTERVAL,
          animated: false,
        });
      }
      setActivePlanSlide(resetIndex);
    } else if (currentIndex < plans.length) {
      const resetIndex = currentIndex + plans.length;
      scrollX.setValue(resetIndex * SNAP_INTERVAL);
      autoScrollVal.setValue(resetIndex * SNAP_INTERVAL);
      if (flatListRef.current) {
        flatListRef.current.scrollTo({
          x: resetIndex * SNAP_INTERVAL,
          animated: false,
        });
      }
      setActivePlanSlide(resetIndex);
    } else {
      setActivePlanSlide(currentIndex);
    }
  }, [scrollX, autoScrollVal]);

  // Lifecycle management
  useEffect(() => {
    setActivePlanSlide(initialIndex);
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);


  // --- END: INFINITE CAROUSEL LOGIC ---

  const features = [
    {
      title: 'RBI Registered',
      description:
        'Fully compliant with Reserve Bank of India regulations for chit funds',
      icon: 'shield-check',
    },
    {
      title: 'Transparent Auctions',
      description: 'Live monthly auctions with complete transparency and fair bidding',
      icon: 'gavel',
    },
    {
      title: 'Guaranteed Payouts',
      description: 'On-time prize money disbursement with zero delays',
      icon: 'cash-check',
    },
    {
      title: 'Digital Tracking',
      description: 'Track your investments, payments and returns in real-time',
      icon: 'cellphone-check',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Members', icon: 'account-group' },
    { value: '100%', label: 'Trust Score', icon: 'star-circle' },
    { value: '25+', label: 'Years Legacy', icon: 'calendar-check' },
    { value: '₹50Cr+', label: 'Funds Managed', icon: 'currency-inr' },
  ];

  const exploreFeatures = [
    {
      id: 'location',
      bgColor: '#EEF2FF',
      iconColor: '#4F46E5',
      icon: 'map-pin',
      title: 'Admin Location',
      subtitle: 'Share office\nlocation',
    },
    {
      id: 'biometric',
      bgColor: '#ECFDF5',
      iconColor: '#10B981',
      icon: 'fingerprint',
      title: 'Biometrics',
      subtitle: 'Fingerprint\nsecurity',
    },
    {
      id: 'online',
      bgColor: '#FFFBEB',
      iconColor: '#F59E0B',
      icon: 'credit-card',
      title: 'Online Pay',
      subtitle: 'Digital\ntransactions',
    },
    {
      id: 'language',
      bgColor: '#FDF2F8',
      iconColor: '#EC4899',
      icon: 'languages',
      title: 'Dual Language',
      subtitle: 'Tamil & English\nsupport',
    },
  ];

  const openChitPlansForPlan = (planId) => {
    const index = plans.findIndex((p) => p.id === planId);
    const safeIndex = index >= 0 ? index : 0;
    setSelectedPlanIndex(safeIndex);
    setShowAllPlans(true);
  };

  const renderPlanItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1.0, 0.92],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1.0, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={`${item.id}-${index}`}
        style={{
          width: CARD_WIDTH,
          marginRight: SPACING,
          transform: [{ scale }],
          opacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openChitPlansForPlan(item.id)}
          style={[
            styles.planCard,
            { backgroundColor: item.color, width: '100%' },
          ]}
        >

          {/* Badge */}
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.planBadgeText}>{t(item.badge)}</Text>
            </View>
          )}

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle} />
          <View style={styles.decorativeCircleSmall} />

          {/* Lottie Gold Coin Animation */}
          <LottieView
            source={item.lottie}
            autoPlay
            loop
            cacheComposition={true}
            renderMode="HARDWARE"
            style={[
              styles.cardLottieCoin,
              item.id !== 3 && { top: 32 },
              item.id === 1 && { top: 20 },
              item.id === 4 && { width: 120, height: 120, top: 22, right: -2 },
            ]}
            pointerEvents="none"
          />

          {/* Top Content */}
          <View>
            {/* Plan Title */}
            <Text
              style={[
                styles.planTitle,
                language === 'ta' && { fontSize: 15 },
              ]}
            >
              {t(item.name)}
            </Text>

            {/* Amount Section */}
            <View style={styles.amountRow}>
              <Text style={styles.mainAmount}>
                {item.amount}
              </Text>
              <Text style={styles.totalLabel}>({t('Total Value')})</Text>
            </View>

            {/* Monthly Info */}
            <Text style={styles.monthlyInfo}>
              {item.monthly} per month for {item.duration}
            </Text>
          </View>

          {/* Return Info - Bottom Footer */}
          <View style={styles.returnSection}>
            <Text style={styles.returnLabel}>{t('Expected Return')}</Text>
            <Text style={styles.returnAmount}>
              {item.return}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Unified Top Purple Area */}
        <View style={styles.topPurpleContainer}>
          {/* Background Gradient */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgRadialGradient
                id="purpleGrad"
                cx="90%"
                cy="10%"
                rx="90%"
                ry="90%"
                fx="90%"
                fy="10%"
              >
                <Stop offset="0%" stopColor="#8C52FF" />
                <Stop offset="100%" stopColor="#411E73" />
              </SvgRadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#purpleGrad)" />
          </Svg>

          {/* Background Rangoli */}
          <Image
            source={require('../../../../assets/UserHomePage/ZoomRangoli.png')}
            style={styles.backgroundRangoliImage}
            resizeMode="cover"
            pointerEvents="none"
          />
          <Animated.Image
            source={require('../../../../assets/UserHomePage/ZoomGoldenRangoli.png')}
            style={[
              styles.backgroundRangoliImage,
              {
                tintColor: '#FFD700',
                opacity: goldenFade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.35],
                }),
              },
            ]}
            resizeMode="cover"
            pointerEvents="none"
          />

          {/* Bottom Right Rangoli */}
          <View style={styles.bottomRangoliContainer} pointerEvents="none">
            <Image
              source={require('../../../../assets/UserHomePage/rangoli.png')}
              style={styles.bottomRangoliImage}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('../../../../assets/UserHomePage/GoldenRangoli.png')}
              style={[
                styles.bottomRangoliImage,
                {
                  tintColor: '#FFD700',
                  opacity: goldenFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.35],
                  }),
                },
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Greeting Header Section */}
          <View style={[styles.greetingHeader, { paddingTop: STATUSBAR_HEIGHT > 0 ? STATUSBAR_HEIGHT + 2 : 12 }]}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTitle}>{t('Hello, ') + userName}</Text>
            </View>
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.investmentButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Portfolio')}
              >
                <Icon name="currency-inr" size={14} color="#FDE68A" />
                <Text style={styles.investmentAmount}>{totalInvested ? totalInvested : '0'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                ref={notifBtnRef}
                style={styles.notificationButton}
                onPress={handleOpenNotifications}
                onLayout={measureNotifBtn}
              >
                <Icon name="bell-outline" size={20} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Section - Premium UI */}
          <View style={styles.heroSection}>
            {/* Top Content */}
            <View style={styles.heroTopContent}>
              <Text style={styles.heroTitle}>ஸ்ரீ பெரியநாயகி அம்மன்</Text>
            </View>

            {/* Animation Above Button */}
            <View style={styles.heroAnimation}>
              <LottieView
                source={require('../../../../animation/UserHome/MoneyIncreaseGraph.json')}
                autoPlay
                loop={false}
                style={styles.lottieHero}
              />
            </View>
          </View>
        </View>

        {/* --- START: UPDATED PLANS SECTION --- */}
        <View
          ref={plansSectionRef}
          style={styles.plansSection}
          onLayout={(event) => {
            plansLayoutY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.plansSectionHeader}>
            <Text style={[styles.plansSectionTitle, language === 'ta' && { fontSize: 16 }]}>{t('Popular Plans 🌟')}</Text>
            <TouchableOpacity
              onPress={() =>
                openChitPlansForPlan(
                  plans[activePlanSlide % plans.length]?.id || plans[0].id
                )
              }
            >
              <Text style={styles.viewAllText}>{t('View All')}</Text>
            </TouchableOpacity>
          </View>

          <Animated.ScrollView
            ref={flatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={[
              styles.plansScrollContent,
              { paddingHorizontal: (width - CARD_WIDTH) / 2 },
            ]}
            snapToAlignment="start"
            removeClippedSubviews={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => stopAutoScroll()}
            onScrollEndDrag={(event) => {
              handleScrollEnd(event);
              startAutoScroll();
            }}
            onMomentumScrollEnd={handleScrollEnd}
            contentOffset={{ x: initialIndex * SNAP_INTERVAL, y: 0 }}
          >
            {infiniteData.map((item, index) => renderPlanItem({ item, index }))}
          </Animated.ScrollView>

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {plans.map((plan, index) => {
              const isActive = (activePlanSlide % plans.length) === index;
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.paginationDot,
                    isActive && [
                      styles.paginationDotActive,
                      { backgroundColor: plan.color },
                    ],
                  ]}
                />
              );
            })}
          </View>
        </View>
        {/* --- END: UPDATED PLANS SECTION --- */}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 16 }]}>{t('Our Achievements')}</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => {
              const isEvenRow = Math.floor(index / 2) % 2 === 0;
              const isFirstInRow = index % 2 === 0;
              const cardWidth = isEvenRow
                ? (isFirstInRow ? '52%' : '44%')
                : (isFirstInRow ? '44%' : '52%');

              // Pastel colors matching features
              const bgColors = ['#EEF2FF', '#ECFDF5', '#FFFBEB', '#FDF2F8'];
              const iconColors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899'];
              const bgColor = bgColors[index % bgColors.length];
              const iconColor = iconColors[index % iconColors.length];

              return (
                <View key={index} style={[styles.statCard, { width: cardWidth, overflow: 'hidden' }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.statLabel, language === 'ta' && { fontSize: 13 }]}>{t(stat.label)}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                  <Image
                    source={
                      stat.icon === 'star-circle'
                        ? require('../../../../assets/UserHomePage/trust.png')
                        : stat.icon === 'account-group'
                          ? require('../../../../assets/UserHomePage/ActiveMembers.png')
                          : stat.icon === 'calendar-check'
                            ? require('../../../../assets/UserHomePage/YearsLegacy.png')
                            : require('../../../../assets/UserHomePage/FundManagement.png')
                    }
                    style={{
                      width: stat.icon === 'currency-inr' ? 115 : stat.icon === 'calendar-check' ? 100 : 90,
                      height: stat.icon === 'currency-inr' ? 115 : stat.icon === 'calendar-check' ? 100 : 90,
                      position: 'absolute',
                      bottom: (stat.icon === 'currency-inr' || stat.icon === 'calendar-check') ? 0 : 2,
                      right: (stat.icon === 'currency-inr' || stat.icon === 'calendar-check') ? 4 : 8
                    }}
                    resizeMode="contain"
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Explore GDK ChitFunds Section */}
        <View style={styles.exploreSection}>
          <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 16 }]}>
            {t('Explore GDK ChitFunds')}
          </Text>
          <View style={styles.exploreGrid}>
            {exploreFeatures.map((feature, index) => {
              const isEvenRow = Math.floor(index / 2) % 2 === 0;
              const isFirstInRow = index % 2 === 0;
              const cardWidth = isEvenRow
                ? (isFirstInRow ? '52%' : '44%')
                : (isFirstInRow ? '44%' : '52%');

              return (
                <TouchableOpacity
                  key={feature.id}
                  activeOpacity={0.85}
                  onPress={() => handleExplorePress(feature.id)}
                  style={[styles.exploreCard, { width: cardWidth, overflow: 'hidden' }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.exploreTitle}>{t(feature.title)}</Text>
                    <Text style={styles.exploreSubtitle}>{t(feature.subtitle)}</Text>
                  </View>
                  <Image
                    source={
                      feature.icon === 'map-pin'
                        ? require('../../../../assets/UserHomePage/Location.png')
                        : feature.icon === 'fingerprint'
                          ? require('../../../../assets/UserHomePage/Biometric.png')
                          : feature.icon === 'credit-card'
                            ? require('../../../../assets/UserHomePage/OnlineTransation.png')
                            : require('../../../../assets/UserHomePage/DuelLanguage.png')
                    }
                    style={{
                      width: feature.icon === 'map-pin' ? 125 : 100,
                      height: feature.icon === 'map-pin' ? 125 : 100,
                      position: 'absolute',
                      bottom: feature.icon === 'map-pin' ? -8 : 0,
                      right: feature.icon === 'credit-card' ? -10 : 4
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Social Sections Wrapper (for tour measurement) */}
        <View 
          ref={socialSectionRef}
          onLayout={(e) => {
            if (e.nativeEvent.layout.y > 0) {
              socialLayoutY.current = e.nativeEvent.layout.y;
            }
          }}
        >
        {/* WhatsApp Community Section */}
        <View style={styles.whatsappContainer}>
          <Svg style={[StyleSheet.absoluteFill, { zIndex: -1, width: '100%', height: '100%' }]} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="whatsappGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <Stop offset="0%" stopColor="#25D366" />
                <Stop offset="100%" stopColor="#00A884" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#whatsappGrad)" />
          </Svg>

          <View style={styles.whatsappContent}>
            <View style={styles.whatsappHeaderRow}>
              <View style={styles.whatsappIconCircle}>
                <WhatsappIcon size={26} color="#25D366" />
              </View>
              <Text style={styles.whatsappTitle}>
                {t('Get Exclusive Offers and Market Updates')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.whatsappButton}
              activeOpacity={0.9}
              onPress={() => {
                Linking.openURL('https://chat.whatsapp.com').catch(() => {
                  Alert.alert('Notice', 'Unable to open WhatsApp link.');
                });
              }}
            >
              <Text style={styles.whatsappButtonText}>
                {t('Join Our WhatsApp Community')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram Banners Section */}
        <View style={styles.instagramBannersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.instagramBannersScroll}
          >
            <Image
              source={require('../../../../assets/UserHomePage/gold_graph_banner.jpg')}
              style={styles.instagramBannerImage}
              resizeMode="cover"
            />
            <Image
              source={require('../../../../assets/UserHomePage/gold_rupee_banner.jpg')}
              style={styles.instagramBannerImage}
              resizeMode="cover"
            />
            <Image
              source={require('../../../../assets/UserHomePage/gold_ripped_banner.jpg')}
              style={styles.instagramBannerImage}
              resizeMode="cover"
            />
          </ScrollView>
          <TouchableOpacity
            style={styles.instagramButton}
            activeOpacity={0.8}
            onPress={() => {
              Linking.openURL('https://instagram.com').catch(() => {
                Alert.alert('Notice', 'Unable to open Instagram.');
              });
            }}
          >
            <Text style={styles.instagramButtonText}>
              {t('Follow Us On Instagram')}
            </Text>
          </TouchableOpacity>
        </View>

        </View>{/* End Social Sections Wrapper */}

        {/* Insured Savings Card */}
        <View style={styles.insuranceContainer}>
          {/* Gradient Background */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="insuranceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#C4B0F5" />
                <Stop offset="50%" stopColor="#D9CEFB" />
                <Stop offset="100%" stopColor="#EDE6FF" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#insuranceGrad)" />
          </Svg>

          {/* Text content area */}
          <View style={styles.insuranceTextContent}>
            <Text style={styles.insuranceTitle}>
              {t('Your Savings.Insured and Protected.')}
            </Text>
            <Text style={styles.insuranceSubtitle}>
              {t('Certified storage backed by global\nsafety standards')}
            </Text>
            <TouchableOpacity style={styles.insuranceButton} activeOpacity={0.9}>
              <Text style={styles.insuranceButtonText}>{t('Know More')}</Text>
            </TouchableOpacity>
          </View>

          {/* Vault image - bottom right */}
          <Image
            source={require('../../../../assets/UserHomePage/banklocker.png')}
            style={styles.vaultImage}
            resizeMode="contain"
          />
        </View>

        {/* Invest Like a Pro Section */}
        <View style={styles.proContainer}>
          <Text style={styles.proTitle}>
            {t('Invest like\na pro!')}
          </Text>
          <View style={styles.proTrustRow}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <Text style={styles.proTrustText}>
              {t('Trusted by 15 Lakh Indians')}
            </Text>
          </View>
        </View>



        {/* Footer */}
        <View style={styles.blackFooter}>
          <Text style={styles.blackFooterText}>
            {t('© 2025 CHITFUNDS. All rights reserved.')}
          </Text>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={showAllPlans}
        onRequestClose={() => setShowAllPlans(false)}
        statusBarTranslucent={true}
      >
        <ChitPlans
          onClose={() => setShowAllPlans(false)}
          initialPlanIndex={selectedPlanIndex}
        />
      </Modal>
    </View>
  );
};

export default Home;