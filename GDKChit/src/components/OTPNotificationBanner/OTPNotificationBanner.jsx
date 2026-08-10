import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Vibration,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../services/ApiService';
import { navigate } from '../../utils/navigation';

const OTPNotificationBanner = () => {
  const [activeOtp, setActiveOtp] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const notifiedOtpIds = useRef(new Set());

  const slideAnim = useRef(new Animated.Value(-180)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.35)).current;

  // Pulse & glow animation loop for the security shield badge
  useEffect(() => {
    let animationLoop;
    if (visible) {
      animationLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 850,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 850,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 0.85,
              duration: 850,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.35,
              duration: 850,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animationLoop.start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.35);
    }
    return () => {
      if (animationLoop) animationLoop.stop();
    };
  }, [visible, pulseAnim, glowAnim]);

  const targetTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 54;

  const checkPendingOtp = useCallback(async () => {
    try {
      const token = await ApiService.getAccessToken();
      if (!token) return;

      const res = await ApiService.getOTPRequests().catch(() => null);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Find the latest active (pending or viewed) OTP request that hasn't been dismissed in this session
        const candidate = res.data.find(
          (otp) =>
            (otp.status === 'pending' || otp.status === 'viewed') &&
            !dismissedIds.has(otp.id)
        );

        if (candidate) {
          setActiveOtp(candidate);
          
          // Trigger device vibration notification if this is a newly detected OTP
          if (!notifiedOtpIds.current.has(candidate.id)) {
            notifiedOtpIds.current.add(candidate.id);
            try {
              Vibration.vibrate([0, 180, 100, 180]);
            } catch (err) {
              // Ignore vibration error if unsupported
            }
          }

          if (!visible) {
            setVisible(true);
            Animated.spring(slideAnim, {
              toValue: targetTop,
              tension: 55,
              friction: 8,
              useNativeDriver: true,
            }).start();
          }
          return;
        }
      }

      // If no valid candidate found, hide banner if visible
      if (visible) {
        hideBanner();
      }
    } catch (error) {
      // Silent catch for background polling
    }
  }, [dismissedIds, targetTop]);

  useEffect(() => {
    checkPendingOtp();
    const interval = setInterval(checkPendingOtp, 30000); // Reduced polling from 5s to 30s to prevent request flooding
    return () => clearInterval(interval);
  }, [checkPendingOtp]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -180,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setActiveOtp(null);
    });
  };

  const handleDismiss = () => {
    if (activeOtp?.id) {
      setDismissedIds((prev) => new Set(prev).add(activeOtp.id));
    }
    hideBanner();
  };

  const handleBannerPress = () => {
    if (activeOtp?.id) {
      setDismissedIds((prev) => new Set(prev).add(activeOtp.id));
      ApiService.markOTPViewed(activeOtp.id).catch(() => {});
    }
    hideBanner();
    navigate('OTPRequests');
  };

  if (!visible || !activeOtp) return null;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.94}
        onPress={handleBannerPress}
      >
        {/* Top Right Close Button */}
        <TouchableOpacity
          style={styles.closeButtonTopRight}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.cardInnerContent}>
          {/* Animated Security Icon Badge */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.iconGlowRing,
                { opacity: glowAnim, transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.iconCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <MaterialCommunityIcons name="shield-lock" size={24} color="#FFFFFF" />
            </Animated.View>
          </View>

          {/* Main Content Area */}
          <View style={styles.textDetailsArea}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              OTP Authorization
            </Text>

            <Text style={styles.messageSubtext} numberOfLines={2}>
              Admin requested OTP for{' '}
              <Text style={styles.groupHighlight}>
                {activeOtp.groupName || 'Chit Group'}
              </Text>
              . Tap to review code.
            </Text>
          </View>

          {/* Right Action Section */}
          <View style={styles.rightActionSection}>
            <View style={styles.shareCodePill}>
              <Text style={styles.shareCodeText}>Share Code</Text>
              <MaterialCommunityIcons name="arrow-right" size={13} color="#6B46C1" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    zIndex: 99999,
    elevation: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  cardContainer: {
    backgroundColor: '#6B46C1',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    overflow: 'hidden',
    position: 'relative',
  },
  closeButtonTopRight: {
    position: 'absolute',
    top: 11,
    right: 11,
    zIndex: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconGlowRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  textDetailsArea: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
    paddingRight: 22,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  messageSubtext: {
    fontSize: 12.5,
    color: '#E9D5FF',
    lineHeight: 17.5,
  },
  groupHighlight: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rightActionSection: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  shareCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  shareCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B46C1',
    marginRight: 4,
  },
});

export default OTPNotificationBanner;
