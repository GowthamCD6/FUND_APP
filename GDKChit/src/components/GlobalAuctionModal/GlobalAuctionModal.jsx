import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useAuctionContext } from '../../utils/AuctionContext';
import { navigate } from '../../utils/navigation';
import AuctionWebSocketService from '../../services/AuctionWebSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const GlobalAuctionModal = () => {
  const { activeAuctionAlert, clearAuctionAlert } = useAuctionContext();

  if (!activeAuctionAlert) return null;

  const { groupId, groupName, auctionType } = activeAuctionAlert;

  const handleJoin = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        // Send join auction event
        if (typeof AuctionWebSocketService.joinAuction === 'function') {
          AuctionWebSocketService.joinAuction(groupId, userId);
        } else if (typeof AuctionWebSocketService.userJoinedAuction === 'function') {
          AuctionWebSocketService.userJoinedAuction(groupId, userId);
        }
      }
      clearAuctionAlert();
      // Navigate to the user auction screen
      navigate('AuctionScreen', { 
        groupId, 
        groupName, 
        auctionType 
      });
    } catch (error) {
      console.error('Error joining auction:', error);
      clearAuctionAlert();
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={clearAuctionAlert}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Top handle bar indicator */}
          <View style={styles.handleBar} />
          
          {/* Auction Type Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, auctionType === 'random' ? styles.badgeRandom : styles.badgeBetting]}>
              <MaterialCommunityIcons 
                name={auctionType === 'random' ? "dice-multiple" : "gavel"} 
                size={13} 
                color={auctionType === 'random' ? "#059669" : "#6B46C1"} 
              />
              <Text style={[styles.badgeText, auctionType === 'random' ? styles.badgeTextRandom : styles.badgeTextBetting]}>
                {auctionType === 'random' ? 'LUCKY DRAW' : 'BETTING AUCTION'}
              </Text>
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={auctionType === 'random' ? "trophy-outline" : "gavel"} 
                size={26} 
                color="#6B46C1" 
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Auction Invitation</Text>
              <Text style={styles.subtitle}>Real-time Chit Auction</Text>
            </View>
          </View>
          
          {/* Content Description */}
          <View style={styles.contentContainer}>
            <Text style={styles.message}>
              You have been invited to participate in the live auction for group <Text style={styles.groupHighlight}>{groupName}</Text>.
            </Text>
            <Text style={styles.note}>
              Please join now to prepare. The auction session will start shortly.
            </Text>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.dismissButton} 
              onPress={clearAuctionAlert}
              activeOpacity={0.6}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.joinButton} 
              onPress={handleJoin}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="login" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // Modern sleek dark backdrop
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    width: width,
    alignItems: 'stretch',
    elevation: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeBetting: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  badgeRandom: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextBetting: {
    color: '#6B46C1',
  },
  badgeTextRandom: {
    color: '#059669',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titleContainer: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1B4B',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  contentContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  message: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },
  groupHighlight: {
    fontWeight: '700',
    color: '#6B46C1',
  },
  note: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  joinButton: {
    flex: 1.6,
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default GlobalAuctionModal;
