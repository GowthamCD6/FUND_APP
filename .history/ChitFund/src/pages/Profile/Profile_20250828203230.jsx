import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Profile = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <MaterialCommunityIcons name="account" size={50} color="#6B46C1" />
            </View>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="account-edit" size={24} color="#6B46C1" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="shield-account" size={24} color="#6B46C1" />
              <Text style={styles.menuItemText}>Security</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="bell" size={24} color="#6B46C1" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="help-circle" size={24} color="#6B46C1" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="information" size={24} color="#6B46C1" />
              <Text style={styles.menuItemText}>About</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6B46C1',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
});

export default Profile;