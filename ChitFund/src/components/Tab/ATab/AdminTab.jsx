import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Admin credentials (for reference)
export const ADMIN_PHONE = '123456789';
export const ADMIN_PASSWORD = 'abc';

const AdminTab = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('UserManagement')}>
          <MaterialCommunityIcons name="account-group" size={28} color="#2842C4" />
          <Text style={styles.menuText}>User Management</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FundOverview')}>
          <MaterialCommunityIcons name="cash-multiple" size={28} color="#2842C4" />
          <Text style={styles.menuText}>Fund Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reports')}>
          <MaterialCommunityIcons name="file-chart" size={28} color="#2842C4" />
          <Text style={styles.menuText}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons name="cog-outline" size={28} color="#2842C4" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Admin Phone: {ADMIN_PHONE}</Text>
        <Text style={styles.footerText}>Admin Password: {ADMIN_PASSWORD}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2842C4',
    marginBottom: 30,
    textAlign: 'center',
  },
  menuSection: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
  },
  menuText: {
    fontSize: 18,
    color: '#2842C4',
    marginLeft: 18,
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default AdminTab;
