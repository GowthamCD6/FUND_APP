import React, { useState } from 'react';
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
      <MoreModal visible={showMoreModal} onClose={() => setShowMoreModal(false)}>
        {/* You can place your modal content here later */}
      </MoreModal>
    </>
  );
};

export default UserTabs;