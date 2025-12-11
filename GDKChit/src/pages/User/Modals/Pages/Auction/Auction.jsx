import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BettingAuction from './BettingAuction';
import RandomAuction from './RandomAuction';

const Auction = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('betting');
  const [participants, setParticipants] = useState([]);

  // Mock data - replace with actual user data from your group
  const mockParticipants = [
    { id: '1', name: 'You', bid: 0, bidTime: null, avatar: 'U' },
    { id: '2', name: 'Pranesh', bid: 0, bidTime: null, avatar: 'PK' },
    { id: '3', name: 'Rohith', bid: 0, bidTime: null, avatar: 'R' },
    { id: '4', name: 'Sundar', bid: 0, bidTime: null, avatar: 'SR' },
    { id: '5', name: 'Lakshmi', bid: 0, bidTime: null, avatar: 'LN' },
  ];

  const mockGroup = {
    groupName: 'My Chit Group',
    groupAmount: 90000,
    duration: 24,
  };

  useEffect(() => {
    setParticipants(mockParticipants);
  }, []);

  const handleAuctionComplete = result => {
    console.log('Auction completed:', result);
    Alert.alert(
      'Auction Complete!',
      `Winner: ${
        result.winner.name
      }\nAmount: ₹${result.amount.toLocaleString()}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Handle auction completion - save to backend, etc.
          },
        },
      ],
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Chit Auction</Text>
        <Text style={styles.headerSubtitle}>{mockGroup.groupName}</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'betting' && styles.activeTab]}
        onPress={() => setActiveTab('betting')}
      >
        <MaterialCommunityIcons
          name="gavel"
          size={20}
          color={activeTab === 'betting' ? '#6B46C1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'betting' && styles.activeTabText,
          ]}
        >
          Betting Auction
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'random' && styles.activeTab]}
        onPress={() => setActiveTab('random')}
      >
        <MaterialCommunityIcons
          name="dice-5"
          size={20}
          color={activeTab === 'random' ? '#6B46C1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'random' && styles.activeTabText,
          ]}
        >
          Random Auction
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroupInfo = () => (
    <View style={styles.groupInfoCard}>
      <View style={styles.groupInfoRow}>
        <View style={styles.groupInfoItem}>
          <MaterialCommunityIcons
            name="cash-multiple"
            size={20}
            color="#6B46C1"
          />
          <View style={styles.groupInfoText}>
            <Text style={styles.groupInfoLabel}>Total Amount</Text>
            <Text style={styles.groupInfoValue}>
              ₹{mockGroup.groupAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.groupInfoDivider} />
        <View style={styles.groupInfoItem}>
          <MaterialCommunityIcons
            name="calendar-month"
            size={20}
            color="#6B46C1"
          />
          <View style={styles.groupInfoText}>
            <Text style={styles.groupInfoLabel}>Duration</Text>
            <Text style={styles.groupInfoValue}>
              {mockGroup.duration} Months
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {renderHeader()}
      <View style={styles.separator} />
      {renderGroupInfo()}
      {renderTabs()}

      <View style={styles.contentContainer}>
        {activeTab === 'betting' ? (
          <BettingAuction
            participants={participants}
            setParticipants={setParticipants}
            selectedGroup={mockGroup}
            selectedMembers={mockParticipants}
            onAuctionComplete={handleAuctionComplete}
          />
        ) : (
          <RandomAuction
            participants={participants}
            onAuctionComplete={handleAuctionComplete}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  groupInfoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfoText: {
    marginLeft: 12,
  },
  groupInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  groupInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  groupInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#EDE9FE',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  activeTabText: {
    color: '#6B46C1',
  },
  contentContainer: {
    flex: 1,
  },
});

export default Auction;
