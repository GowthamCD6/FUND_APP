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
import SecurityService from '../services/SecurityService';

const SecurityLockScreen = ({ onAuthenticationSuccess }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    try {
      console.log('Attempting authentication...');
      const result = await SecurityService.authenticate('Unlock App');
      console.log('Authentication result:', result);
      
      if (result.success) {
        console.log('Authentication successful, calling success callback');
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess();
        }
      } else if (result.error !== 'user_cancel') {
        Alert.alert(
          'Authentication Failed',
          'Please try again or contact support if the issue persists.',
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

  useEffect(() => {
    // Auto-trigger authentication when component mounts
    const timer = setTimeout(() => {
      console.log('Auto-triggering authentication...');
      handleAuthenticate();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
          Authentication required to access your account and data
        </Text>

        <TouchableOpacity
          style={[styles.unlockButton, isAuthenticating && styles.unlockButtonDisabled]}
          onPress={handleAuthenticate}
          disabled={isAuthenticating}
          activeOpacity={0.7}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="fingerprint" size={24} color="#FFFFFF" />
          )}
          <Text style={styles.unlockButtonText}>
            {isAuthenticating ? 'Authenticating...' : 'Unlock App'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#6B7280" />
          <Text style={styles.infoText}>Demo PIN: 1234</Text>
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
  unlockButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
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