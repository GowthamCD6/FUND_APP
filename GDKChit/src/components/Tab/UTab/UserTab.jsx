import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import styles from './UserTabsty';

// Import actual page components
import Home from '../../../pages/User/Pages/Home/Home';
import Portfolio from '../../../pages/User/Pages/Portfolio/Portfolio';
import Profile from '../../../pages/User/Pages/Profile/Profile';
import ChatList from '../../../pages/User/Pages/Chat/ChatList/ChatList';

// Import MaterialCommunityIcons for consistent iconography
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../../../services/AuctionWebSocketService';

import MoreModal from '../../../pages/User/Modals/More';
import AdminTab, { ADMIN_PHONE, ADMIN_PASSWORD } from '../ATab/AdminTab';

// ---- Screen Components ----
const MoreScreen = () => null; // Placeholder, modal will be shown instead

const Tab = createBottomTabNavigator();

// Custom Tab Bar Button for Center "More" Button
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customTabButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customTabButtonInner}>
      {children}
    </View>
  </TouchableOpacity>
);



const UserTabs = () => {
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [activeAuctionAlert, setActiveAuctionAlert] = useState(null);
  const [preselectedGroup, setPreselectedGroup] = useState(null);

  useEffect(() => {
    let unsubscribeAlert;

    const connectWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'user');
          
          const unsub = AuctionWebSocketService.on('auction_created_alert', (data) => {
            const { groupId, groupName, auctionType, participantIds } = data;
            
            // Check if current user is one of the participants
            if (!participantIds || participantIds.map(pid => pid.toString()).includes(userId.toString())) {
              setActiveAuctionAlert({
                id: groupId,
                name: groupName,
                type: auctionType || 'betting'
              });
            }
          });

          unsubscribeAlert = unsub;
        }
      } catch (err) {
        console.error('Error connecting WebSocket in UserTabs:', err);
      }
    };

    connectWebSocket();

    return () => {
      unsubscribeAlert?.();
    };
  }, []);

  const handleCloseMoreModal = () => {
    setShowMoreModal(false);
    setPreselectedGroup(null);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarHideOnKeyboard: true,
        }}
      >
        {/* Home Tab */}
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabIconContainer}>
                <MaterialCommunityIcons
                  name="home"
                  size={24}
                  color={focused ? '#6B46C1' : '#6B7280'}
                  style={styles.iconStyle}
                />
                <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#6B7280' }]}>
                  Home
                </Text>
              </View>
            ),
          }}
        />

        {/* Portfolio Tab */}
        <Tab.Screen
          name="Portfolio"
          component={Portfolio}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabIconContainer}>
                <MaterialCommunityIcons
                  name="briefcase"
                  size={24}
                  color={focused ? '#6B46C1' : '#6B7280'}
                  style={styles.iconStyle}
                />
                <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#6B7280' }]}>
                  Portfolio
                </Text>
              </View>
            ),
          }}
        />

        {/* Center "More" Tab */}
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{
            tabBarIcon: () => (
              <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
            ),
            tabBarButton: (props) => (
              <CustomTabBarButton {...props} onPress={() => setShowMoreModal(true)} />
            ),
          }}
        />

        {/* Chat Tab */}
        <Tab.Screen
          name="Chat"
          component={ChatList}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabIconContainer}>
                <MaterialCommunityIcons
                  name="message"
                  size={24}
                  color={focused ? '#6B46C1' : '#6B7280'}
                  style={styles.iconStyle}
                />
                <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#6B7280' }]}>
                  Chat
                </Text>
              </View>
            ),
          }}
        />

        {/* Profile Tab */}
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabIconContainer}>
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color={focused ? '#6B46C1' : '#6B7280'}
                  style={styles.iconStyle}
                />
                <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#6B7280' }]}>
                  Profile
                </Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      {activeAuctionAlert && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <MaterialCommunityIcons name="gavel" size={22} color="#6B46C1" />
            <Text style={styles.alertTitle}>Live Auction Invitation</Text>
          </View>
          <Text style={styles.alertBody}>
            You are part of the auction for group: {activeAuctionAlert.name}
          </Text>
          <View style={styles.alertButtons}>
            <TouchableOpacity 
              style={styles.dismissBtn} 
              onPress={() => setActiveAuctionAlert(null)}
            >
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.joinBtn} 
              onPress={() => {
                setPreselectedGroup({ 
                  id: activeAuctionAlert.id, 
                  name: activeAuctionAlert.name,
                  type: activeAuctionAlert.type 
                });
                setShowMoreModal(true);
                setActiveAuctionAlert(null);
              }}
            >
              <Text style={styles.joinBtnText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <MoreModal visible={showMoreModal} onClose={handleCloseMoreModal} selectedGroup={preselectedGroup} />
    </>
  );
};

export default UserTabs;