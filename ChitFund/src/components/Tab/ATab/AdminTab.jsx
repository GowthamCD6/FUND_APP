import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import styles from './AdminTabsty.jsx'; // Adjust path if needed
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const ADMIN_PHONE = '123456789';
export const ADMIN_PASSWORD = 'abc';

// Screens using provided styles
function UserManagementScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>Manage users here</Text>
      </View>
    </View>
  );
}

function FundOverviewScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Fund Overview</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>Overview of funds</Text>
      </View>
    </View>
  );
}

function ReportsScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>View reports</Text>
      </View>
    </View>
  );
}

function ChatScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>Chat with users</Text>
      </View>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>Admin Profile</Text>
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Admin Phone: {ADMIN_PHONE}</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>Admin Password: {ADMIN_PASSWORD}</Text>
        </View>
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

// Custom Center Tab Button
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

const AdminTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={UserManagementScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="home-outline"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Home
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={FundOverviewScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="chart-donut"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Portfolio
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={ReportsScreen}
        options={{
          tabBarIcon: () => (
            <MaterialCommunityIcons
              name="plus"
              size={30}
              color="#fff"
              alignItems={'center'}
            />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Chat
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="account-outline"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTab;