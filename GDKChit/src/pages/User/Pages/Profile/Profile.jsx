import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../components/HeaderComponent/Header';
import AccountD from './Page/UserAccountDetails/AccountDetails';
import Nominee from './Page/UserNominee/Nominee';
import LinkBA from './Page/LinkBankAccount/LinkBankAccount';
import IdentityV from './Page/Verification/IdentityVerification';
import ShareModal from './Modals/Share';
import RateModal from './Modals/Rate';
import { Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { navigate as navigateRef } from '../../../../utils/navigation';
import ApiService from '../../../../services/ApiService';
import { useAuth } from '../../../../utils/AuthContext';
import { useLanguage } from '../../../../utils/LanguageContext';
import { API_URL } from '../../../../utils/env';

const Profile = () => {
  const { user: authUser } = useAuth();
  const { t, language } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [profileUser, setProfileUser] = useState(authUser);
  const [profileImage, setProfileImage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigation = useNavigation();
  const profileScrollViewRef = useRef(null);

  useEffect(() => {
    const scrollSub = DeviceEventEmitter.addListener('SCROLL_PROFILE', (y) => {
      if (profileScrollViewRef.current) {
        profileScrollViewRef.current.scrollTo({ y: y, animated: true });
      }
    });
    return () => scrollSub.remove();
  }, []);

  const getProfileImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    const cleanPath = img.startsWith('/') ? img : `/${img}`;
    const baseUrl = (API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (authUser) {
          setProfileUser(authUser);
        }

        const response = await ApiService.getProfile();
        if (response.success) {
          setProfileUser(response.data.user);
          setProfileImage(response.data.profile?.userImage || '');
          setImageError(false);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [authUser]);

  const displayName = profileUser?.username || profileUser?.name || 'User';
  const displayPhone = profileUser?.phone || 'No phone number';
  const profileInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  const imageUrl = getProfileImageUrl(profileImage);
  const profileStatus = profileUser?.role
    ? `${profileUser.role} account`
    : 'Chit Fund account';

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Main Profile Content */}
      <View style={{ flex: 1 }}>
        {/* Profile Content */}
        <Header
          title="My Profile"
          onBack={() => navigation.navigate('Home')}
        />

        <ScrollView
          ref={profileScrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* ...existing profile, settings, general, follow, and nav sections... */}
          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                {imageUrl && !imageError ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.profileAvatarImage}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text style={styles.profileInitial}>{profileInitial}</Text>
                )}
              </View>
            </View>
            <Text style={[styles.userName, language === 'ta' && { fontSize: 20 }]}>{displayName}</Text>
            <Text style={styles.userPhone}>{displayPhone}</Text>
            <Text style={[styles.userStatus, language === 'ta' && { fontSize: 12 }]}>
              {t('increasing Periyanayagi amman ChitFund')}
            </Text>
          </View>
          {/* Profile Settings Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 16 }]}>{t('Profile Settings')}</Text>
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('AccountD')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('Account Details')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('LinkBA')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="credit-card-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>
                    {t('Linked Bank Account')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('IdentityV')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>
                    {t('Identity Verification')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('Nominee')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('Nominee Details')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                onPress={() => navigation.navigate('OTPRequests')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="shield-key-outline"
                    size={22}
                    color="#4F46E5"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('OTP Requests')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* Advanced Features Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 16 }]}>{t('Advanced Features')}</Text>
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('SecurityPerm')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="shield-lock-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>
                    {t('Security & Permission')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('UserMyLocation')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('My Location')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('UserAdminLocation')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="map-check"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('Admin Location')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('LanguageSettings')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="translate"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('Language')}</Text>
                </View>
                <View style={styles.languageBadgeRow}>
                  <Text style={styles.languageBadgeText}>
                    {language === 'en' ? 'EN' : 'தமிழ்'}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color="#CCCCCC"
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  try {
                    navigateRef('UserTabs', { screen: 'Home' });
                  } catch (e) {
                    navigation.navigate('Home');
                  }
                  setTimeout(() => {
                    DeviceEventEmitter.emit('TRIGGER_USER_MANUAL');
                  }, 150);
                }}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={22}
                    color="#6B46C1"
                  />
                  <Text style={[styles.menuItemText, { color: '#6B46C1', fontWeight: '600' }, language === 'ta' && { fontSize: 14 }]}>
                    {t('App Feature Guide')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#6B46C1"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* General Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, language === 'ta' && { fontSize: 16 }]}>{t('General')}</Text>
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('UserPrivacyPolicy')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('Privacy Policy')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('UserHelpSupport')}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>{t('Help & Support')}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowShareModal(true)}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="share-variant-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>
                    {t('Share GDK Chit Fund')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
              <View style={styles.customDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowRateModal(true)}>
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons
                    name="star-outline"
                    size={22}
                    color="#666666"
                  />
                  <Text style={[styles.menuItemText, language === 'ta' && { fontSize: 14 }]}>
                    {t('Rate GDK Chit Fund')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#CCCCCC"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* Follow Us & Logout Section */}
          <View style={styles.followSection}>
            <Text style={[styles.followText, language === 'ta' && { fontSize: 12 }]}>
              {t('Follow us, to stay updated')}
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
            <TouchableOpacity style={styles.logoutButton} onPress={async () => handleLogout()}>
              <Text style={[styles.logoutText, language === 'ta' && { fontSize: 14 }]}>{t('Logout')}</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Version 3.1.4</Text>
          </View>
        </ScrollView>
      </View>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Rate Modal */}
      <RateModal
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    marginTop: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 75 : 60,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
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
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
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
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  followText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    marginTop: 0,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
    textAlign: 'center',
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
    marginBottom: 10,
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
    marginBottom: 16,
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
  languageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B46C1',
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
});

export default Profile;