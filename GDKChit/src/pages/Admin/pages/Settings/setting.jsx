import React, {useState, useEffect} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BlockU from './pages/BlockUser/BlockU';
import UserL from './pages/UserLocation/UserL';

const Settings = () => {
  const [showBlockU, setShowBlockU] = useState(false);
  const [showUserL, setShowUserL] = useState(false);
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
        setUserData(prev => ({...prev, name: storedName}));
      }
      if (storedPhone) {
        setUserData(prev => ({...prev, phone: storedPhone}));
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
        routes: [{name: 'Welcome'}],
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
          subtitle: 'Update your personal information',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'shield-account',
          title: 'Security',
          subtitle: 'Password and authentication',
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
          subtitle: 'Manage notification preferences',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'earth',
          title: 'Language',
          subtitle: 'English, Hindi, Tamil, Telugu, Kannada',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'currency-inr',
          title: 'Currency',
          subtitle: 'Set default currency (INR)',
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
          subtitle: 'Set contribution amounts and payment cycles',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'cash-multiple',
          title: 'Payment Settings',
          subtitle: 'Configure payment rules and reminders',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'gavel',
          title: 'Auction Settings',
          subtitle: 'Set default auction rules and duration',
          iconColor: '#555555',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: 'backup-restore',
          title: 'Backup & Sync',
          subtitle: 'Automatically backup your data to cloud',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'download',
          title: 'Data Export',
          subtitle: 'Download all your group data and history',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'lock-outline',
          title: 'Privacy Controls',
          subtitle: 'Control who can see your profile',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'account-cancel',
          title: 'Block User',
          subtitle: 'Manage blocked users list',
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
          subtitle: 'View locations of group members',
          iconColor: '#10B981',
          onPress: () => {
            setShowUserL(true);
          },
        },
        {
          icon: 'crosshairs-gps',
          title: 'Location Sharing',
          subtitle: 'Control location sharing preferences',
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
          subtitle: 'FAQs, tutorials, contact support',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'information',
          title: 'About App',
          subtitle: 'Version and legal information',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'share-variant-outline',
          title: 'Share App',
          subtitle: 'Invite friends to join',
          iconColor: '#555555',
          onPress: () => {},
        },
        {
          icon: 'star-outline',
          title: 'Rate App',
          subtitle: 'Rate us on Play Store',
          iconColor: '#555555',
          onPress: () => {},
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
      ) : (
        <View style={{flex: 1}}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
          <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {userData.name.charAt(0).toUpperCase()}
            </Text>
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
                    onPress={item.onPress}>
                    <View style={styles.menuItemContent}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={24}
                        color={item.iconColor}
                      />
                      <View style={styles.menuItemTextBox}>
                        <Text style={styles.menuItemText}>{item.title}</Text>
                        {item.subtitle && (
                          <Text style={styles.menuItemSubtitle}>
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="#B0B0B0"
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
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
          </ScrollView>
        </View>
      )}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home" size={28} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="briefcase" size={28} color="#555" />
          <Text style={styles.navText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.centerButton}>
          <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="chat" size={28} color="#555" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="account" size={28} color="#6B46C1" />
          <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  blockUserContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    marginTop: 20,
  },
  backButton: {marginRight: 16},
  headerTitle: {fontSize: 20, fontWeight: 'bold', color: '#000'},
  scrollContent: {paddingBottom: 100},
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {fontSize: 40, fontWeight: 'bold', color: '#FFFFFF'},
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    letterSpacing: 1,
  },
  userPhone: {fontSize: 16, color: '#666', marginBottom: 4},
  userStatus: {fontSize: 14, color: '#888'},
  settingsContainer: {paddingHorizontal: 16, marginTop: 24},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  menuCard: {backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden'},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemContent: {flexDirection: 'row', alignItems: 'center', flex: 1},
  menuItemTextBox: {marginLeft: 16, flex: 1},
  menuItemText: {fontSize: 16, color: '#000'},
  menuItemSubtitle: {fontSize: 13, color: '#999999', marginTop: 2},
  divider: {height: 1, backgroundColor: '#F0F0F0', marginLeft: 56},
  followSection: {
    alignItems: 'center',
    marginVertical: 32,
    paddingHorizontal: 16,
  },
  followText: {fontSize: 14, color: '#666666', marginBottom: 16},
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutButton: {marginBottom: 16},
  logoutText: {fontSize: 16, color: '#EF4444', fontWeight: '500'},
  versionText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: -15,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 80 : 70,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {alignItems: 'center', flex: 1},
  navText: {fontSize: 12, color: '#555', marginTop: 2},
  navTextActive: {color: '#6B46C1', fontWeight: 'bold'},
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 25,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default Settings;