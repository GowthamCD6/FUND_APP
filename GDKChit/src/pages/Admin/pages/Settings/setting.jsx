import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../../components/HeaderComponent/Header';
import BlockU from './pages/BlockUser/BlockUser';
import UserL from './pages/UserLocation/UserL';
import EditProfile from './pages/AccountDetails/EditProfile';
import MyLocation from './pages/MyLocation/MyLocation';
import SecurityLockScreen from './pages/SecurityLock/SecurityPermision';
import Share from './Model/ShareApp/Share';
import Rate from './Model/RateApp/Rate';

const Settings = () => {
  const [showBlockU, setShowBlockU] = useState(false);
  const [showUserL, setShowUserL] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMyLocation, setShowMyLocation] = useState(false);
  const [showSecurityLock, setShowSecurityLock] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const navigation = useNavigation();

  // Animation values for slide-in effects
  const blockUAnim = useRef(
    new Animated.Value(Dimensions.get('window').width),
  ).current;
  const userLAnim = useRef(
    new Animated.Value(Dimensions.get('window').width),
  ).current;
  const editProfileAnim = useRef(
    new Animated.Value(Dimensions.get('window').width),
  ).current;
  const myLocationAnim = useRef(
    new Animated.Value(Dimensions.get('window').width),
  ).current;
  const securityLockAnim = useRef(
    new Animated.Value(Dimensions.get('window').width),
  ).current;

  // Animation effects
  useEffect(() => {
    if (showBlockU) {
      Animated.timing(blockUAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(blockUAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showBlockU, blockUAnim]);

  useEffect(() => {
    if (showUserL) {
      Animated.timing(userLAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(userLAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showUserL, userLAnim]);

  useEffect(() => {
    if (showEditProfile) {
      Animated.timing(editProfileAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(editProfileAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showEditProfile, editProfileAnim]);

  useEffect(() => {
    if (showMyLocation) {
      Animated.timing(myLocationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(myLocationAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMyLocation, myLocationAnim]);

  useEffect(() => {
    if (showSecurityLock) {
      Animated.timing(securityLockAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(securityLockAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSecurityLock, securityLockAnim]);

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
          iconColor: '#666666',
          onPress: () => {
            setShowEditProfile(true);
          },
        },
        {
          icon: 'shield-account',
          title: 'Security',
          iconColor: '#666666',
          onPress: () => {
            setShowSecurityLock(true);
          },
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'bell-outline',
          title: 'Notifications',
          iconColor: '#666666',
          onPress: () => {},
        },
        {
          icon: 'earth',
          title: 'Language',
          iconColor: '#666666',
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
          iconColor: '#666666',
          onPress: () => {},
        },
        {
          icon: 'gavel',
          title: 'Auction Settings',
          iconColor: '#666666',
          onPress: () => {
            navigation.navigate('AuctionSettings');
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
          iconColor: '#666666',
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
          title: 'My Location',
          iconColor: '#666666',
          onPress: () => {
            setShowMyLocation(true);
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
          iconColor: '#666666',
          onPress: () => {},
        },
        {
          icon: 'information',
          title: 'About App',
          iconColor: '#666666',
          onPress: () => {},
        },
        {
          icon: 'share-variant-outline',
          title: 'Share App',
          iconColor: '#666666',
          onPress: () => {
            setShowShare(true);
          },
        },
        {
          icon: 'star-outline',
          title: 'Rate App',
          iconColor: '#666666',
          onPress: () => {
            setShowRate(true);
          },
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Main Settings Content */}
      <View style={{flex: 1}}>
        {!showBlockU &&
          !showUserL &&
          !showEditProfile &&
          !showMyLocation &&
          !showSecurityLock && (
            <>
              <Header 
                title="Settings"
                onBack={() => navigation.goBack()}
              />

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}>
                
                {/* Profile Section */}
                <View style={styles.profileSection}>
                  <View style={styles.profileImageContainer}>
                    <View style={styles.profileImage}>
                      <Text style={styles.profileInitial}>
                        {userData.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userName}>{userData.name.toUpperCase()}</Text>
                  <Text style={styles.userPhone}>{userData.phone}</Text>
                  <Text style={styles.userStatus}>{userData.role}</Text>
                </View>

                {/* Settings Sections */}
                {settingSections.map((section, sectionIndex) => (
                  <View key={sectionIndex} style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.menuSection}>
                      {section.items.map((item, itemIndex) => (
                        <React.Fragment key={itemIndex}>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={item.onPress}
                          >
                            <View style={styles.menuItemLeft}>
                              <MaterialCommunityIcons
                                name={item.icon}
                                size={22}
                                color={item.iconColor}
                              />
                              <Text style={styles.menuItemText}>
                                {item.title}
                              </Text>
                            </View>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={22}
                              color="#CCCCCC"
                            />
                          </TouchableOpacity>
                          {itemIndex < section.items.length - 1 && (
                            <View style={styles.customDivider} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                ))}

                {/* Follow Section */}
                <View style={styles.followSection}>
                  <Text style={styles.followText}>
                    Follow us, to stay updated
                  </Text>
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
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                  <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
              </ScrollView>
            </>
          )}

        {/* Block User Overlay */}
        {showBlockU && (
          <Animated.View
            style={[
              styles.fullScreenOverlay,
              {transform: [{translateX: blockUAnim}]},
            ]}>
            <BlockU
              onClose={() => {
                Animated.timing(blockUAnim, {
                  toValue: Dimensions.get('window').width,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowBlockU(false);
                });
              }}
            />
          </Animated.View>
        )}

        {/* User Location Overlay */}
        {showUserL && (
          <Animated.View
            style={[
              styles.fullScreenOverlay,
              {transform: [{translateX: userLAnim}]},
            ]}>
            <UserL
              onClose={() => {
                Animated.timing(userLAnim, {
                  toValue: Dimensions.get('window').width,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowUserL(false);
                });
              }}
            />
          </Animated.View>
        )}

        {/* Edit Profile Overlay */}
        {showEditProfile && (
          <Animated.View
            style={[
              styles.fullScreenOverlay,
              {transform: [{translateX: editProfileAnim}]},
            ]}>
            <EditProfile
              onBack={() => {
                Animated.timing(editProfileAnim, {
                  toValue: Dimensions.get('window').width,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowEditProfile(false);
                });
              }}
            />
          </Animated.View>
        )}

        {/* My Location Overlay */}
        {showMyLocation && (
          <Animated.View
            style={[
              styles.fullScreenOverlay,
              {transform: [{translateX: myLocationAnim}]},
            ]}>
            <MyLocation
              onBack={() => {
                Animated.timing(myLocationAnim, {
                  toValue: Dimensions.get('window').width,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowMyLocation(false);
                });
              }}
            />
          </Animated.View>
        )}

        {/* Security Lock Overlay */}
        {showSecurityLock && (
          <Animated.View
            style={[
              styles.fullScreenOverlay,
              {transform: [{translateX: securityLockAnim}]},
            ]}>
            <SecurityLockScreen
              onBack={() => {
                Animated.timing(securityLockAnim, {
                  toValue: Dimensions.get('window').width,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowSecurityLock(false);
                });
              }}
            />
          </Animated.View>
        )}
      </View>

      {/* Share Modal */}
      {showShare && (
        <Share visible={showShare} onClose={() => setShowShare(false)} />
      )}

      {/* Rate Modal */}
      {showRate && (
        <Rate visible={showRate} onClose={() => setShowRate(false)} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginTop: 30,
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
    marginTop: -13,
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
    marginBottom: -10,
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
    marginTop: -7,
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
    width: '100%',
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
    marginBottom: 95,
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
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
});

export default Settings;