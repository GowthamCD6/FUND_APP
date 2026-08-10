import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, DeviceEventEmitter } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './UserTabsty';

// Import actual page components
import Home from '../../../pages/User/Pages/Home/Home';
import Portfolio from '../../../pages/User/Pages/Portfolio/Portfolio';
import Profile from '../../../pages/User/Pages/Profile/Profile';
import ChatList from '../../../pages/User/Pages/Chat/ChatList/ChatList';

// Import MaterialCommunityIcons for consistent iconography
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MoreModal from '../../../pages/User/Modals/More';
import AdminTab, { ADMIN_PHONE, ADMIN_PASSWORD } from '../ATab/AdminTab';
import UserManual from '../../../pages/User/manual/usermanule';

const withSafe = (Component) => {
  return (props) => {
    return (
      <View style={{ flex: 1 }}>
        <Component {...props} />
      </View>
    );
  };
};

const HomeWithSafe = (props) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Home {...props} />
    </View>
  );
};

const PortfolioWithSafe = withSafe(Portfolio);
const ChatListWithSafe = withSafe(ChatList);
const ProfileWithSafe = (props) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Profile {...props} />
    </View>
  );
};

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
  const insets = useSafeAreaInsets();
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [preselectedGroup, setPreselectedGroup] = useState(null);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualKey, setManualKey] = useState(1);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('TRIGGER_USER_MANUAL', () => {
      setManualKey((prev) => prev + 1);
      setManualVisible(true);
    });

    const moreSub = DeviceEventEmitter.addListener('OPEN_MORE_MODAL', () => {
      setShowMoreModal(true);
    });

    return () => {
      subscription.remove();
      moreSub.remove();
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
          tabBarStyle: [
            styles.tabBar,
            {
              height: Platform.OS === 'ios' ? 70 + insets.bottom : 60 + Math.max(insets.bottom, 10),
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 15) : Math.max(insets.bottom, 6),
            },
          ],
          tabBarHideOnKeyboard: true,
        }}
      >
        {/* Home Tab */}
        <Tab.Screen
          name="Home"
          component={HomeWithSafe}
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
          component={PortfolioWithSafe}
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
          component={ChatListWithSafe}
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
          component={ProfileWithSafe}
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

      <MoreModal visible={showMoreModal} onClose={handleCloseMoreModal} selectedGroup={preselectedGroup} />
      <UserManual
        key={manualKey}
        visible={manualVisible}
        forceShow={manualVisible}
        onClose={() => setManualVisible(false)}
      />
    </>
  );
};

export default UserTabs;