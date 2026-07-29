import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../../../services/ApiService';
import styles from './NotificationStyles';

const AdminNotification = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAdminNotifications().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : styles.notificationList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length > 0 ? (
          notifications.map((notif, index) => {
            const isDanger = notif.type === 'danger';
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.notificationCard, 
                  { borderColor: isDanger ? '#FECACA' : '#FEF3C7' }
                ]}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer, 
                  { backgroundColor: isDanger ? '#FEF2F2' : '#FFFBEB' }
                ]}>
                  <MaterialCommunityIcons 
                    name={isDanger ? 'alert-circle' : 'clock-alert'} 
                    size={24} 
                    color={isDanger ? '#EF4444' : '#F59E0B'} 
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[
                    styles.title, 
                    { color: isDanger ? '#991B1B' : '#B45309' }
                  ]}>
                    {notif.title}
                  </Text>
                  <Text style={styles.message}>{notif.message}</Text>
                  <Text style={styles.timeText}>{formatTime(notif.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications at the moment.</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>
              You're all caught up!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminNotification;
