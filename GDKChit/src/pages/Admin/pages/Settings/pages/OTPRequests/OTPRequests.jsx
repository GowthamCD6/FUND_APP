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
  Alert,
  Vibration,
  Share,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import LottieView from 'lottie-react-native';
import ApiService from '../../../../../../services/ApiService';
import Header from '../../../../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const { width } = Dimensions.get('window');

const OTPRequests = ({ navigation }) => {
  const { t, language } = useLanguage();
  const [otpRequests, setOtpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

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

  // Hide parent bottom tab bar while viewing OTPRequests page
  useEffect(() => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
    return () => {
      if (parentNav) {
        parentNav.setOptions({
          tabBarStyle: undefined,
        });
      }
    };
  }, [navigation]);

  // Hardware back button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const showToast = (msg) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchOTPRequests = useCallback(async () => {
    try {
      const res = await ApiService.getOTPRequests();
      if (res.success) {
        const data = res.data || [];
        setOtpRequests(data);
        
        // Check if any OTP was successfully verified
        const verifiedOTP = data.find(otp => 
          ['verified', 'approved', 'success', 'completed'].includes(otp.status)
        );
        
        if (verifiedOTP) {
          Alert.alert(
            "Verification Complete 🎉",
            "Your OTP has been verified successfully by admin.",
            [
              {
                text: "View Portfolio",
                onPress: () => navigation.navigate('Portfolio')
              }
            ]
          );
        }

        // Auto-mark pending ones as viewed
        for (const otp of data) {
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
  }, [navigation]);

  useEffect(() => {
    fetchOTPRequests();
    // Auto-refresh every 12 seconds
    const interval = setInterval(fetchOTPRequests, 12000);
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

    if (diff > 10 * 60 * 1000) {
      diff = 10 * 60 * 1000;
    }

    if (diff <= 0) return { minutes: 0, seconds: 0, expired: true };
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, expired: false };
  };

  const handleCopyOTP = (code) => {
    if (code) {
      Clipboard.setString(code);
      try {
        Vibration.vibrate(50);
      } catch (e) {}
      showToast(t('OTP copied to clipboard! 📋'));
    }
  };

  const handleShareOTP = async (otp) => {
    if (otp?.otpCode) {
      try {
        await Share.share({
          message: `My OTP verification code for ${otp.groupName || 'Chit Group'} is: ${otp.otpCode}`,
        });
      } catch (e) {}
    }
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
        <View style={styles.timerContainerExpired}>
          <MaterialCommunityIcons name="clock-alert-outline" size={14} color="#EF4444" />
          <Text style={styles.timerExpired}>{t('Expired')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.timerContainerActive}>
        <MaterialCommunityIcons name="timer-outline" size={14} color="#D97706" />
        <Text style={styles.timerText}>
          {String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
        </Text>
      </View>
    );
  };

  const renderOTPCard = (otp, index) => {
    const timeInfo = getTimeRemaining(otp.expiresAt);
    const isExpired = timeInfo.expired;
    const isVerified = ['verified', 'approved', 'success', 'completed'].includes(otp.status);
    const otpDigits = (otp.otpCode || '').split('');

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
        {/* Card Top Strip Accent */}
        <View
          style={[
            styles.cardTopBar,
            { backgroundColor: isVerified ? '#10B981' : isExpired ? '#EF4444' : '#6B46C1' },
          ]}
        />

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isVerified ? '#10B981' : isExpired ? '#EF4444' : '#F59E0B' },
              ]}
            />
            <Text style={styles.groupName} numberOfLines={1}>
              {otp.groupName || 'Chit Group'}
            </Text>
          </View>
          <CountdownTimer expiresAt={otp.expiresAt} />
        </View>

        {/* OTP Display Card */}
        <View style={styles.otpDisplayContainer}>
          <View
            style={[
              styles.otpGradient,
              { backgroundColor: isVerified ? '#065F46' : isExpired ? '#1F2937' : '#6B46C1' },
            ]}
          >
            <View style={styles.otpLabelRow}>
              <Text style={styles.otpLabel}>
                {isVerified ? t('VERIFIED CODE') : isExpired ? t('EXPIRED CODE') : t('ACTIVE OTP CODE')}
              </Text>
              <TouchableOpacity
                style={styles.cardCopyIconBtn}
                onPress={() => handleCopyOTP(otp.otpCode)}
              >
                <MaterialCommunityIcons name="content-copy" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.otpDigitsRow}>
              {otpDigits.map((digit, i) => (
                <View key={i} style={[styles.otpDigitBox, isExpired && styles.otpDigitBoxExpired]}>
                  <Text style={[styles.otpDigit, isExpired && styles.otpDigitExpired]}>
                    {isExpired ? '•' : digit}
                  </Text>
                </View>
              ))}
            </View>

            {!isExpired && !isVerified && (
              <Text style={styles.otpHint}>
                {t('Tap copy or share below to verify with admin')}
              </Text>
            )}
          </View>
        </View>

        {/* Interactive Action Footer */}
        <View style={styles.cardFooterActions}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => handleCopyOTP(otp.otpCode)}
          >
            <MaterialCommunityIcons name="content-copy" size={16} color="#6B46C1" />
            <Text style={styles.actionBtnSecondaryText}>{t('Copy OTP')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleShareOTP(otp)}
          >
            <MaterialCommunityIcons name="share-variant" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>{t('Share Code')}</Text>
          </TouchableOpacity>
        </View>

        {/* Meta Info Bar */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>
              {t('Requested at')} {new Date(otp.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={isVerified ? 'check-circle' : isExpired ? 'close-circle' : 'shield-check'}
              size={13}
              color={isVerified ? '#10B981' : isExpired ? '#EF4444' : '#6B46C1'}
            />
            <Text
              style={[
                styles.metaTextStatus,
                { color: isVerified ? '#10B981' : isExpired ? '#EF4444' : '#6B46C1' },
              ]}
            >
              {isVerified ? t('Verified') : isExpired ? t('Expired') : t('Pending Share')}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title={t('OTP Management')}
          onBack={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>{t('Fetching OTP requests...')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={t('OTP Management')}
        onBack={() => navigation.goBack()}
        showBackButton={true}
      />

      {/* Info Advice Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerIcon}>
          <MaterialCommunityIcons name="shield-lock" size={20} color="#6B46C1" />
        </View>
        <Text style={styles.infoBannerText}>
          {t('Admin requested OTP verification for chit auction approval. Share the code to authorize.')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6B46C1']}
            tintColor="#6B46C1"
          />
        }
      >
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../../../../../../animation/OTP-Verification.json')}
            autoPlay
            loop
            speed={0.5}
            style={styles.lottieAnimation}
          />
        </View>

        {otpRequests.length > 0 ? (
          otpRequests.map((otp, index) => renderOTPCard(otp, index))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-check" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{t('No Active OTP Requests')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('When your admin requests verification, your OTP codes will appear here.')}
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Toast Notification */}
      <Animated.View style={[styles.toastBanner, { opacity: toastAnim }]}>
        <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  infoBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#5B21B6',
    lineHeight: 17,
    fontWeight: '500',
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  lottieAnimation: {
    width: 170,
    height: 170,
  },

  // Card Styles
  otpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  otpCardExpired: {
    opacity: 0.75,
    borderColor: '#E5E7EB',
  },
  cardTopBar: {
    height: 4,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  timerContainerActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  timerContainerExpired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  timerExpired: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  otpDisplayContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  otpGradient: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  otpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1.5,
  },
  cardCopyIconBtn: {
    padding: 4,
  },
  otpDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpDigitBox: {
    width: 42,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitBoxExpired: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  otpDigitExpired: {
    color: 'rgba(255,255,255,0.35)',
  },
  otpHint: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    textAlign: 'center',
  },

  // Card Action Buttons
  cardFooterActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B46C1',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Meta Bar
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaTextStatus: {
    fontSize: 11.5,
    fontWeight: '600',
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
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 36,
    lineHeight: 19,
  },

  toastBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
});

export default OTPRequests;

