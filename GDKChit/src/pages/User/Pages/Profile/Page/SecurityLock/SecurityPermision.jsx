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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BiometricService from '../../../../../../services/BiometricService';

const SecurPermis = ({ onBack }) => {
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load security setting on component mount
  useEffect(() => {
    loadSecuritySetting();
  }, []);

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
      </View>
      <View style={styles.separator} />

      {/* Form Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
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

          {/* Security Features Info */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons name="information" size={16} color="#6B7280" />
              <Text style={styles.inputLabel}>Authentication Methods</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="fingerprint" size={20} color="#3B82F6" />
                <Text style={styles.infoText}>Biometric (Fingerprint/Face ID)</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="form-textbox-password" size={20} color="#3B82F6" />
                <Text style={styles.infoText}>Device PIN/Pattern/Password</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="shield-key" size={20} color="#3B82F6" />
                <Text style={styles.infoText}>Automatic lock on app switch</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  securityCard: {
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
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
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
});

export default SecurPermis;