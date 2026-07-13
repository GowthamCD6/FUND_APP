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
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import GroupCard from '../../../../../components/GroupCard/GroupCard';
import Header from '../../../../../components/HeaderComponent/Header';
import BettingAuction from './BettingAuction/BettingAuction';
import RandomAuction from './RandomAuction/RandomAuction';
import ApiService from '../../../../../services/ApiService';

const Auction = ({ route, navigation, onClose, selectedGroupId, selectedGroupType }) => {
  const paramGroupId = route?.params?.groupId || selectedGroupId;
  const paramGroupType = route?.params?.auctionType || selectedGroupType;

  const [activeTab, setActiveTab] = useState('betting');
  const [participants, setParticipants] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    fetchUserGroups();
  }, []);

  useEffect(() => {
    if (paramGroupId && userGroups.length > 0) {
      const matched = userGroups.find(g => g.id.toString() === paramGroupId.toString());
      if (matched) {
        handleGroupSelect(matched);
        if (paramGroupType) {
          setActiveTab(paramGroupType);
        }
      }
    }
  }, [paramGroupId, paramGroupType, userGroups]);

  const fetchUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await ApiService.makeRequest('/user/portfolio', { method: 'GET' });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.data)) {
        const transformedGroups = data.data.map(group => {
          const totalMonths = Number(group.totalMonths) || 20;
          const investmentAmount = Number(group.investmentAmount) || 0;
          return {
            id: group.id.toString(),
            name: group.groupName || 'Unknown',
            totalMembers: group.totalMembers || 0,
            currentMembers: group.currentMembers || 0,
            monthlyAmount: group.monthlyContribution || Math.round(investmentAmount / totalMonths),
            completedCycles: group.groupCompletedCycles !== undefined ? group.groupCompletedCycles : 0,
            totalCycles: totalMonths,
            collectedAmount: group.groupCollectedAmount !== undefined ? group.groupCollectedAmount : 0,
            nextDueDate: group.startDate,
            groupAmount: investmentAmount,
            status: group.paymentStatus || 'Not Started',
          };
        });
        setUserGroups(transformedGroups);
      } else {
        setUserGroups([]);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupSelect = async (group) => {
    setSelectedGroup(group);
    try {
      const response = await ApiService.makeRequest(`/user/groups/getMembers?groupId=${group.id}`, { method: 'GET' });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.members)) {
        const transformedMembers = data.members.map(member => ({
          id: member.id?.toString(),
          name: member.name || member.user_name || '',
          phone: member.phone || '',
          avatar: (member.name || member.user_name || 'U').substring(0, 2).toUpperCase(),
        }));
        setParticipants(transformedMembers);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      setParticipants([]);
    }
  };

  const handleBackFromAuction = () => {
    if (onClose) {
      onClose();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      setSelectedGroup(null);
      setActiveTab('betting');
    }
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
      onBack={() => {
        if (onClose) onClose();
        else if (navigation && navigation.canGoBack()) navigation.goBack();
      }}
      showBackButton={true}
      rightComponent={
        <MaterialCommunityIcons name="gavel" size={24} color="#6B46C1" />
      }
    />
  );

  const renderGroupsList = () => {
    if (loadingGroups) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color="#6B46C1" />
        </View>
      );
    }
    return (
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
  };

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
            selectedMembers={participants}
            onAuctionComplete={handleAuctionComplete}
          />
        ) : (
          <RandomAuction
            participants={participants}
            selectedGroup={selectedGroup}
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