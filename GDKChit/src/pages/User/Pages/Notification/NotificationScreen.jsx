import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  DeviceEventEmitter,
  BackHandler,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../../components/HeaderComponent/Header';
import ApiService from '../../../../services/ApiService';
import { useLanguage } from '../../../../utils/LanguageContext';
import styles from './NotificationStyles';

const CACHE_KEY = 'cached_user_notifications';
const READ_IDS_KEY = 'read_notification_ids';
const CLEARED_IDS_KEY = 'cleared_notification_ids';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(new Set());
  const [clearedNotifIds, setClearedNotifIds] = useState(new Set());
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'PAYMENTS' | 'OTP' | 'ANNOUNCEMENTS'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      navigation.goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation]);

  // Load cached notifications and stored read/cleared states instantly (< 5ms)
  useEffect(() => {
    let isMounted = true;

    const loadLocalCache = async () => {
      try {
        const [cachedData, storedRead, storedCleared] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY),
          AsyncStorage.getItem(READ_IDS_KEY),
          AsyncStorage.getItem(CLEARED_IDS_KEY),
        ]);

        if (!isMounted) return;

        if (storedRead) {
          try {
            setReadNotifIds(new Set(JSON.parse(storedRead)));
          } catch (_) {}
        }
        if (storedCleared) {
          try {
            setClearedNotifIds(new Set(JSON.parse(storedCleared)));
          } catch (_) {}
        }

        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNotifications(parsed);
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn('⚠️ [NotificationScreen] Failed to load local cache:', err);
      }
    };

    loadLocalCache();

    // Concurrently fetch the latest fresh data from the server in background
    fetchFreshNotifications(false);

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live notifications securely from backend with JWT authentication
  const fetchFreshNotifications = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);

    try {
      const response = await ApiService.getNotifications();
      if (response && response.success && Array.isArray(response.data)) {
        setNotifications(response.data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data)).catch(() => {});
        DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
      }
    } catch (error) {
      console.warn('⚠️ [NotificationScreen] Error fetching notifications:', error?.message);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFreshNotifications(false).finally(() => {
      setRefreshing(false);
    });
  }, []);

  // Real-time notification socket listener
  useEffect(() => {
    const realtimeSub = DeviceEventEmitter.addListener('REALTIME_NOTIFICATION_RECEIVED', (newItem) => {
      if (!newItem) return;
      setNotifications((prev) => {
        const existingIdx = prev.findIndex((n) => n.id === newItem.id);
        let updated;
        if (existingIdx !== -1) {
          updated = [...prev];
          updated[existingIdx] = newItem;
        } else {
          updated = [newItem, ...prev];
        }
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
    });

    const refreshSub = DeviceEventEmitter.addListener('REFRESH_NOTIFICATIONS', () => {
      fetchFreshNotifications(false);
    });

    return () => {
      realtimeSub.remove();
      refreshSub.remove();
    };
  }, []);

  // Mark all visible notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const allIds = new Set(readNotifIds);
      notifications.forEach((n, idx) => {
        const id = n.id || `notif-${idx}`;
        allIds.add(id);
      });
      setReadNotifIds(allIds);
      await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...allIds]));
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
    } catch (e) {
      console.warn('Error marking all notifications as read:', e);
    }
  };

  // Mark single notification as read
  const handleMarkSingleAsRead = async (id) => {
    if (!id || readNotifIds.has(id)) return;
    try {
      const updated = new Set(readNotifIds);
      updated.add(id);
      setReadNotifIds(updated);
      await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...updated]));
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
    } catch (e) {}
  };

  // Clear a single notification
  const handleClearSingleNotification = async (id) => {
    if (!id) return;
    try {
      const updated = new Set(clearedNotifIds);
      updated.add(id);
      setClearedNotifIds(updated);
      await AsyncStorage.setItem(CLEARED_IDS_KEY, JSON.stringify([...updated]));
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
    } catch (e) {}
  };

  // Prompt confirmation before clearing all notifications
  const handleConfirmClearAll = () => {
    Alert.alert(
      t('Clear all notifications?') || 'Clear all notifications?',
      t('This will remove all notification alerts from your list.') ||
        'This will remove all notification alerts from your list.',
      [
        { text: t('Cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('Clear all') || 'Clear all',
          style: 'destructive',
          onPress: async () => {
            try {
              const allCleared = new Set(clearedNotifIds);
              notifications.forEach((n, idx) => {
                const id = n.id || `notif-${idx}`;
                allCleared.add(id);
              });
              setClearedNotifIds(allCleared);
              await AsyncStorage.setItem(CLEARED_IDS_KEY, JSON.stringify([...allCleared]));
              DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED');
            } catch (e) {}
          },
        },
      ]
    );
  };

  // Navigation action based on notification type
  const handleNotificationPress = (notif, notifId) => {
    handleMarkSingleAsRead(notifId);

    if (notif.type === 'otp_request' || notif.otpRequestId) {
      navigation.navigate('OTPRequests');
    } else if (
      notif.type === 'danger' ||
      notif.type === 'warning' ||
      String(notif.title || '').toLowerCase().includes('payment')
    ) {
      navigation.navigate('DueCalendar');
    } else if (
      String(notif.title || '').toLowerCase().includes('auction') ||
      notif.groupId
    ) {
      if (notif.groupId) {
        navigation.navigate('AuctionScreen', { groupId: String(notif.groupId) });
      } else {
        navigation.navigate('DueCalendar');
      }
    }
  };

  // Calculate unread count and filter notifications
  const visibleNotifications = useMemo(() => {
    return notifications.filter((n, idx) => {
      const id = n.id || `notif-${idx}`;
      return !clearedNotifIds.has(id);
    });
  }, [notifications, clearedNotifIds]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((n, idx) => {
      const id = n.id || `notif-${idx}`;
      return !readNotifIds.has(id);
    }).length;
  }, [visibleNotifications, readNotifIds]);

  // Counts by category
  const counts = useMemo(() => {
    let unread = 0;
    let payments = 0;
    let otp = 0;
    let announcements = 0;

    visibleNotifications.forEach((n, idx) => {
      const id = n.id || `notif-${idx}`;
      const isUnread = !readNotifIds.has(id);
      if (isUnread) unread += 1;

      const type = String(n.type || '').toLowerCase();
      const title = String(n.title || '').toLowerCase();

      if (type === 'otp_request' || n.otpRequestId) {
        otp += 1;
      } else if (type === 'danger' || type === 'warning' || title.includes('payment') || title.includes('due')) {
        payments += 1;
      } else {
        announcements += 1;
      }
    });

    return { all: visibleNotifications.length, unread, payments, otp, announcements };
  }, [visibleNotifications, readNotifIds]);

  // Filtered list based on active tab and search query
  const filteredNotifications = useMemo(() => {
    return visibleNotifications.filter((n, idx) => {
      const id = n.id || `notif-${idx}`;
      const isRead = readNotifIds.has(id);
      const type = String(n.type || '').toLowerCase();
      const title = String(n.title || '').toLowerCase();
      const message = String(n.message || '').toLowerCase();

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = title.includes(q) || message.includes(q);
        if (!matches) return false;
      }

      // Tab Category filter
      if (selectedFilter === 'UNREAD') {
        return !isRead;
      } else if (selectedFilter === 'PAYMENTS') {
        return type === 'danger' || type === 'warning' || title.includes('payment') || title.includes('due');
      } else if (selectedFilter === 'OTP') {
        return type === 'otp_request' || Boolean(n.otpRequestId);
      } else if (selectedFilter === 'ANNOUNCEMENTS') {
        return type !== 'otp_request' && !n.otpRequestId && type !== 'danger' && type !== 'warning' && !title.includes('payment');
      }

      return true; // 'ALL'
    });
  }, [visibleNotifications, selectedFilter, searchQuery, readNotifIds]);

  // Format relative timestamp
  const formatTimestamp = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch (_) {
      return 'Recently';
    }
  };

  // Helper for notification styling tokens
  const getNotificationTheme = (notif, isRead) => {
    const type = String(notif.type || '').toLowerCase();
    const title = String(notif.title || '').toLowerCase();

    if (type === 'otp_request' || notif.otpRequestId) {
      return {
        cardStyle: styles.cardOtp,
        iconBg: '#F3E8FF',
        iconName: 'shield-key-outline',
        iconColor: '#411E73',
        titleColor: isRead ? '#475569' : '#1E293B',
        tagText: 'Security OTP',
        tagBg: '#F3E8FF',
        tagColor: '#411E73',
        actionLabel: 'View OTP',
        actionIcon: 'arrow-right',
      };
    }

    if (type === 'danger' || title.includes('overdue')) {
      return {
        cardStyle: styles.cardOverdue,
        iconBg: '#FEE2E2',
        iconName: 'alert-circle',
        iconColor: '#DC2626',
        titleColor: isRead ? '#475569' : '#991B1B',
        tagText: 'Overdue',
        tagBg: '#FEE2E2',
        tagColor: '#991B1B',
        actionLabel: 'Pay Now',
        actionIcon: 'chevron-right',
      };
    }

    if (type === 'warning' || title.includes('due') || title.includes('reminder')) {
      return {
        cardStyle: styles.cardWarning,
        iconBg: '#FEF3C7',
        iconName: 'clock-alert-outline',
        iconColor: '#D97706',
        titleColor: isRead ? '#475569' : '#92400E',
        tagText: 'Due Soon',
        tagBg: '#FEF3C7',
        tagColor: '#B45309',
        actionLabel: 'View Due',
        actionIcon: 'chevron-right',
      };
    }

    return {
      cardStyle: isRead ? {} : styles.cardUnread,
      iconBg: '#F3E8FF',
      iconName: 'bullhorn-outline',
      iconColor: '#411E73',
      titleColor: isRead ? '#475569' : '#1E293B',
      tagText: 'Announcement',
      tagBg: '#F3E8FF',
      tagColor: '#411E73',
      actionLabel: null,
      actionIcon: null,
    };
  };

  // Header right component with search, mark-all, and clear-all
  const renderHeaderRight = () => (
    <View style={styles.headerActions}>
      {unreadCount > 0 && (
        <View style={styles.unreadHeaderBadge}>
          <Text style={styles.unreadHeaderBadgeText}>
            {unreadCount} {t('New') || 'New'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.headerIconBtn, isSearching && styles.headerIconBtnActive]}
        onPress={() => {
          setIsSearching((prev) => !prev);
          if (isSearching) setSearchQuery('');
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons
          name={isSearching ? 'close' : 'magnify'}
          size={20}
          color={isSearching ? '#411E73' : '#475569'}
        />
      </TouchableOpacity>

      {visibleNotifications.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons
              name="check-all"
              size={20}
              color={unreadCount > 0 ? '#411E73' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleConfirmClearAll}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={19} color="#EF4444" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Standard App Header */}
      <Header
        title={t('Notifications')}
        onBack={() => navigation.goBack()}
        showBackButton={true}
        rightComponent={renderHeaderRight()}
      />

      {/* Expandable Search Input */}
      {isSearching && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('Search notifications...') || 'Search notifications...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Category Chips Bar */}
      <View style={styles.chipsScrollView}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {/* ALL */}
          <TouchableOpacity
            style={[styles.chip, selectedFilter === 'ALL' && styles.chipActive]}
            onPress={() => setSelectedFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedFilter === 'ALL' && styles.chipTextActive]}>
              {t('All') || 'All'}
            </Text>
            <View
              style={selectedFilter === 'ALL' ? styles.chipBadge : styles.chipBadgeInactive}
            >
              <Text
                style={
                  selectedFilter === 'ALL' ? styles.chipBadgeText : styles.chipBadgeTextInactive
                }
              >
                {counts.all}
              </Text>
            </View>
          </TouchableOpacity>

          {/* UNREAD */}
          <TouchableOpacity
            style={[styles.chip, selectedFilter === 'UNREAD' && styles.chipActive]}
            onPress={() => setSelectedFilter('UNREAD')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedFilter === 'UNREAD' && styles.chipTextActive]}>
              {t('Unread') || 'Unread'}
            </Text>
            {counts.unread > 0 && (
              <View
                style={
                  selectedFilter === 'UNREAD' ? styles.chipBadge : styles.chipBadgeInactive
                }
              >
                <Text
                  style={
                    selectedFilter === 'UNREAD'
                      ? styles.chipBadgeText
                      : styles.chipBadgeTextInactive
                  }
                >
                  {counts.unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* PAYMENTS */}
          <TouchableOpacity
            style={[styles.chip, selectedFilter === 'PAYMENTS' && styles.chipActive]}
            onPress={() => setSelectedFilter('PAYMENTS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedFilter === 'PAYMENTS' && styles.chipTextActive]}>
              {t('Payments') || 'Payments'}
            </Text>
            {counts.payments > 0 && (
              <View
                style={
                  selectedFilter === 'PAYMENTS' ? styles.chipBadge : styles.chipBadgeInactive
                }
              >
                <Text
                  style={
                    selectedFilter === 'PAYMENTS'
                      ? styles.chipBadgeText
                      : styles.chipBadgeTextInactive
                  }
                >
                  {counts.payments}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* OTP */}
          <TouchableOpacity
            style={[styles.chip, selectedFilter === 'OTP' && styles.chipActive]}
            onPress={() => setSelectedFilter('OTP')}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedFilter === 'OTP' && styles.chipTextActive]}>
              {t('Security & OTP') || 'Security & OTP'}
            </Text>
            {counts.otp > 0 && (
              <View
                style={
                  selectedFilter === 'OTP' ? styles.chipBadge : styles.chipBadgeInactive
                }
              >
                <Text
                  style={
                    selectedFilter === 'OTP'
                      ? styles.chipBadgeText
                      : styles.chipBadgeTextInactive
                  }
                >
                  {counts.otp}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ANNOUNCEMENTS */}
          <TouchableOpacity
            style={[styles.chip, selectedFilter === 'ANNOUNCEMENTS' && styles.chipActive]}
            onPress={() => setSelectedFilter('ANNOUNCEMENTS')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                selectedFilter === 'ANNOUNCEMENTS' && styles.chipTextActive,
              ]}
            >
              {t('Announcements') || 'Announcements'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notification Cards List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#411E73']}
            tintColor="#411E73"
          />
        }
      >
        {loading && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#411E73" />
          </View>
        )}

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif, index) => {
            const notifId = notif.id || `notif-${index}`;
            const isRead = readNotifIds.has(notifId);
            const theme = getNotificationTheme(notif, isRead);

            return (
              <TouchableOpacity
                key={notifId}
                activeOpacity={0.85}
                onPress={() => handleNotificationPress(notif, notifId)}
                style={[styles.card, theme.cardStyle, isRead && { opacity: 0.82 }]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                      <MaterialCommunityIcons
                        name={theme.iconName}
                        size={20}
                        color={theme.iconColor}
                      />
                    </View>
                    {!isRead && <View style={styles.unreadDot} />}
                    <Text
                      style={[styles.cardTitle, { color: theme.titleColor }]}
                      numberOfLines={2}
                    >
                      {notif.title}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => handleClearSingleNotification(notifId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Card Message Body */}
                <Text style={styles.cardMessage}>{notif.message}</Text>

                {/* Card Footer with Timestamp & CTA */}
                <View style={styles.cardFooter}>
                  <Text style={styles.timestampText}>{formatTimestamp(notif.date)}</Text>

                  {theme.actionLabel ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleNotificationPress(notif, notifId)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>
                        {t(theme.actionLabel) || theme.actionLabel}
                      </Text>
                      <MaterialCommunityIcons
                        name={theme.actionIcon}
                        size={14}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: theme.tagBg }]}>
                      <Text style={[styles.statusBadgeText, { color: theme.tagColor }]}>
                        {isRead ? t('Read') || 'Read' : t('New') || 'New'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={42} color="#411E73" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? t('No matching notifications') || 'No matching notifications'
                : t('No new notifications') || 'No new notifications'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? t('Try adjusting your search query') || 'Try adjusting your search query.'
                : t('All caught up!') || 'All caught up! New alerts will show up right here.'}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchFreshNotifications(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>{t('Refresh') || 'Refresh'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

export default NotificationScreen;
