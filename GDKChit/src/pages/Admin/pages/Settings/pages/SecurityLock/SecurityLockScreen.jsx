import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BiometricService from '../../../../../../services/BiometricService';

const { width, height } = Dimensions.get('window');

const SecurityLockScreen = ({ onAuthenticationSuccess }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState({ available: false, biometryType: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    checkBiometricAvailability();
    
    // Update time every second for accurate time display
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Auto-trigger authentication when component mounts
    const timer = setTimeout(() => {
      console.log('Auto-triggering authentication...');
      handleAuthenticate();
    }, 800);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
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
      const result = await BiometricService.authenticate('Unlock GDK Chit Fund');
      console.log('Authentication result:', result);
      
      if (result.success) {
        console.log('Authentication successful, calling success callback');
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess();
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      const result = await BiometricService.authenticateWithDeviceCredentials('Unlock GDK Chit Fund with device credentials');
      
      if (result.success) {
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess();
        }
      }
    } catch (error) {
      console.error('Device authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (!biometricInfo.available) return 'lock-outline';
    switch (biometricInfo.biometryType) {
      case 'FaceID':
        return 'face-recognition';
      case 'TouchID':
      case 'Biometrics':
        return 'fingerprint';
      default:
        return 'fingerprint';
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      
      {/* Time and Date Header */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Biometric Icon */}
        <View style={styles.biometricContainer}>
          <MaterialCommunityIcons 
            name={getBiometricIcon()} 
            size={140} 
            color="#FFFFFF" 
            style={styles.biometricIcon}
          />
        </View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Verify to continue</Text>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        {/* Primary Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isAuthenticating && styles.verifyButtonDisabled]}
          onPress={biometricInfo.available ? handleAuthenticate : handlePinAuth}
          disabled={isAuthenticating}
          activeOpacity={0.8}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Alternative Authentication */}
        {biometricInfo.available && (
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handlePinAuth}
            disabled={isAuthenticating}
            activeOpacity={0.7}
          >
            <Text style={styles.alternativeText}>Use Device PIN or Pattern</Text>
          </TouchableOpacity>
        )}

        {/* Support Information */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            For help, contact support at{' '}
            <Text style={styles.supportLink}>+91-8610696889</Text>{' '}
            using your registered number.
          </Text>
          <Text style={styles.supportText}>Or</Text>
          <Text style={styles.supportText}>
            Mail us at{' '}
            <Text style={styles.supportLink}>Gowthamnaveen124@gmail.com</Text>{' '}
            with your registered email.
          </Text>
        </View>
      </View>

      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  timeContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  timeText: {
    fontSize: 80,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Thin',
    lineHeight: 85,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: -5,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  biometricContainer: {
    marginBottom: 40,
  },
  biometricIcon: {
    opacity: 0.9,
    marginTop: -80,
  },
  instructionText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Regular',
  },
  bottomContainer: {
    paddingHorizontal: 32,
    marginTop: -30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  verifyButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 20,
    marginTop: -10,
    alignItems: 'center',
    elevation: 0,
    shadowColor: 'transparent',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Medium',
  },
  alternativeButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  alternativeText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  supportContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  supportText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: '400',
  },
  supportLink: {
    color: '#6B46C1',
    fontWeight: '500',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: Platform.OS === 'ios' ? 8 : 15,
    opacity: 0.3,
  },
});

export default SecurityLockScreen;