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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback authentication using a simple PIN
const SECURITY_PIN = '1234'; // In production, this should be user-configurable

const SecurPermis = ({ onBack }) => {
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load security setting on component mount
  useEffect(() => {
    loadSecuritySetting();
  }, []);

  const loadSecuritySetting = async () => {
    try {
      const stored = await AsyncStorage.getItem('appSecurityEnabled');
      if (stored !== null) {
        setSecurityEnabled(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading security setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSecuritySetting = async (value) => {
    try {
      await AsyncStorage.setItem('appSecurityEnabled', JSON.stringify(value));
    } catch (error) {
      console.log('Error saving security setting:', error);
    }
  };

  const checkAuthenticationAvailability = async () => {
    // Always return available since we're using fallback PIN authentication
    return { available: true };
  };

  const performAuthentication = async (promptMessage) => {
    return new Promise((resolve) => {
      Alert.prompt(
        'Security Authentication',
        `${promptMessage}\n\nEnter PIN (Demo: 1234)`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: false, error: 'user_cancel' })
          },
          {
            text: 'Authenticate',
            onPress: (pin) => {
              if (pin === SECURITY_PIN) {
                resolve({ success: true });
              } else {
                Alert.alert('Wrong PIN', 'Please try again.');
                resolve({ success: false, error: 'wrong_pin' });
              }
            }
          }
        ],
        'secure-text'
      );
    });
  };

  const handleSecurityToggle = async (value) => {
    // Check if authentication is available
    const authCheck = await checkAuthenticationAvailability();
    
    if (!authCheck.available) {
      Alert.alert(
        'Authentication Not Available',
        authCheck.message || 'Please ensure device security (PIN, password, fingerprint, or face unlock) is enabled in your device settings.',
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
      const result = await performAuthentication('Enable App Security');

      if (result.success) {
        setSecurityEnabled(true);
        await saveSecuritySetting(true);
        Alert.alert(
          'Security Enabled',
          'App security has been successfully enabled. You will need to authenticate to access the app.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (result.error !== 'user_cancel' && result.error !== 'wrong_pin') {
        Alert.alert('Authentication Failed', 'Unable to enable security. Please try again.');
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
              const result = await performAuthentication('Confirm to disable security');
              
              if (result.success) {
                setSecurityEnabled(false);
                await saveSecuritySetting(false);
                Alert.alert(
                  'Security Disabled',
                  'App security has been disabled.',
                  [{ text: 'OK', style: 'default' }]
                );
              } else if (result.error !== 'user_cancel' && result.error !== 'wrong_pin') {
                Alert.alert('Authentication Failed', 'Unable to disable security.');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* App Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Security</Text>

          <View style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <MaterialCommunityIcons
                name="shield-check"
                size={32}
                color={securityEnabled ? '#4CAF50' : '#9E9E9E'}
              />
              <View style={styles.securityHeaderText}>
                <Text style={styles.securityTitle}>
                  {securityEnabled ? 'Security Enabled' : 'Security Disabled'}
                </Text>
                <Text style={styles.securitySubtitle}>
                  {securityEnabled
                    ? 'App is protected with device authentication'
                    : 'App can be opened without authentication'}
                </Text>
              </View>
              <Switch
                value={securityEnabled}
                onValueChange={handleSecurityToggle}
                trackColor={{ false: '#E5E7EB', true: '#4CAF50' }}
                thumbColor={'#FFFFFF'}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>

        {/* Test Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Authentication</Text>
          
          <View style={styles.infoNote}>
            <MaterialCommunityIcons name="information" size={16} color="#6B46C1" />
            <Text style={styles.infoNoteText}>Demo PIN: 1234</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={async () => {
              const result = await performAuthentication('Test Authentication');
              
              if (result.success) {
                Alert.alert('Success', 'Authentication test successful!');
              } else if (result.error !== 'user_cancel' && result.error !== 'wrong_pin') {
                Alert.alert('Failed', 'Authentication test failed.');
              }
            }}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="test-tube" size={20} color="#6B46C1" />
            <Text style={styles.testButtonText}>Test PIN Authentication</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityHeaderText: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6B46C1',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    marginLeft: 8,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoNoteText: {
    fontSize: 14,
    color: '#6B46C1',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default SecurPermis;
