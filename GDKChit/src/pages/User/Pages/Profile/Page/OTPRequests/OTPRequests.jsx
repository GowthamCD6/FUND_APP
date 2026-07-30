import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../../../services/ApiService';

const { width } = Dimensions.get('window');

const OTPRequests = ({ navigation }) => {
  const [otpRequests, setOtpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Pulse animation for OTP code
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Hardware back button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const fetchOTPRequests = useCallback(async () => {
    try {
      const res = await ApiService.getOTPRequests();
      if (res.success) {
        setOtpRequests(res.data || []);
        // Auto-mark pending ones as viewed
        for (const otp of res.data || []) {
          if (otp.status === 'pending') {
            ApiService.markOTPViewed(otp.id).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Error fetching OTP requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOTPRequests();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchOTPRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchOTPRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOTPRequests();
  };

  const getTimeRemaining = (expiresAt) => {
    const now = Date.now();
    const expiry = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime();
    let diff = expiry - now;

    // Safety cap: max 10 minutes (600,000 ms)
    if (diff > 10 * 60 * 1000) {
      diff = 10 * 60 * 1000;
    }

    if (diff <= 0) return { minutes: 0, seconds: 0, expired: true };
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, expired: false };
  };

  const CountdownTimer = ({ expiresAt }) => {
    const [time, setTime] = useState(getTimeRemaining(expiresAt));

    useEffect(() => {
      const timer = setInterval(() => {
        setTime(getTimeRemaining(expiresAt));
      }, 1000);
      return () => clearInterval(timer);
    }, [expiresAt]);

    if (time.expired) {
      return (
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer-off" size={16} color="#EF4444" />
          <Text style={styles.timerExpired}>Expired</Text>
        </View>
      );
    }

    return (
      <View style={styles.timerContainer}>
        <MaterialCommunityIcons name="timer-outline" size={16} color="#F59E0B" />
        <Text style={styles.timerText}>
          {String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
        </Text>
      </View>
    );
  };

  const renderOTPCard = (otp, index) => {
    const timeInfo = getTimeRemaining(otp.expiresAt);
    const isExpired = timeInfo.expired;
    const otpDigits = otp.otpCode.split('');

    return (
      <Animated.View
        key={otp.id}
        style={[
          styles.otpCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          isExpired && styles.otpCardExpired,
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: isExpired ? '#EF4444' : '#10B981' }]} />
            <Text style={styles.groupName}>{otp.groupName}</Text>
          </View>
          <CountdownTimer expiresAt={otp.expiresAt} />
        </View>

        {/* OTP Display */}
        <Animated.View
          style={[
            styles.otpDisplayContainer,
            !isExpired && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View
            style={[styles.otpGradient, { backgroundColor: isExpired ? '#1F2937' : '#4F46E5' }]}
          >
            <Text style={styles.otpLabel}>
              {isExpired ? 'OTP EXPIRED' : 'YOUR OTP CODE'}
            </Text>
            <View style={styles.otpDigitsRow}>
              {otpDigits.map((digit, i) => (
                <View key={i} style={[styles.otpDigitBox, isExpired && styles.otpDigitBoxExpired]}>
                  <Text style={[styles.otpDigit, isExpired && styles.otpDigitExpired]}>
                    {isExpired ? '•' : digit}
                  </Text>
                </View>
              ))}
            </View>
            {!isExpired && (
              <Text style={styles.otpHint}>
                Show this code to admin for verification
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
            <Text style={styles.footerText}>
              {new Date(otp.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons
              name={isExpired ? 'close-circle' : otp.status === 'viewed' ? 'eye' : 'bell-ring'}
              size={14}
              color={isExpired ? '#EF4444' : '#6366F1'}
            />
            <Text style={[styles.footerText, { color: isExpired ? '#EF4444' : '#6366F1' }]}>
              {isExpired ? 'Expired' : otp.status === 'viewed' ? 'Viewed' : 'New'}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OTP Requests</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading OTP requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OTP Requests</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={22} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#6366F1" />
        <Text style={styles.infoBannerText}>
          Admin has requested OTP verification. Share the code with admin to verify your payment.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {otpRequests.length > 0 ? (
          otpRequests.map((otp, index) => renderOTPCard(otp, index))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-check" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Active OTP Requests</Text>
            <Text style={styles.emptySubtitle}>
              When admin requests verification, your OTP code will appear here.
            </Text>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  otpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  otpCardExpired: {
    opacity: 0.6,
    borderColor: '#D1D5DB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    fontVariant: ['tabular-nums'],
  },
  timerExpired: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  otpDisplayContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  otpGradient: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  otpDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpDigitBox: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitBoxExpired: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  otpDigit: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  otpDigitExpired: {
    color: 'rgba(255,255,255,0.3)',
  },
  otpHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 14,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

export default OTPRequests;
