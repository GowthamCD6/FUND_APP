import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotificationService from '../../services/PushNotificationService';

const BatteryOptimizationModal = () => {
  const [visible, setVisible] = useState(false);
  const [manufacturer, setManufacturer] = useState('');
  const [isOEMSpecific, setIsOEMSpecific] = useState(false);

  useEffect(() => {
    checkBatteryOptimization();
  }, []);

  const checkBatteryOptimization = async () => {
    if (Platform.OS !== 'android') return;

    try {
      // Check if already dismissed recently
      const dismissed = await AsyncStorage.getItem('battery_optimization_dismissed');
      if (dismissed === 'true') return;

      const isIgnored = await PushNotificationService.isBatteryOptimizationIgnored();
      if (isIgnored) return; // Already whitelisted

      const deviceInfo = await PushNotificationService.getDeviceManufacturer();
      const mfg = (deviceInfo?.manufacturer || '').toLowerCase();
      setManufacturer(deviceInfo?.manufacturer || 'Android');

      // Check if device is one of the aggressive OEMs
      const isAggressiveOEM = ['xiaomi', 'redmi', 'poco', 'oppo', 'realme', 'vivo', 'iqoo', 'samsung'].some(
        oem => mfg.includes(oem)
      );
      setIsOEMSpecific(isAggressiveOEM);

      // Show after a brief delay so user is settled on the screen
      setTimeout(() => {
        setVisible(true);
      }, 3000);
    } catch (err) {
      console.warn('Battery optimization check failed:', err);
    }
  };

  const handleEnable = async () => {
    try {
      if (isOEMSpecific) {
        await PushNotificationService.openOEMAutostartSettings();
      } else {
        await PushNotificationService.requestDisableBatteryOptimization();
      }
      await AsyncStorage.setItem('battery_optimization_dismissed', 'true');
      setVisible(false);
    } catch (e) {
      setVisible(false);
    }
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem('battery_optimization_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>⚡</Text>
          </View>

          <Text style={styles.title}>Never Miss a Live Auction</Text>

          <Text style={styles.description}>
            Your {manufacturer} phone aggressively puts background apps to sleep. To guarantee you receive live auction countdowns and payment alerts when the app is closed:
          </Text>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>Turn OFF Battery Optimization for GDKChit</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>Allow "Autostart" / "Run in Background"</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEnable}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Enable Uninterrupted Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>I'll Do It Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 7, 34, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAF5FF',
    borderWidth: 2,
    borderColor: '#E9D8FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '500',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6B46C1',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BatteryOptimizationModal;
