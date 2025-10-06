import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import styles from '../styles/DashboardStyles';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  // Sample data - In real app, this would come from API
  const dashboardData = {
    totalFunds: '₹2,45,00,000',
    activeMembers: '1,247',
    totalGroups: '58',
    pendingPayments: '₹15,75,000',
    monthlyCollection: '₹45,20,000',
    completedGroups: '12',
    newMembersToday: '18',
    overduePayments: '₹2,85,000',
  };

  const quickActions = [
    {
      id: 1,
      title: 'Add Member',
      icon: 'account-plus',
      color: '#10B981',
      screen: 'AddMember',
    },
    {
      id: 2,
      title: 'Create Group',
      icon: 'account-group-outline',
      color: '#3B82F6',
      screen: 'CreateGroup',
    },
    {
      id: 3,
      title: 'Collect Payment',
      icon: 'cash-multiple',
      color: '#F59E0B',
      screen: 'CollectPayment',
    },
    {
      id: 4,
      title: 'Generate Report',
      icon: 'file-document-outline',
      color: '#8B5CF6',
      screen: 'GenerateReport',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'New member registered',
      member: 'Priya Sharma',
      time: '2 mins ago',
      icon: 'account-plus',
      color: '#10B981',
    },
    {
      id: 2,
      action: 'Payment received',
      member: 'Rajesh Kumar',
      amount: '₹5,000',
      time: '15 mins ago',
      icon: 'cash',
      color: '#3B82F6',
    },
    {
      id: 3,
      action: 'Group completed',
      group: 'Gold Plan - Group 15',
      time: '1 hour ago',
      icon: 'check-circle',
      color: '#10B981',
    },
    {
      id: 4,
      action: 'Payment overdue',
      member: 'Anita Devi',
      amount: '₹3,000',
      time: '2 hours ago',
      icon: 'alert-circle',
      color: '#EF4444',
    },
  ];

  // Progress data for custom charts
  const monthlyData = [
    { month: 'Jan', amount: 20, percentage: 20 },
    { month: 'Feb', amount: 45, percentage: 45 },
    { month: 'Mar', amount: 28, percentage: 28 },
    { month: 'Apr', amount: 80, percentage: 80 },
    { month: 'May', amount: 99, percentage: 99 },
    { month: 'Jun', amount: 43, percentage: 43 },
  ];

  const groupsData = [
    { name: 'Active Groups', count: 46, color: '#10B981', percentage: 70 },
    { name: 'Completed', count: 12, color: '#3B82F6', percentage: 18 },
    { name: 'Pending', count: 8, color: '#F59E0B', percentage: 12 },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleQuickAction = (action) => {
    Alert.alert('Quick Action', `Navigate to ${action.title}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => console.log(`Navigate to ${action.screen}`) },
    ]);
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
          <Text style={styles.welcomeText}>Welcome Back, Admin!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>5</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Key Metrics Cards */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.primaryCard]}>
            <MaterialCommunityIcons name="bank" size={32} color="#FFFFFF" />
            <Text style={styles.metricValue}>{dashboardData.totalFunds}</Text>
            <Text style={styles.metricLabel}>Total Funds</Text>
          </View>
          <View style={[styles.metricCard, styles.successCard]}>
            <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
            <Text style={styles.metricValue}>{dashboardData.activeMembers}</Text>
            <Text style={styles.metricLabel}>Active Members</Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.warningCard]}>
            <MaterialCommunityIcons name="account-multiple-outline" size={32} color="#FFFFFF" />
            <Text style={styles.metricValue}>{dashboardData.totalGroups}</Text>
            <Text style={styles.metricLabel}>Total Groups</Text>
          </View>
          <View style={[styles.metricCard, styles.dangerCard]}>
            <MaterialCommunityIcons name="cash-clock" size={32} color="#FFFFFF" />
            <Text style={styles.metricValue}>{dashboardData.pendingPayments}</Text>
            <Text style={styles.metricLabel}>Pending Payments</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <MaterialCommunityIcons name={action.icon} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Monthly Collections Chart */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Collections</Text>
          <View style={styles.periodSelector}>
            {['Today', 'Week', 'Month'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.activePeriodButton,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.activePeriodButtonText,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.customChartContainer}>
          {monthlyData.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { height: `${item.percentage}%`, backgroundColor: '#6B46C1' }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{item.month}</Text>
              <Text style={styles.barValue}>₹{item.amount}L</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Groups Overview */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Groups Overview</Text>
        <View style={styles.groupsOverviewContainer}>
          {groupsData.map((group, index) => (
            <View key={index} style={styles.groupItem}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupColorDot, { backgroundColor: group.color }]} />
                <Text style={styles.groupName}>{group.name}</Text>
              </View>
              <Text style={styles.groupCount}>{group.count}</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${group.percentage}%`, backgroundColor: group.color }
                  ]} 
                />
              </View>
              <Text style={styles.groupPercentage}>{group.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activitiesContainer}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                <MaterialCommunityIcons name={activity.icon} size={16} color="#FFFFFF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{activity.action}</Text>
                <Text style={styles.activityDetail}>
                  {activity.member && `${activity.member} `}
                  {activity.group && `${activity.group} `}
                  {activity.amount && `• ${activity.amount}`}
                </Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Today's Summary */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#10B981" />
            <Text style={styles.summaryLabel}>New Members</Text>
            <Text style={styles.summaryValue}>{dashboardData.newMembersToday}</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="cash" size={20} color="#3B82F6" />
            <Text style={styles.summaryLabel}>Collections</Text>
            <Text style={styles.summaryValue}>{dashboardData.monthlyCollection}</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={styles.summaryValue}>{dashboardData.overduePayments}</Text>
          </View>
        </View>
      </View>

      {/* Animation Section */}
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../../../animation/Finance.json')}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
        <Text style={styles.animationText}>
          Managing {dashboardData.activeMembers} members across {dashboardData.totalGroups} groups
        </Text>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

export default Dashboard;
