import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { navigate as navigateRef } from '../../../utils/navigation';
import styles from './usermanulesty';

const { width: W, height: H } = Dimensions.get('window');

export const USER_MANUAL_STORAGE_KEY = 'has_seen_user_manual_v1';

// Calculate spotlight coordinates & upper screen tooltip positioning for full feature walkthrough
const getFeatureSteps = () => {
  const isIOS = Platform.OS === 'ios';
  const bottomBarY = H - (isIOS ? 75 : 62);
  const centerBtnY = H - (isIOS ? 92 : 78);
  const upperTooltipTop = isIOS ? H * 0.16 : H * 0.14;
  const topScreenTooltipTop = isIOS ? 75 : 55; // Placed at top of screen above (+) MoreModal card

  return [
    {
      id: 'home_notifications',
      routeName: 'Home',
      homeScrollY: 0,
      badge: 'Notification Center',
      title: 'Real-Time Notifications',
      description:
        'Tap the notification bell to open real-time alerts for live auctions, payment reminders, and admin announcements!',
      icon: 'bell-ring',
      iconColor: '#F59E0B',
      targetX: W - 48,
      targetY: isIOS ? 52 : 38,
      circleSize: 44,
      tooltipTop: isIOS ? 115 : 95,
      isNotificationStep: true,
    },
    {
      id: 'popular_plans',
      routeName: 'Home',
      homeScrollY: 150,
      badge: 'Home Dashboard',
      title: 'Popular Chit Plans',
      description:
        'Browse verified chit investment groups (₹1L, ₹2L, ₹3L, and ₹5L) with transparent monthly installments & money growth curves!',
      icon: 'format-list-bulleted-square',
      iconColor: '#6B46C1',
      targetX: W * 0.5 - 25,
      targetY: H * 0.35,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
    {
      id: 'community_social',
      routeName: 'Home',
      homeScrollY: 650,
      badge: 'Community Support',
      title: 'WhatsApp & Instagram Community',
      description:
        'Connect directly with our official WhatsApp support & Instagram community for daily news, announcements, and scheme updates!',
      icon: 'account-group',
      iconColor: '#25D366',
      targetX: W * 0.5 - 25,
      targetY: H * 0.45,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
    {
      id: 'portfolio_touch',
      routeName: 'Home',
      homeScrollY: 0,
      badge: 'Touch to Open',
      title: 'Touch Portfolio Icon',
      description:
        'Touch this Portfolio tab icon to open your personal savings & dividend ledger page!',
      icon: 'hand-pointing-down',
      iconColor: '#10B981',
      targetX: W * 0.3 - 25,
      targetY: bottomBarY,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
      jumpToRouteOnPress: 'Portfolio',
    },
    {
      id: 'portfolio_overview',
      routeName: 'Portfolio',
      badge: 'Portfolio Page',
      title: 'Your Savings Portfolio',
      description:
        'Now on your Portfolio page! Track all active chits, total saved amount, dividend profits, paid dues, and download statements.',
      icon: 'briefcase',
      iconColor: '#10B981',
      targetX: W * 0.5 - 25,
      targetY: H * 0.28,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
    {
      id: 'more_touch',
      routeName: 'Home',
      homeScrollY: 0,
      badge: 'Touch (+) Button',
      title: 'Touch (+) for Quick Actions',
      description:
        'Touch this center (+) button to open the 4 primary quick action options!',
      icon: 'plus-circle',
      iconColor: '#EC4899',
      targetX: W * 0.5 - 32,
      targetY: centerBtnY,
      circleSize: 64,
      tooltipTop: upperTooltipTop,
      opensMoreModalOnTouch: true,
    },
    {
      id: 'more_4_buttons',
      routeName: 'Home',
      badge: '4 Core Quick Actions',
      title: '4 Core Action Options',
      description:
        '1) Live Auction Bidding, 2) Pay Monthly Dues, 3) Join New Chit Scheme, 4) Claim Prize Money Payout!',
      icon: 'widgets',
      iconColor: '#EC4899',
      targetX: W * 0.5 - 32,
      targetY: H * 0.48,
      circleSize: 64,
      tooltipTop: topScreenTooltipTop, // Positioned at top of screen ABOVE opened (+) modal card!
    },
    {
      id: 'chat',
      routeName: 'Chat',
      badge: 'Chat & Support Page',
      title: 'Direct Admin Chat & Help',
      description:
        'Now on the Chat page! Communicate directly with Chit Fund administrators for instant assistance and document verification.',
      icon: 'message',
      iconColor: '#3B82F6',
      targetX: W * 0.7 - 25,
      targetY: bottomBarY,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
    {
      id: 'profile_bank',
      routeName: 'Profile',
      profileScrollY: 0,
      badge: 'Settings & Profile',
      title: 'Linked Bank Account',
      description:
        'Now on Profile! Connect & manage your verified bank account details for instant prize money payouts.',
      icon: 'bank-outline',
      iconColor: '#8B5CF6',
      targetX: W * 0.5 - 25,
      targetY: H * 0.24,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
    {
      id: 'profile_language',
      routeName: 'Profile',
      profileScrollY: 360,
      badge: 'Settings & Profile',
      title: 'Dual Language Support',
      description:
        'Switch between English and Tamil (தமிழ்) anytime for your convenience!',
      icon: 'translate',
      iconColor: '#6B46C1',
      targetX: W * 0.5 - 25,
      targetY: H * 0.40,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
    {
      id: 'profile_location',
      routeName: 'Profile',
      profileScrollY: 680,
      badge: 'Settings & Profile',
      title: 'Admin & Branch Locations',
      description:
        'View physical office addresses, GPS maps, and registered branch details of Periyanayagi Amman Chit Fund!',
      icon: 'map-marker-radius',
      iconColor: '#EF4444',
      targetX: W * 0.5 - 25,
      targetY: H * 0.45,
      circleSize: 50,
      tooltipTop: upperTooltipTop,
    },
  ];
};

const UserManual = ({ visible = false, onClose = null, forceShow = false }) => {
  const steps = getFeatureSteps();
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(visible);
  const [currentStep, setCurrentStep] = useState(0);

  // Hardware-accelerated Animated Values
  const spotlightPos = useRef(
    new Animated.ValueXY({
      x: steps[0].targetX,
      y: steps[0].targetY,
    })
  ).current;

  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkStatus = async () => {
      if (forceShow) {
        setIsVisible(true);
        setCurrentStep(0);
        animateToStep(0);
        return;
      }
      try {
        const hasSeen = await AsyncStorage.getItem(USER_MANUAL_STORAGE_KEY);
        if (!hasSeen || hasSeen !== 'true') {
          setIsVisible(true);
          setCurrentStep(0);
          animateToStep(0);
        } else {
          setIsVisible(false);
        }
      } catch (err) {
        console.error('Error checking User Manual status:', err);
      }
    };

    checkStatus();
  }, [forceShow, visible]);

  // Hardware-accelerated pulsing animation for spotlight circle
  useEffect(() => {
    if (isVisible) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.18,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [isVisible]);

  const animateToStep = (stepIdx) => {
    const target = steps[stepIdx];

    // 1. Physically navigate to target tab screen using nested navigator pattern
    if (target.routeName) {
      try {
        navigateRef('UserTabs', { screen: target.routeName });
      } catch (err) {
        try {
          navigation.navigate(target.routeName);
        } catch (e) {
          console.log('Navigation trigger note:', e?.message);
        }
      }
    }

    // 2. Auto-scroll page if needed for lower items
    if (target.routeName === 'Home' && target.homeScrollY !== undefined) {
      DeviceEventEmitter.emit('SCROLL_HOME', target.homeScrollY);
    } else if (target.routeName === 'Profile' && target.profileScrollY !== undefined) {
      DeviceEventEmitter.emit('SCROLL_PROFILE', target.profileScrollY);
    }

    // 3. Hardware-accelerated smooth spring to target coordinates
    Animated.spring(spotlightPos, {
      toValue: { x: target.targetX, y: target.targetY },
      tension: 45,
      friction: 7,
      useNativeDriver: true,
    }).start();

    setCurrentStep(stepIdx);
  };

  const handleSpotlightPress = () => {
    const target = steps[currentStep];
    if (target.isNotificationStep) {
      DeviceEventEmitter.emit('OPEN_NOTIFICATIONS');
    } else if (target.opensMoreModalOnTouch) {
      DeviceEventEmitter.emit('OPEN_MORE_MODAL');
    } else if (target.jumpToRouteOnPress) {
      try {
        navigateRef('UserTabs', { screen: target.jumpToRouteOnPress });
      } catch (e) {}
    }
    handleNext();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      animateToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(USER_MANUAL_STORAGE_KEY, 'true');
    } catch (err) {
      console.error('Error saving manual completion:', err);
    }

    // Reset page scrolls & safely navigate back to Home dashboard
    DeviceEventEmitter.emit('SCROLL_HOME', 0);
    DeviceEventEmitter.emit('SCROLL_PROFILE', 0);

    try {
      navigateRef('UserTabs', { screen: 'Home' });
    } catch (err) {
      try {
        navigation.navigate('Home');
      } catch (e) {}
    }

    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Tap Anywhere Overlay */}
      <TouchableWithoutFeedback onPress={handleNext}>
        <View style={styles.overlayContainer}>
          {/* Top Left Step Pill */}
          <View style={styles.stepPill}>
            <View style={styles.stepPillDot} />
            <Text style={styles.stepPillText}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          {/* Top Right Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.skipButtonText}>Skip Tour</Text>
            <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Glowing Amber Gold Circle Spotlight surrounding target button (GPU Native Driver) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSpotlightPress}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: W,
              height: H,
              zIndex: 10010,
            }}
          >
            <Animated.View
              style={[
                styles.spotlightCircle,
                {
                  width: step.circleSize,
                  height: step.circleSize,
                  borderRadius: step.circleSize / 2,
                  transform: [
                    { translateX: spotlightPos.x },
                    { translateY: spotlightPos.y },
                    { scale: pulseScale },
                  ],
                },
              ]}
            />
          </TouchableOpacity>

          {/* High-Visibility Amber Gold Cursor Pointer Icon (GPU Native Driver) */}
          <Animated.View
            style={[
              styles.cursorPointerContainer,
              {
                transform: [
                  {
                    translateX: Animated.add(
                      spotlightPos.x,
                      step.circleSize / 2 - 14
                    ),
                  },
                  {
                    translateY: Animated.add(
                      spotlightPos.y,
                      step.circleSize / 2 - 14
                    ),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="gesture-tap-button"
              size={34}
              color="#FBBF24"
            />
          </Animated.View>

          {/* High-Contrast Floating Text Section (Positioned Top-Layered Over (+) Modal for Step 6) */}
          <View
            style={[
              styles.tooltipCard,
              {
                top: step.tooltipTop,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.tooltipHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: step.iconColor },
                ]}
              >
                <MaterialCommunityIcons
                  name={step.icon}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tooltipBadge}>{step.badge}</Text>
                <Text style={styles.tooltipTitle}>{step.title}</Text>
              </View>
            </View>

            {/* Subtitle Description */}
            <Text style={styles.tooltipDescription}>{step.description}</Text>

            {/* Footer with Dots & Next Button */}
            <View style={styles.tooltipFooter}>
              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                {steps.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === currentStep
                        ? styles.activeDot
                        : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>

              {/* Next Action Button */}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: step.iconColor },
                ]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Explore App' : 'Next Step'}
                </Text>
                <MaterialCommunityIcons
                  name={isLastStep ? 'check' : 'arrow-right'}
                  size={16}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Tap Anywhere Hint */}
          <Text style={styles.tapHintText}>
            💡 Tap anywhere to navigate & explain next step
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default UserManual;
