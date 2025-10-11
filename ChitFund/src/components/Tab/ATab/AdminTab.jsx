import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import styles from './AdminTabsty.jsx'; // Adjust path if needed
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Dashboard from '../../../pages/Admin/pages/Dashboard/Dashboard.jsx';
import Reports from '../../../pages/Admin/pages/Reports/Reports.jsx';
import AdminMoreModal from '../../../pages/Admin/Modals/more.jsx';

export const ADMIN_PHONE = '123456789';
export const ADMIN_PASSWORD = 'abc';

// Admin Dashboard Screens
function DashboardScreen() {
  return <Dashboard />;
}

function MembersScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Member Management</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>Manage chit fund members</Text>
      </View>
    </View>
  );
}

function TransactionsScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>Manage payments & collections</Text>
      </View>
    </View>
  );
}

function ReportsScreen() {
  return <Reports />;
}

function SettingsScreen() {
  const navigation = useNavigation();
  
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Admin Settings</Text>
      </View>
      <View style={styles.screenContent}>
        <Text style={styles.screenText}>System configuration</Text>
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Admin Phone: {ADMIN_PHONE}</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>Admin Password: {ADMIN_PASSWORD}</Text>
        </View>
        <TouchableOpacity 
          style={{ 
            marginTop: 30, 
            backgroundColor: '#EF4444', 
            paddingHorizontal: 20, 
            paddingVertical: 12, 
            borderRadius: 8 
          }} 
          onPress={handleLogout}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
            Logout
          </Text>
        </TouchableOpacity>
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
  const navigation = useNavigation();
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
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="view-dashboard-outline"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Dashboard
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="chart-line"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Reports
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={TransactionsScreen}
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
            <CustomTabBarButton 
              {...props} 
              onPress={() => setShowMoreModal(true)}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MembersScreen}
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
                Messages
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={28}
                color={focused ? '#6B46C1' : '#9CA3AF'}
                style={styles.iconStyle}
              />
              <Text style={[styles.tabLabel, { color: focused ? '#6B46C1' : '#9CA3AF' }]}>
                Settings
              </Text>
            </View>
          ),
        }}
      />
      </Tab.Navigator>
      
      <AdminMoreModal 
        visible={showMoreModal}
        onClose={() => setShowMoreModal(false)}
        navigation={navigation}
      />
    </>
  );
};

export default AdminTab;
