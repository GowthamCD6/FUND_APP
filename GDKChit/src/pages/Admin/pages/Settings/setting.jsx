import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  Image,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../../../services/ApiService';
import { API_URL } from '../../../../utils/env';
import Header from '../../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../../utils/LanguageContext';

const Settings = () => {
  const navigation = useNavigation();
  const { t, language } = useLanguage();

  const [imageError, setImageError] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Admin',
    role: 'Admin',
    phone: '',
    userImage: '',
  });

  const getProfileImageUrl = (img) => {
    if (!img) return null;
    if (typeof img !== 'string') return null;
    const trimmed = img.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const baseUrl = (API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      const storedRole = await AsyncStorage.getItem('userRole');
      const storedImage = await AsyncStorage.getItem('userImage');

      setUserData(prev => ({
        ...prev,
        name: storedName || prev.name,
        phone: storedPhone || prev.phone,
        role: storedRole || prev.role,
        userImage: storedImage || prev.userImage,
      }));

      const response = await ApiService.getProfile();
      if (response && response.success && response.data) {
        const u = response.data.user || {};
        const p = response.data.profile || {};
        const img = p.userImage || p.user_image || u.userImage || u.user_image || response.data.userImage || storedImage || '';
        
        if (img) {
          await AsyncStorage.setItem('userImage', img);
        }

        setImageError(false);
        setUserData({
          name: u.username || u.name || storedName || 'Admin',
          phone: u.phone || storedPhone || '',
          role: u.role || storedRole || 'Admin',
          userImage: img,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const displayName = userData.name || 'Admin';
  const displayPhone = userData.phone || '';
  const profileInitial = displayName ? displayName.charAt(0).toUpperCase() : 'A';
  const imageUrl = getProfileImageUrl(userData.userImage);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (ApiService && typeof ApiService.setToken === 'function') {
                ApiService.setToken(null);
              }
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const handleOpenSocial = async (url, fallbackName) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Follow Us', `Join GDK Chit Fund on ${fallbackName}!`);
      }
    } catch (error) {
      Alert.alert('Follow Us', `Join GDK Chit Fund on ${fallbackName}!`);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'GDK Chit Fund App',
        message: 'Manage your chit fund groups, auctions, and payments securely with GDK Chit Fund App!\nDownload now: https://play.google.com/store/apps/details?id=com.gdkchit',
        url: 'https://play.google.com/store/apps/details?id=com.gdkchit',
      });
    } catch (error) {
      console.log('Error sharing app:', error);
      Alert.alert('Share App', 'Share GDK Chit Fund App with your colleagues and friends!');
    }
  };

  const handleRateApp = async () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.gdkchit';
    try {
      const canOpen = await Linking.canOpenURL(playStoreUrl);
      if (canOpen) {
        await Linking.openURL(playStoreUrl);
      } else {
        Alert.alert('Rate App', 'Thank you for using GDK Chit Fund App!');
      }
    } catch (error) {
      Alert.alert('Rate App', 'Thank you for using GDK Chit Fund App!');
    }
  };

  const settingSections = [
    {
      title: t('Account'),
      items: [
        {
          icon: 'account-edit',
          title: t('Edit Profile'),
          subtitle: t('Update your personal information'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('AdminEditProfile'),
        },
        {
          icon: 'key-change',
          title: t('Password Management'),
          subtitle: t('View and manage user passwords'),
          iconColor: '#6B46C1',
          onPress: () => navigation.navigate('AdminPasswordManagement'),
        },
        {
          icon: 'shield-account',
          title: t('Password & Security'),
          subtitle: t('Password and authentication'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('AdminSecurityPerm'),
        },
      ],
    },
    {
      title: t('App Settings'),
      items: [
        {
          icon: 'bell-outline',
          title: t('Notifications'),
          subtitle: t('Manage notification preferences'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('AdminNotification'),
        },
        {
          icon: 'earth',
          title: t('Language'),
          subtitle: 'English, Tamil',
          iconColor: '#555555',
          onPress: () => navigation.navigate('AdminLanguageSettings'),
        },
      ],
    },
    {
      title: t('Group Management'),
      items: [
        {
          icon: 'key-chain',
          title: t('OTP Requests'),
          subtitle: t('Manage user OTP verification requests'),
          iconColor: '#3B82F6',
          onPress: () => navigation.navigate('OTPRequests'),
        },
        {
          icon: 'gavel',
          title: t('Auction Settings'),
          subtitle: t('Set default auction rules and duration'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('AuctionSettings'),
        },
      ],
    },
    {
      title: t('Data & Privacy'),
      items: [
        {
          icon: 'download',
          title: t('Data Export'),
          subtitle: t('Download all your group data and history'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('AdminDataExport'),
        },
        {
          icon: 'account-cancel',
          title: t('Block User'),
          iconColor: '#EF4444',
          onPress: () => navigation.navigate('AdminBlockUser'),
        },
      ],
    },
    {
      title: t('Location & Tracking'),
      items: [
        {
          icon: 'map-marker-radius',
          title: t('User Location Map'),
          iconColor: '#10B981',
          onPress: () => navigation.navigate('AdminUserLocation'),
        },
        {
          icon: 'crosshairs-gps',
          title: t('Location Sharing'),
          subtitle: t('Control location sharing preferences'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('UserMyLocation'),
        },
      ],
    },
    {
      title: t('Support'),
      items: [
        {
          icon: 'help-circle',
          title: t('Help & Support'),
          subtitle: t('FAQs, tutorials, contact support'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('UserHelpSupport'),
        },
        {
          icon: 'lock-outline',
          title: t('Privacy Controls'),
          subtitle: t('Control privacy policies and profile data'),
          iconColor: '#555555',
          onPress: () => navigation.navigate('UserPrivacyPolicy'),
        },
        {
          icon: 'share-variant-outline',
          title: t('Share App'),
          subtitle: t('Invite friends to join'),
          iconColor: '#555555',
          onPress: handleShareApp,
        },
        {
          icon: 'star-outline',
          title: t('Rate App'),
          subtitle: t('Rate us on Play Store'),
          iconColor: '#555555',
          onPress: handleRateApp,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={{ flex: 1 }}>
        <Header title="Settings" onBack={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              {imageUrl && !imageError ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text style={styles.avatarInitial}>{profileInitial}</Text>
              )}
            </View>
            <Text style={styles.userName}>{displayName.toUpperCase()}</Text>
            {Boolean(displayPhone) && (
              <Text style={styles.userPhone}>{displayPhone}</Text>
            )}
            <Text style={styles.userStatus}>{userData.role || 'Admin'} Account</Text>
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
            <Text style={styles.followText}>Follow Us</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => handleOpenSocial('https://facebook.com', 'Facebook')}>
                <MaterialCommunityIcons
                  name="facebook"
                  size={24}
                  color="#1877F2"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => handleOpenSocial('https://instagram.com', 'Instagram')}>
                <MaterialCommunityIcons
                  name="instagram"
                  size={24}
                  color="#E4405F"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => handleOpenSocial('https://youtube.com', 'YouTube')}>
                <MaterialCommunityIcons
                  name="youtube"
                  size={24}
                  color="#FF0000"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => handleOpenSocial('https://wa.me', 'WhatsApp')}>
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={24}
                  color="#25D366"
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
    </View>
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
  scrollContent: { paddingBottom: 90 },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitial: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  userPhone: { fontSize: 15, color: '#6B7280', marginBottom: 4, textAlign: 'center' },
  userStatus: {
    fontSize: 13,
    color: '#6B46C1',
    fontWeight: '600',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    textAlign: 'center',
  },
  settingsContainer: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuItemTextBox: { marginLeft: 16, flex: 1 },
  menuItemText: { fontSize: 16, color: '#000' },
  menuItemSubtitle: { fontSize: 13, color: '#999999', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 56 },
  followSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  followText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    marginTop: 0,
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
  logoutButton: { marginBottom: 16 },
  logoutText: { fontSize: 16, color: '#EF4444', fontWeight: '500' },
  versionText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 5,
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
    bottom: 25,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default Settings;