import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import BiometricService from '../../../../../../services/BiometricService';
import LockInfo from './Lock-Info-Modal/LockInfo';
import Header from '../../../../../../components/HeaderComponent/Header';

const SecurPermis = ({ onBack }) => {
  const navigation = useNavigation();
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Load security setting on component mount
  useEffect(() => {
    loadSecuritySetting();
  }, []);

  // Handle hardware back button to navigate back to profile page
  useEffect(() => {
    const backAction = () => {
      if (helpModalVisible) {
        setHelpModalVisible(false);
        return true;
      }
      navigation.goBack();
      return true; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation, helpModalVisible]);

  const loadSecuritySetting = async () => {
    try {
      console.log('Loading security setting...');
      const state = BiometricService.getState();
      console.log('Security enabled:', state.isSecurityEnabled);
      setSecurityEnabled(state.isSecurityEnabled);
    } catch (error) {
      console.error('Error loading security setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthenticationAvailability = async () => {
    return await BiometricService.checkBiometricAvailability();
  };

  const performAuthentication = async (promptMessage) => {
    return await BiometricService.authenticate(promptMessage);
  };

  const handleSecurityToggle = async (value) => {
    // Check if authentication is available
    const authCheck = await checkAuthenticationAvailability();
    
    if (!authCheck.available) {
      Alert.alert(
        'Authentication Not Available',
        'Please ensure device security is enabled in your device settings.',
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Help',
            style: 'default',
            onPress: () => {
              Alert.alert(
                'Setup Instructions', 
                'Go to your device Settings > Security & Privacy > Screen Lock to set up PIN, password, pattern, fingerprint, or face unlock.'
              );
            }
          }
        ]
      );
      return;
    }

    if (value) {
      // User trying to ENABLE security
      const result = await BiometricService.enableSecurity();

      if (result.success) {
        setSecurityEnabled(true);
        Alert.alert(
          'Security Enabled',
          'App security has been successfully enabled. The app will now lock automatically when you switch to other apps or when the device is locked.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (result.error !== 'user_cancel') {
        Alert.alert('Failed to Enable Security', 'Unable to enable app security. Please try again.');
      }
    } else {
      // User trying to DISABLE security
      Alert.alert(
        'Disable Security',
        'Are you sure you want to disable app security?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              const result = await BiometricService.disableSecurity();
              
              if (result.success) {
                setSecurityEnabled(false);
                Alert.alert(
                  'Security Disabled',
                  'App security has been disabled. The app will no longer require authentication.',
                  [{ text: 'OK', style: 'default' }]
                );
              } else if (result.error !== 'user_cancel') {
                Alert.alert('Failed to Disable Security', 'Unable to disable app security.');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Security Settings"
        onBack={() => navigation.goBack()}
        showBackButton={true}
      />

      {/* Form Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Lottie Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../../../../../animation/Lock_Authentication.1.json')}
              autoPlay={true}
              loop={true}
              speed={0.5}
              resizeMode="contain"
              style={styles.lottieAnimation}
            />
          </View>
          
          {/* Security Enable Card */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#6B7280" />
              <Text style={styles.inputLabel}>App Security Lock</Text>
            </View>
            <View style={styles.securityCard}>
              <View style={styles.securityContent}>
                <View style={styles.securityInfo}>
                  <MaterialCommunityIcons
                    name={securityEnabled ? "shield-check" : "shield-off"}
                    size={24}
                    color={securityEnabled ? '#22C55E' : '#EF4444'}
                  />
                  <View style={styles.securityText}>
                    <Text style={styles.securityTitle}>
                      {securityEnabled ? 'Security Enabled' : 'Security Disabled'}
                    </Text>
                    <Text style={styles.securitySubtitle}>
                      {securityEnabled
                        ? 'App locks when you switch apps or device locks'
                        : 'App can be opened without authentication'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={securityEnabled}
                  onValueChange={handleSecurityToggle}
                  trackColor={{ false: '#E5E7EB', true: '#22C55E' }}
                  thumbColor={'#FFFFFF'}
                  disabled={isLoading}
                />
              </View>
            </View>
          </View>

          {/* Help Button */}
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => setHelpModalVisible(true)}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.helpButtonText}>How this function works</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Help Modal - LockInfo Component */}
      <LockInfo 
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  lottieAnimation: {
    width: 380,
    height: 380,
    marginTop: -20,
    marginBottom: -70,
  },
  inputContainer: {
    marginBottom: 28,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  securityCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityText: {
    marginLeft: 12,
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
});

export default SecurPermis;