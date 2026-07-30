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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../services/ApiService';
import { navigate } from '../../utils/navigation';

const OTPNotificationBanner = () => {
  const [activeOtp, setActiveOtp] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const slideAnim = useRef(new Animated.Value(-150)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the bell/key icon
  useEffect(() => {
    let pulseLoop;
    if (visible) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [visible, pulseAnim]);

  const checkPendingOtp = useCallback(async () => {
    try {
      const token = ApiService.getAuthToken ? await ApiService.getAuthToken() : null;
      // Skip check if user is not logged in
      const res = await ApiService.getOTPRequests().catch(() => null);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Find the latest active (pending or viewed) OTP request that hasn't been dismissed by user in this session
        const candidate = res.data.find(
          (otp) =>
            (otp.status === 'pending' || otp.status === 'viewed') &&
            !dismissedIds.has(otp.id)
        );

        if (candidate) {
          setActiveOtp(candidate);
          if (!visible) {
            setVisible(true);
            Animated.spring(slideAnim, {
              toValue: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + 10 : 50,
              tension: 60,
              friction: 9,
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
      // Silent error handling for background polling
    }
  }, [visible, dismissedIds, slideAnim]);

  useEffect(() => {
    checkPendingOtp();
    const interval = setInterval(checkPendingOtp, 6000); // Check every 6 seconds
    return () => clearInterval(interval);
  }, [checkPendingOtp]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
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
        style={styles.bannerTouchArea}
        activeOpacity={0.9}
        onPress={handleBannerPress}
      >
        <View style={styles.bannerContent}>
          {/* Left Icon with Pulse */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <MaterialCommunityIcons name="shield-key-outline" size={24} color="#F59E0B" />
          </Animated.View>

          {/* Center Text */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.titleText}>OTP Verification Requested</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>ACTION REQUIRED</Text>
              </View>
            </View>
            <Text style={styles.messageText} numberOfLines={2}>
              Admin requested OTP for <Text style={styles.groupNameText}>{activeOtp.groupName || 'Chit Group'}</Text>. Tap to share code.
            </Text>
          </View>

          {/* Action Arrow & Dismiss Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={18} color="#A5B4FC" />
            </TouchableOpacity>
            <View style={styles.viewCodeButton}>
              <Text style={styles.viewCodeText}>View</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#FFFFFF" />
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
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  bannerTouchArea: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(79, 70, 229, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  badgePill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 12,
    color: '#C7D2FE',
    lineHeight: 16,
  },
  groupNameText: {
    fontWeight: '700',
    color: '#F59E0B',
  },
  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 42,
  },
  closeButton: {
    padding: 2,
  },
  viewCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  viewCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 1,
  },
});

export default OTPNotificationBanner;
