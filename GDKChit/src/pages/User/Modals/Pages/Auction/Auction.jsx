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
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GroupCard from '../../../../../components/GroupCard/GroupCard';
import Header from '../../../../../components/HeaderComponent/Header';
import BettingAuction from './BettingAuction/BettingAuction';
import RandomAuction from './RandomAuction/RandomAuction';

const Auction = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('betting');
  const [participants, setParticipants] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  // Mock user groups - replace with actual API call
  const mockUserGroups = [
    {
      id: '1',
      name: 'Friends Chit Group',
      status: 'active',
      totalMembers: 5,
      currentMembers: 5,
      monthlyAmount: 18000,
      completedCycles: 2,
      totalCycles: 12,
      collectedAmount: 36000,
      nextDueDate: '2024-06-15',
      completedDate: null,
      groupAmount: 90000,
    },
    {
      id: '2',
      name: 'Office Chit Group',
      status: 'active',
      totalMembers: 8,
      currentMembers: 8,
      monthlyAmount: 25000,
      completedCycles: 1,
      totalCycles: 8,
      collectedAmount: 25000,
      nextDueDate: '2024-06-20',
      completedDate: null,
      groupAmount: 200000,
    },
    {
      id: '3',
      name: 'Family Savings Group',
      status: 'completed',
      totalMembers: 6,
      currentMembers: 6,
      monthlyAmount: 15000,
      completedCycles: 12,
      totalCycles: 12,
      collectedAmount: 180000,
      nextDueDate: null,
      completedDate: '2024-05-30',
      groupAmount: 90000,
    },
  ];

  // Mock participants for a group
  const mockParticipants = [
    { id: '1', name: 'You', bid: 0, bidTime: null, avatar: 'U' },
    { id: '2', name: 'Pranesh', bid: 0, bidTime: null, avatar: 'PK' },
    { id: '3', name: 'Rohith', bid: 0, bidTime: null, avatar: 'R' },
    { id: '4', name: 'Sundar', bid: 0, bidTime: null, avatar: 'SR' },
    { id: '5', name: 'Lakshmi', bid: 0, bidTime: null, avatar: 'LN' },
  ];

  useEffect(() => {
    setUserGroups(mockUserGroups);
    setParticipants(mockParticipants);
  }, []);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
  };

  const handleBackFromAuction = () => {
    setSelectedGroup(null);
    setActiveTab('betting');
  };

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
            handleBackFromAuction();
          },
        },
      ],
    );
  };

  const renderGroupSelectHeader = () => (
    <Header 
      title="Select Group" 
      onBack={onClose}
      showBackButton={true}
      rightComponent={
        <MaterialCommunityIcons name="gavel" size={24} color="#6B46C1" />
      }
    />
  );

  const renderGroupsList = () => (
    <ScrollView 
      style={styles.groupsContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.groupsContent}
    >
      {userGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No groups available</Text>
          <Text style={styles.emptySubtext}>Join or create a group to start auction</Text>
        </View>
      ) : (
        <FlatList
          data={userGroups}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupCardWrapper}
              onPress={() => handleGroupSelect(item)}
              activeOpacity={0.8}
            >
              <GroupCard 
                group={item}
                onPress={() => handleGroupSelect(item)}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  const renderAuctionTabs = () => (
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

  const renderAuctionHeader = () => (
    <Header 
      title={selectedGroup?.name || 'Auction'} 
      onBack={handleBackFromAuction}
      showBackButton={true}
      rightComponent={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="cash" size={20} color="#6B46C1" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B46C1' }}>
            ₹{selectedGroup?.groupAmount?.toLocaleString()}
          </Text>
        </View>
      }
    />
  );

  // If no group selected, show group selection
  if (!selectedGroup) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        {renderGroupSelectHeader()}
        {renderGroupsList()}
      </View>
    );
  }

  // If group selected, show auction interface
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {renderAuctionHeader()}
      {renderAuctionTabs()}

      <View style={styles.contentContainer}>
        {activeTab === 'betting' ? (
          <BettingAuction
            participants={participants}
            setParticipants={setParticipants}
            selectedGroup={selectedGroup}
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
    backgroundColor: '#FAFAFA',
  },
  groupsContainer: {
    flex: 1,
  },
  groupsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupCardWrapper: {
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: '#6B46C1',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 12,
  },
});

export default Auction;
