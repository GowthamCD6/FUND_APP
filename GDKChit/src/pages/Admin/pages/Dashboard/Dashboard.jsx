import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './DashboardStyles';
import ApiService from '../../../../services/ApiService';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchAdminNotifications = async () => {
    try {
      const response = await ApiService.makeRequest('/admin/notifications', { method: 'GET' });
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  // Financial data
  const dashboardData = {
    // This Month's Key Metrics
    monthlyTarget: '50,00,000',
    monthlyCollected: '42,50,000',
    collectionRate: '85.0',

    // Member Payment Status
    totalMembers: '1,247',
    paidMembers: '1,089',
    partialPaidMembers: '94',
    unpaidMembers: '64',

    // Overdue Information
    overdueAmount: '8,75,000',
    overdueCount: '47',

    // Group Status
    activeGroups: '46',
    completedGroups: '12',

    // Today's Activity
    todayCollection: '3,25,000',
    todayPayments: '28',
  };

  const quickActions = [
    { id: 1, title: 'Collect Payment', icon: 'cash', screen: 'CollectPayment' },
    { id: 2, title: 'Pending Payments', icon: 'clock-outline', screen: 'PendingPayments' },
    { id: 3, title: 'Add Member', icon: 'account-plus-outline', screen: 'AddMember' },
    { id: 4, title: 'Reports', icon: 'chart-line', screen: 'Reports' },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Received',
      subtitle: 'Priya Sharma',
      amount: '5,000',
      time: '5 mins ago',
    },
    {
      id: 2,
      type: 'partial',
      title: 'Partial Payment',
      subtitle: 'Rajesh Kumar',
      amount: '2,500',
      time: '20 mins ago',
    },
    {
      id: 3,
      type: 'overdue',
      title: 'Payment Overdue',
      subtitle: 'Anita Devi',
      amount: '3,000',
      time: '1 hour ago',
    },
    {
      id: 4,
      type: 'member',
      title: 'New Member',
      subtitle: 'Suresh Patel • Gold Plan',
      time: '2 hours ago',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
    fetchAdminNotifications().finally(() => {
        setRefreshing(false);
    });
  }, []);

  const handleQuickAction = (action) => {
    console.log(`Navigate to ${action.screen}`);
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'payment': return 'check-circle-outline';
      case 'partial': return 'alert-circle-outline';
      case 'overdue': return 'close-circle-outline';
      case 'member': return 'account-outline';
      default: return 'circle-outline';
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'payment': return '#10B981';
      case 'partial': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'member': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationIcon} onPress={() => setShowNotifications(true)}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#1F2937" />
          <View style={styles.notificationDot} />
          {notifications.length > 0 && (
            <View style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: '#EF4444',
                borderRadius: 10,
                minWidth: 16,
                minHeight: 16,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Monthly Collection Card */}
      <View style={styles.collectionCard}>
        <View style={styles.collectionHeader}>
          <View>
            <Text style={styles.collectionLabel}>Monthly Collection</Text>
            <Text style={styles.collectionAmount}>₹{dashboardData.monthlyCollected}</Text>
          </View>
          <View style={styles.collectionBadge}>
            <Text style={styles.collectionBadgeText}>{dashboardData.collectionRate}%</Text>
          </View>
        </View>

        <View style={styles.collectionProgress}>
          <View style={[styles.collectionProgressFill, { width: `${dashboardData.collectionRate}%` }]} />
        </View>

        <View style={styles.collectionFooter}>
          <Text style={styles.collectionTarget}>Target: ₹{dashboardData.monthlyTarget}</Text>
          <Text style={styles.collectionPending}>
            ₹{parseInt(dashboardData.monthlyTarget.replace(/,/g, '')) - parseInt(dashboardData.monthlyCollected.replace(/,/g, ''))} pending
          </Text>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Status</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusCount}>{dashboardData.paidMembers}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.statusLabel}>Paid</Text>
            <Text style={styles.statusPercentage}>
              {((parseInt(dashboardData.paidMembers.replace(/,/g, '')) / parseInt(dashboardData.totalMembers.replace(/,/g, ''))) * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusCount}>{dashboardData.partialPaidMembers}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={styles.statusLabel}>Partial</Text>
            <Text style={styles.statusPercentage}>
              {((parseInt(dashboardData.partialPaidMembers) / parseInt(dashboardData.totalMembers.replace(/,/g, ''))) * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusCount}>{dashboardData.unpaidMembers}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={styles.statusLabel}>Unpaid</Text>
            <Text style={styles.statusPercentage}>
              {((parseInt(dashboardData.unpaidMembers) / parseInt(dashboardData.totalMembers.replace(/,/g, ''))) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="account-group-outline" size={20} color="#6B7280" />
          <Text style={styles.metricValue}>{dashboardData.activeGroups}</Text>
          <Text style={styles.metricLabel}>Active Groups</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.metricValue}>{dashboardData.completedGroups}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.metricValue}>{dashboardData.overdueCount}</Text>
          <Text style={styles.metricLabel}>Overdue</Text>
        </View>
      </View>

      {/* Overdue Alert */}
      {parseInt(dashboardData.overdueCount) > 0 && (
        <View style={styles.alertCard}>
          <MaterialCommunityIcons name="alert-outline" size={18} color="#DC2626" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Overdue Payments</Text>
            <Text style={styles.alertText}>
              {dashboardData.overdueCount} members • ₹{dashboardData.overdueAmount} pending
            </Text>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleQuickAction(action)}
            >
              <MaterialCommunityIcons name={action.icon} size={20} color="#374151" />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{dashboardData.todayCollection}</Text>
            <Text style={styles.summaryLabel}>Collections</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{dashboardData.todayPayments}</Text>
            <Text style={styles.summaryLabel}>Payments</Text>
          </View>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activitiesList}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: getActivityColor(activity.type) + '15' }]}>
                <MaterialCommunityIcons 
                  name={getActivityIcon(activity.type)} 
                  size={16} 
                  color={getActivityColor(activity.type)} 
                />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <View style={styles.activityRight}>
                {activity.amount && (
                  <Text style={styles.activityAmount}>₹{activity.amount}</Text>
                )}
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacing} />

      {/* Notifications Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showNotifications}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: width * 0.9, maxHeight: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>System Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <View key={index} style={{ marginBottom: 15, padding: 15, backgroundColor: notif.type === 'danger' ? '#FEF2F2' : '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: notif.type === 'danger' ? '#FECACA' : '#FEF3C7' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <MaterialCommunityIcons 
                        name={notif.type === 'danger' ? 'alert-circle' : 'clock-alert'} 
                        size={20} 
                        color={notif.type === 'danger' ? '#EF4444' : '#F59E0B'} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={{ fontSize: 16, fontWeight: '600', color: notif.type === 'danger' ? '#991B1B' : '#B45309' }}>
                        {notif.title}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 20 }}>
                      {notif.message}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="bell-sleep" size={48} color="#D1D5DB" />
                  <Text style={{ marginTop: 15, color: '#6B7280', fontSize: 16 }}>No pending tasks or renewals.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

export default Dashboard;