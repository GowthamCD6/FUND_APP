import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useAuctionContext } from '../../utils/AuctionContext';
import { navigate } from '../../utils/navigation';
import AuctionWebSocketService from '../../services/AuctionWebSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const GlobalAuctionModal = () => {
  const { activeAuctionAlert, clearAuctionAlert } = useAuctionContext();

  if (!activeAuctionAlert) return null;

  const { groupId, groupName, auctionType, participantIds } = activeAuctionAlert;

  const handleJoin = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        // Send join auction event
        AuctionWebSocketService.joinAuction(groupId, userId);
      }
      clearAuctionAlert();
      // Navigate to the user auction screen
      // Assuming 'AuctionScreen' is the route name for the User Auction
      // You may need to verify the correct route name used in your App's navigator
      navigate('AuctionScreen', { 
        groupId, 
        groupName, 
        auctionType 
      });
    } catch (error) {
      console.error('Error joining auction:', error);
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
          <View style={styles.header}>
            <MaterialCommunityIcons name="gavel" size={32} color="#6B46C1" />
            <Text style={styles.title}>Auction Started!</Text>
          </View>
          
          <Text style={styles.message}>
            An auction for <Text style={styles.bold}>{groupName}</Text> has started. You have been selected to participate.
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
              <Text style={styles.joinButtonText}>Join Auction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dismissButton} onPress={clearAuctionAlert}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: width,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GlobalAuctionModal;
