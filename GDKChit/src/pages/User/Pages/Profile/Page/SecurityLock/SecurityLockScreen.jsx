import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BiometricService from '../../../../../../services/BiometricService';

const SecurityLockScreen = ({ onAuthenticationSuccess }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState({ available: false, biometryType: null });

  useEffect(() => {
    checkBiometricAvailability();
    // Auto-trigger authentication when component mounts
    const timer = setTimeout(() => {
      console.log('Auto-triggering authentication...');
      handleAuthenticate();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const checkBiometricAvailability = async () => {
    const info = await BiometricService.checkBiometricAvailability();
    setBiometricInfo(info);
  };

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    try {
      console.log('Attempting authentication...');
      const result = await BiometricService.authenticate('Unlock your app');
      console.log('Authentication result:', result);
      
      if (result.success) {
        console.log('Authentication successful, calling success callback');
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess();
        }
      } else if (result.error !== 'user_cancel') {
        Alert.alert(
          'Authentication Failed',
          'Please try again or use PIN authentication.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinAuth = async () => {
    setIsAuthenticating(true);
    setError('');
    
    try {
      const result = await BiometricService.authenticateWithDeviceCredentials('Use your device PIN, pattern or password to unlock');
      
      if (result.success) {
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess();
        }
      } else {
        setError(result.error || 'Device authentication failed');
      }
    } catch (error) {
      console.error('Device authentication error:', error);
      setError('Device authentication error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (!biometricInfo.available) return 'dialpad';
    switch (biometricInfo.biometryType) {
      case 'FaceID':
        return 'face-recognition';
      case 'TouchID':
      case 'Biometrics':
        return 'fingerprint';
      default:
        return 'shield-key';
    }
  };

  const getBiometricText = () => {
    if (!biometricInfo.available) return 'Use PIN';
    switch (biometricInfo.biometryType) {
      case 'FaceID':
        return 'Use Face ID';
      case 'TouchID':
        return 'Use Touch ID';
      case 'Biometrics':
        return 'Use Biometric';
      default:
        return 'Authenticate';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="shield-lock" 
            size={80} 
            color="#3B82F6" 
          />
        </View>

        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>
          {biometricInfo.available 
            ? `Use ${biometricInfo.biometryType} or PIN to unlock` 
            : 'Enter PIN (1234) to unlock'
          }
        </Text>

        <View style={styles.buttonContainer}>
          {biometricInfo.available ? (
            <TouchableOpacity
              style={[styles.unlockButton, isAuthenticating && styles.unlockButtonDisabled]}
              onPress={handleAuthenticate}
              disabled={isAuthenticating}
              activeOpacity={0.7}
            >
              {isAuthenticating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name={getBiometricIcon()} size={24} color="#FFFFFF" />
              )}
              <Text style={styles.unlockButtonText}>
                {isAuthenticating ? 'Authenticating...' : getBiometricText()}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.pinButton, isAuthenticating && styles.unlockButtonDisabled]}
            onPress={handlePinAuth}
            disabled={isAuthenticating}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="shield-lock" size={24} color="#3B82F6" />
            <Text style={styles.pinButtonText}>Use Device Lock</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            {biometricInfo.available ? 
              'Use biometric or device PIN/Pattern/Password' : 
              'Use device PIN/Pattern/Password'
            }
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  unlockButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  unlockButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  unlockButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  pinButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  pinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default SecurityLockScreen;