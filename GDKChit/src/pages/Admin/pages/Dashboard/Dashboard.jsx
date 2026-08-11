import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './DashboardStyles';
import ApiService from '../../../../services/ApiService';
import { API_URL } from '../../../../utils/env';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [adminName, setAdminName] = useState('Admin');
  const [adminImage, setAdminImage] = useState('');
  
  // Real-time API state
  const [overviewData, setOverviewData] = useState({
    metrics: {
      activeGroups: 0,
      completedGroups: 0,
      totalMembers: 0,
      monthlyTarget: 0,
      monthlyCollected: 0,
      collectionRate: '0.0',
      paidMembers: 0,
      pendingMembers: 0,
      overdueAmount: 0,
      overdueCount: 0,
    },
    actionRequired: {
      unfilledPaymentGroups: [],
      pendingAuctionWinnerGroups: [],
      pendingMemberPayments: [],
    },
    auctionsHub: {
      recentWinners: [],
      upcomingAuctions: [],
    },
    recentActivities: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [notifRes, overviewRes] = await Promise.allSettled([
        ApiService.makeRequest('/admin/notifications', { method: 'GET' }),
        ApiService.makeRequest('/admin/dashboard-overview', { method: 'GET' }),
      ]);

      if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
        const notifData = await notifRes.value.json();
        if (notifData.success) {
          setNotifications(notifData.data || []);
        }
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
        const overviewResult = await overviewRes.value.json();
        if (overviewResult.success && overviewResult.data) {
          setOverviewData(overviewResult.data);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedImage = await AsyncStorage.getItem('userImage');

        if (storedName) setAdminName(storedName);
        if (storedImage) setAdminImage(storedImage);

        const profileRes = await ApiService.getProfile();
        if (profileRes && profileRes.success && profileRes.data) {
          const u = profileRes.data.user || {};
          const p = profileRes.data.profile || {};
          const name = u.username || u.name || p.name || storedName || 'Admin';
          const img = p.userImage || p.user_image || u.userImage || u.user_image || storedImage || '';

          if (name) setAdminName(name);
          if (img) setAdminImage(img);
        }
      } catch (err) {
        console.error('Error fetching admin profile in Dashboard:', err);
      }
    };

    loadAdminProfile();
    fetchDashboardData();
  }, []);

  const getProfileImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    const cleanPath = img.startsWith('/') ? img : `/${img}`;
    const baseUrl = (API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${cleanPath}`;
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const quickActions = [
    { id: 1, title: 'Manage Groups', icon: 'account-group', screen: 'ManageG' },
    { id: 2, title: 'Auction Setup', icon: 'gavel', screen: 'AuctionSettings' },
    { id: 3, title: 'Reports & Chit', icon: 'chart-line', screen: 'Reports' },
    { id: 4, title: 'Notifications', icon: 'bell-ring-outline', screen: 'AdminNotification' },
  ];

  const handleQuickAction = (action) => {
    if (action.screen) {
      navigation.navigate(action.screen);
    }
  };

  const totalActionCount = 
    (overviewData.actionRequired?.unfilledPaymentGroups?.length || 0) +
    (overviewData.actionRequired?.pendingAuctionWinnerGroups?.length || 0) +
    (overviewData.actionRequired?.pendingMemberPayments?.length || 0);

  const renderOverviewTab = () => (
    <>
      {/* Monthly Collection Progress Card */}
      <View style={styles.collectionCard}>
        <View style={styles.collectionHeader}>
          <View>
            <Text style={styles.collectionLabel}>This Month's Collections</Text>
            <Text style={styles.collectionAmount}>
              {formatCurrency(overviewData.metrics.monthlyCollected)}
            </Text>
          </View>
          <View style={styles.collectionBadge}>
            <Text style={styles.collectionBadgeText}>
              {overviewData.metrics.collectionRate}%
            </Text>
          </View>
        </View>

        <View style={styles.collectionProgress}>
          <View
            style={[
              styles.collectionProgressFill,
              { width: `${Math.min(100, parseFloat(overviewData.metrics.collectionRate) || 0)}%` },
            ]}
          />
        </View>

        <View style={styles.collectionFooter}>
          <Text style={styles.collectionTarget}>
            Target: {formatCurrency(overviewData.metrics.monthlyTarget)}
          </Text>
          <Text style={styles.collectionPending}>
            {formatCurrency(Math.max(0, overviewData.metrics.monthlyTarget - overviewData.metrics.monthlyCollected))} pending
          </Text>
        </View>
      </View>

      {/* Payment Status Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member Payment Status</Text>
        <View style={styles.statusGrid}>
          <TouchableOpacity
            style={styles.statusCard}
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.7}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusCount}>{overviewData.metrics.paidMembers}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.statusLabel}>Paid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusCard}
            onPress={() => setActiveTab('actions')}
            activeOpacity={0.7}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusCount}>{overviewData.metrics.pendingMembers}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={styles.statusLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusCard}
            onPress={() => setActiveTab('actions')}
            activeOpacity={0.7}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusCount}>{overviewData.metrics.overdueCount}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={styles.statusLabel}>Overdue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Key Group Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="account-group-outline" size={22} color="#6B46C1" />
          <Text style={styles.metricValue}>{overviewData.metrics.activeGroups}</Text>
          <Text style={styles.metricLabel}>Active Groups</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="check-circle-outline" size={22} color="#10B981" />
          <Text style={styles.metricValue}>{overviewData.metrics.completedGroups}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="account-multiple-check" size={22} color="#3B82F6" />
          <Text style={styles.metricValue}>{overviewData.metrics.totalMembers}</Text>
          <Text style={styles.metricLabel}>Total Members</Text>
        </View>
      </View>

      {/* Urgent Admin Tasks (Replaces Quick Module Access) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Urgent Admin Tasks</Text>
          {totalActionCount > 0 && (
            <TouchableOpacity onPress={() => setActiveTab('actions')}>
              <Text style={styles.viewAllLink}>View All ({totalActionCount})</Text>
            </TouchableOpacity>
          )}
        </View>

        {totalActionCount === 0 ? (
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#BBF7D0', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MaterialCommunityIcons name="check-decagram" size={28} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#15803D' }}>All Systems Operational</Text>
              <Text style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>All group monthly payment rules and auction winners are up to date!</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {overviewData.actionRequired.unfilledPaymentGroups.length > 0 && (
              <TouchableOpacity 
                style={styles.actionCardContainer}
                onPress={() => navigation.navigate('ManageG')}
                activeOpacity={0.8}
              >
                <View style={styles.actionCardHeader}>
                  <View style={styles.actionTitleRow}>
                    <MaterialCommunityIcons name="clipboard-alert-outline" size={22} color="#D97706" />
                    <View>
                      <Text style={styles.actionItemTitle}>Unfilled Payment Rules</Text>
                      <Text style={styles.actionItemSub}>{overviewData.actionRequired.unfilledPaymentGroups.length} groups need monthly configuration</Text>
                    </View>
                  </View>
                  <View style={[styles.actionButtonInline, { backgroundColor: '#D97706' }]}>
                    <Text style={styles.actionButtonInlineText}>Setup</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {overviewData.actionRequired.pendingAuctionWinnerGroups.length > 0 && (
              <TouchableOpacity 
                style={styles.actionCardContainer}
                onPress={() => navigation.navigate('ManageG')}
                activeOpacity={0.8}
              >
                <View style={styles.actionCardHeader}>
                  <View style={styles.actionTitleRow}>
                    <MaterialCommunityIcons name="trophy-broken" size={22} color="#2563EB" />
                    <View>
                      <Text style={styles.actionItemTitle}>Auction Winner Required</Text>
                      <Text style={styles.actionItemSub}>{overviewData.actionRequired.pendingAuctionWinnerGroups.length} groups awaiting winner record</Text>
                    </View>
                  </View>
                  <View style={[styles.actionButtonInline, { backgroundColor: '#2563EB' }]}>
                    <Text style={styles.actionButtonInlineText}>Record</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {overviewData.metrics.overdueCount > 0 && (
              <TouchableOpacity 
                style={styles.actionCardContainer}
                onPress={() => setActiveTab('actions')}
                activeOpacity={0.8}
              >
                <View style={styles.actionCardHeader}>
                  <View style={styles.actionTitleRow}>
                    <MaterialCommunityIcons name="account-alert" size={22} color="#DC2626" />
                    <View>
                      <Text style={styles.actionItemTitle}>Overdue Collections</Text>
                      <Text style={styles.actionItemSub}>{overviewData.metrics.overdueCount} members • {formatCurrency(overviewData.metrics.overdueAmount)} pending</Text>
                    </View>
                  </View>
                  <View style={[styles.actionButtonInline, { backgroundColor: '#DC2626' }]}>
                    <Text style={styles.actionButtonInlineText}>Review</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Recent Activity List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.viewAllLink}>Reports</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activitiesList}>
          {overviewData.recentActivities && overviewData.recentActivities.length > 0 ? (
            overviewData.recentActivities.map((activity, idx) => (
              <View key={activity.id || idx} style={styles.activityItem}>
                <View style={[styles.activityIconContainer, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="cash-check" size={18} color="#6B46C1" />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>{activity.user_name || 'Member Payment'}</Text>
                  <Text style={styles.activitySubtitle}>{activity.group_name || 'Group'}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityAmount}>{formatCurrency(activity.amount)}</Text>
                  <Text style={styles.activityTime}>
                    {activity.status ? activity.status.toUpperCase() : 'PAID'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>No recent activity records</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );

  const renderActionRequiredTab = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Group Missing Payment Details */}
      {overviewData.actionRequired.unfilledPaymentGroups.length > 0 && (
        <View style={styles.warningBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.warningBoxTitle}>
              ⚠️ Payment Details Missing ({overviewData.actionRequired.unfilledPaymentGroups.length} Groups)
            </Text>
            <Text style={styles.warningBoxSub}>
              Monthly contribution, discount, or commission not set for this month.
            </Text>
          </View>
        </View>
      )}

      {overviewData.actionRequired.unfilledPaymentGroups.map((group) => (
        <View key={`unfilled-${group.id}`} style={styles.actionCardContainer}>
          <View style={styles.actionCardHeader}>
            <View style={styles.actionTitleRow}>
              <MaterialCommunityIcons name="circle-edit-outline" size={20} color="#D97706" />
              <Text style={styles.actionItemTitle}>{group.group_name}</Text>
            </View>
            <TouchableOpacity
              style={styles.actionButtonInline}
              onPress={() => navigation.navigate('ManageG')}
            >
              <Text style={styles.actionButtonInlineText}>Fill Details</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.actionItemSub}>
            Payment rules & discount amounts need setup before monthly collection begins.
          </Text>
        </View>
      ))}

      {/* Pending Auction Winners */}
      {overviewData.actionRequired.pendingAuctionWinnerGroups.length > 0 && (
        <View style={[styles.warningBox, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.warningBoxTitle, { color: '#1E40AF' }]}>
              🏆 Auction Winner Required ({overviewData.actionRequired.pendingAuctionWinnerGroups.length} Groups)
            </Text>
            <Text style={[styles.warningBoxSub, { color: '#1E3A8A' }]}>
              Current month's chit winner hasn't been saved yet.
            </Text>
          </View>
        </View>
      )}

      {overviewData.actionRequired.pendingAuctionWinnerGroups.map((group) => (
        <View key={`winner-${group.id}`} style={styles.actionCardContainer}>
          <View style={styles.actionCardHeader}>
            <View style={styles.actionTitleRow}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color="#2563EB" />
              <Text style={styles.actionItemTitle}>{group.group_name}</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButtonInline, { backgroundColor: '#2563EB' }]}
              onPress={() => navigation.navigate('ManageG')}
            >
              <Text style={styles.actionButtonInlineText}>Set Winner</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.actionItemSub}>
            Run live auction or manually record winner details in Group Manage.
          </Text>
        </View>
      ))}

      {/* Member Pending Payments */}
      <Text style={[styles.sectionTitle, { marginTop: 12, marginBottom: 12 }]}>
        Pending Member Collections ({overviewData.actionRequired.pendingMemberPayments.length})
      </Text>

      {overviewData.actionRequired.pendingMemberPayments.length === 0 ? (
        <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12 }}>
          <MaterialCommunityIcons name="check-circle-outline" size={40} color="#10B981" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 10 }}>All clear!</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>No pending payments to follow up.</Text>
        </View>
      ) : (
        overviewData.actionRequired.pendingMemberPayments.map((item) => (
          <View key={`pending-pay-${item.id}`} style={styles.actionCardContainer}>
            <View style={styles.actionCardHeader}>
              <View style={styles.actionTitleRow}>
                <MaterialCommunityIcons name="account-clock" size={22} color="#DC2626" />
                <View>
                  <Text style={styles.actionItemTitle}>{item.user_name}</Text>
                  <Text style={styles.actionItemSub}>{item.group_name} • Ph: {item.user_phone || 'N/A'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#DC2626' }}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>
                {item.days_overdue > 0 ? `${item.days_overdue} Days Overdue` : 'Due Today'}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                onPress={() => navigation.navigate('Reports')}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151' }}>View Chit Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAuctionsTab = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Live Auction Launch & Controls Banner */}
      <View style={styles.predictionCard}>
        <View style={styles.predictionHeader}>
          <MaterialCommunityIcons name="gavel" size={24} color="#6B46C1" />
          <Text style={styles.predictionTitle}>Auction Hub & Live Controls</Text>
        </View>

        <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }}>
          Launch live betting or random draw auctions, manage active rounds, and review past chit winners.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#6B46C1',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
            marginTop: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
          onPress={() => navigation.navigate('AuctionSettings')}
        >
          <MaterialCommunityIcons name="play-circle-outline" size={20} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Open Auction Center</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Auction Winners */}
      <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>
        Recent Auction Winners ({overviewData.auctionsHub?.recentWinners?.length || 0})
      </Text>

      {!overviewData.auctionsHub?.recentWinners || overviewData.auctionsHub.recentWinners.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16 }}>
          <MaterialCommunityIcons name="trophy-outline" size={36} color="#9CA3AF" />
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>No auction winners recorded yet</Text>
        </View>
      ) : (
        overviewData.auctionsHub.recentWinners.map((winner) => (
          <View key={`winner-record-${winner.id}`} style={styles.actionCardContainer}>
            <View style={styles.actionCardHeader}>
              <View style={styles.actionTitleRow}>
                <MaterialCommunityIcons name="trophy" size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionItemTitle}>{winner.winner_name}</Text>
                  <Text style={styles.actionItemSub}>{winner.group_name} • Ph: {winner.winner_member_phone || 'N/A'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#059669' }}>
                {formatCurrency(winner.amount_taken)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>
                Period: {winner.collection_period ? new Date(winner.collection_period).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Current Month'}
              </Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                {winner.auction_date ? new Date(winner.auction_date).toLocaleDateString('en-IN') : ''}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Upcoming Auctions Schedule */}
      <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>
        Upcoming Group Auctions
      </Text>

      {!overviewData.auctionsHub?.upcomingAuctions || overviewData.auctionsHub.upcomingAuctions.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12 }}>
          <MaterialCommunityIcons name="calendar-clock" size={36} color="#9CA3AF" />
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>No upcoming group auctions scheduled</Text>
        </View>
      ) : (
        overviewData.auctionsHub.upcomingAuctions.map((g) => (
          <View key={`upcoming-${g.id}`} style={styles.actionCardContainer}>
            <View style={styles.actionCardHeader}>
              <View style={styles.actionTitleRow}>
                <MaterialCommunityIcons name="calendar-blank" size={20} color="#6B46C1" />
                <Text style={styles.actionItemTitle}>{g.group_name}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B46C1' }}>
                {formatCurrency(g.group_amount)}
              </Text>
            </View>
            <Text style={styles.actionItemSub}>
              Start Date: {g.start_date ? new Date(g.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled Soon'}
            </Text>
          </View>
        ))
      )}
    </View>
  );
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            {adminImage && getProfileImageUrl(adminImage) ? (
              <Image
                source={{ uri: getProfileImageUrl(adminImage) }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(adminName)}</Text>
            )}
            <View style={styles.onlineDot} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{adminName}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons name="calendar-month" size={13} color="#6B46C1" />
            <Text style={styles.dateBadgeText}>
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('AdminNotification')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#1F2937" />
            {notifications.length > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {notifications.length > 99 ? '99+' : notifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard View Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'actions' && styles.activeTabButton]}
          onPress={() => setActiveTab('actions')}
        >
          <Text style={[styles.tabText, activeTab === 'actions' && styles.activeTabText]}>
            Action Required
          </Text>
          {totalActionCount > 0 && (
            <View
              style={[
                styles.tabInlineBadge,
                activeTab === 'actions' ? styles.activeTabInlineBadge : styles.inactiveTabInlineBadge,
              ]}
            >
              <Text
                style={[
                  activeTab === 'actions'
                    ? styles.activeTabInlineBadgeText
                    : styles.inactiveTabInlineBadgeText,
                ]}
              >
                {totalActionCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'auctions' && styles.activeTabButton]}
          onPress={() => setActiveTab('auctions')}
        >
          <Text style={[styles.tabText, activeTab === 'auctions' && styles.activeTabText]}>
            Auction Hub
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content View Switcher */}
      {loading && !refreshing ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>Loading dynamic dashboard metrics...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'actions' && renderActionRequiredTab()}
          {activeTab === 'auctions' && renderAuctionsTab()}
        </>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

export default Dashboard;