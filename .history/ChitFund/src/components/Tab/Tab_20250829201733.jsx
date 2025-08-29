import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import styles from './Tabsty';

// Import actual page components
import Home from '../../pages/Home/Home';
import Portfolio from '../../pages/Portfolio/Portfolio';
import Profile from '../../pages/Profile/Profile';
import AccountD from '../../pages/Profile/Page/AccountD';
import Nominee from '../../pages/Profile/Page/Nominee';

// Import SVG assets from your assects folder
import HomeIcon from '../../assects/Icon/home.svg';
import UserIcon from '../../assects/Icon/user.svg';
import CommentsIcon from '../../assects/Icon/comments.svg';

// ---- Screen Components ----
const MoreScreen = () => (
  <View style={styles.screenContainer}>
    <View style={styles.gradientHeader}>
      <Text style={styles.headerTitle}>More Options</Text>
    </View>
    <View style={styles.screenContent}>
      <Text style={styles.screenText}>More Screen</Text>
    </View>
  </View>
);

const ChatScreen = () => (
  <View style={styles.screenContainer}>
    <View style={styles.gradientHeader}>
      <Text style={styles.headerTitle}>Chat</Text>
    </View>
    <View style={styles.screenContent}>
      <Text style={styles.screenText}>Chat Screen</Text>
    </View>
  </View>
);

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


const AppTabs = () => {
  return (
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
              <HomeIcon
                width={24}
                height={24}
                fill={focused ? '#6B46C1' : '#6B7280'}
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
              <PortfolioIcon
                width={24}
                height={24}
                fill={focused ? '#6B46C1' : '#6B7280'}
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
            <PlusIcon width={28} height={28} fill="#FFFFFF" />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
        }}
      />

      {/* Chat Tab */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <CommentsIcon
                width={24}
                height={24}
                fill={focused ? '#6B46C1' : '#6B7280'}
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
              <UserIcon
                width={24}
                height={24}
                fill={focused ? '#6B46C1' : '#6B7280'}
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
  );
};

export default function TabNavigator() {
  return (
    <NavigationContainer>
      <AppTabs />
    </NavigationContainer>
  );
}