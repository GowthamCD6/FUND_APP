import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BlockU from './pages/BlockUser/BlockU';
import UserL from './pages/UserLocation/UserL';
import EditProfile from './pages/AccountDetails/EditProfile';
import Share from './Model/ShareApp/Share';
import Rate from './Model/RateApp/Rate';
import Auction from './pages/Auction/Auction';

const Settings = () => {
  const [showBlockU, setShowBlockU] = useState(false);
  const [showUserL, setShowUserL] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRate, setshowRate] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const navigation = useNavigation();

  const [userData, setUserData] = useState({
    name: 'Admin',
    role: 'Super Admin',
    phone: '+91 XXXXXXXXXX',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      if (storedName) {
        setUserData(prev => ({ ...prev, name: storedName }));
      }
      if (storedPhone) {
        setUserData(prev => ({ ...prev, phone: storedPhone }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'account-edit',
          title: 'Edit Profile',
          iconColor: '#555555',
          onPress: () => {
            setShowEditProfile(true);
          },
        },
        {
          icon: 'shield-account',
          title: 'Security',
          iconColor: '#555555',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'bell-outline',
          title: 'Notifications',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'earth',
          title: 'Language',
          iconColor: '#555555',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Group Management',
      items: [
        {
          icon: 'account-group',
          title: 'Default Group Rules',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'cash-multiple',
          title: 'Payment Settings',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'gavel',
          title: 'Auction Settings',
          iconColor: '#555555',
          onPress: () => {
            setShowAuction(true);
          },
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: 'download',
          title: 'Data Export',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'lock-outline',
          title: 'Privacy Controls',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'account-cancel',
          title: 'Block User',
          iconColor: '#EF4444',
          onPress: () => {
            setShowBlockU(true);
          },
        },
      ],
    },
    {
      title: 'Location & Tracking',
      items: [
        {
          icon: 'map-marker-radius',
          title: 'User Location Map',
          iconColor: '#10B981',
          onPress: () => {
            setShowUserL(true);
          },
        },
        {
          icon: 'crosshairs-gps',
          title: 'Location Sharing',
          iconColor: '#555555',
          onPress: () => {
            // navigation.navigate('LocationS')
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          title: 'Help & Support',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'information',
          title: 'About App',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'share-variant-outline',
          title: 'Share App',
          iconColor: '#555555',
          onPress: () => {
            setShowShare(true);
          },
        },
        {
          icon: 'star-outline',
          title: 'Rate App',
          iconColor: '#555555',
          onPress: () => {
            setshowRate(true);
          },
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {showBlockU ? (
        <BlockU onClose={() => setShowBlockU(false)} />
      ) : showUserL ? (
        <UserL onClose={() => setShowUserL(false)} />
      ) : showEditProfile ? (
        <EditProfile onBack={() => setShowEditProfile(false)} />
      ) : showAuction ? (
        <Auction onBack={() => setShowAuction(false)} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <View style={styles.separator} />
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section - Styled like the image */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userData.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.userName}>{userData.name.toUpperCase()}</Text>
              <Text style={styles.userPhone}>{userData.phone}</Text>
              <Text style={styles.userStatus}>{userData.role}</Text>
            </View>

            {settingSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.settingsContainer}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.menuCard}>
                  {section.items.map((item, itemIndex) => (
                    <React.Fragment key={itemIndex}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={item.onPress}
                      >
                        <View style={styles.menuItemContent}>
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={22}
                            color={item.iconColor}
                          />
                          <View style={styles.menuItemTextBox}>
                            <Text style={styles.menuItemText}>
                              {item.title}
                            </Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color="#CCCCCC"
                        />
                      </TouchableOpacity>
                      {itemIndex < section.items.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.followSection}>
              <Text style={styles.followText}>Follow us, to stay updated</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity style={styles.socialIcon}>
                  <MaterialCommunityIcons
                    name="instagram"
                    size={24}
                    color="#333333"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <MaterialCommunityIcons
                    name="youtube"
                    size={24}
                    color="#333333"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <MaterialCommunityIcons
                    name="whatsapp"
                    size={24}
                    color="#333333"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </ScrollView>
        </View>
      )}
      
      {/* Share Modal */}
      {showShare && (
        <Share 
          visible={showShare}
          onClose={() => setShowShare(false)} 
        />
      )}

      {/* rate modal */}
      {showRate && (
        <Rate
        visible={showRate}
        onClose={() => setshowRate(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  blockUserContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginTop: -7,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
    marginTop: -7,
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  content: {
    flex: 1,
  },
  scrollContent: { paddingBottom: 20 },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -14,
  },
  avatarText: {
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
    marginTop: -2,
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
  settingsContainer: {
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
  menuCard: {
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
    minHeight: 60,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTextBox: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '400',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    alignSelf: 'center',
    width: '100%',
    marginVertical: 0,
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
    marginTop: -15,
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
  logoutButton: { marginBottom: 12 },
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
    marginBottom: 80,
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

export default Settings;