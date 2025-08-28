import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Profile = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - Portfolio style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>
      <View style={styles.separator} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>G</Text>
            </View>
          </View>
          <Text style={styles.userName}>GOWTHAM</Text>
          <Text style={styles.userPhone}>+91 8610696889</Text>
          <Text style={styles.userStatus}>increasing Periyanayagi amman ChitFund</Text>
        </View>

        {/* Profile Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profile Settings</Text>
          
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Account Details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="credit-card-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Linked Bank Account</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Identity Verification</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="account-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Nominee Details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* General Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Security & Permission</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.customDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.customDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="help-circle-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Help & Support</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.customDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="share-variant-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Share Aura Gold</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.customDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="star-outline" size={22} color="#666666" />
                <Text style={styles.menuItemText}>Rate Aura Gold</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Follow Us & Logout Section */}
        <View style={styles.followSection}>
          <Text style={styles.followText}>Follow us, to stay updated</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialIcon}>
              <MaterialCommunityIcons name="instagram" size={24} color="#333333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <MaterialCommunityIcons name="youtube" size={24} color="#333333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <MaterialCommunityIcons name="whatsapp" size={24} color="#333333" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>Version 3.1.4</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home-outline" size={24} color="#999999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#999999" />
          <Text style={styles.navText}>Portfolio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemCenter]}>
          <View style={styles.centerNavButton}>
            <MaterialCommunityIcons name="star-four-points" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.navTextCenter}>More</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#999999" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="account-outline" size={24} color="#6B46C1" />
          <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    marginTop: -10,
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  userPhone: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  userStatus: {
    fontSize: 14,
    color: '#999999',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  customDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    alignSelf: 'center',
    width: '80%',
    marginVertical: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
    fontWeight: '400',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  followSection: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  followText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    marginTop: -10,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButton: {
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  versionText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#E5E5E5',
    marginB
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemCenter: {
    position: 'relative',
  },
  centerNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  navTextCenter: {
    fontSize: 12,
    color: '#999999',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  navTextActive: {
    color: '#6B46C1',
  },
});

export default Profile;