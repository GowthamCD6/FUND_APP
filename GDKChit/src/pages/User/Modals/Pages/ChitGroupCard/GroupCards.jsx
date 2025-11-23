import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import ChitCard from './ChitCard';

const { width } = Dimensions.get('window');

const GroupCards = ({ onBack, onSelectGroup }) => {
  const [showChitCard, setShowChitCard] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Sample data for 20 groups
  const userGroups = Array.from({ length: 20 }, (_, index) => ({
    id: `GRP-2024-${String(index + 1).padStart(3, '0')}`,
    groupName: `Group ${String.fromCharCode(65 + (index % 26))}${index > 25 ? Math.floor(index / 26) : ''}`,
    totalMembers: 20,
    monthlyContribution: (index + 1) * 1000 + 2000,
    nextPaymentDate: '2025-09-15',
    paymentStatus: index % 3 === 0 ? 'completed' : 'pending',
    currentMonth: Math.floor(Math.random() * 15) + 1,
    totalMonths: 20,
    yourPosition: Math.floor(Math.random() * 20) + 1,
    estimatedReceiveAmount: (index + 1) * 15000 + 50000,
  }));

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setShowChitCard(true);
    if (onSelectGroup) {
      onSelectGroup(group);
    }
  };

  const handleBackFromChitCard = () => {
    setShowChitCard(false);
    setSelectedGroup(null);
  };

  // If showing ChitCard, render it
  if (showChitCard && selectedGroup) {
    return <ChitCard selectedGroup={selectedGroup} onBack={handleBackFromChitCard} />;
  }

  const renderGroupCard = ({ item }) => (
    <TouchableOpacity
      style={styles.groupListCard}
      onPress={() => handleGroupSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupListCardHeader}>
        <Text style={styles.groupListCardName}>{item.groupName}</Text>
        <View style={[
          styles.groupListStatusBadge,
          item.paymentStatus === 'completed' ? styles.statusCompleted : styles.statusPending
        ]}>
          <Text style={[
            styles.groupListStatusText,
            item.paymentStatus === 'completed' ? styles.statusCompletedText : styles.statusPendingText
          ]}>
            {item.paymentStatus === 'completed' ? 'PAID' : 'PENDING'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.groupListCardId}>ID: {item.id}</Text>
      
      <View style={styles.groupListCardInfo}>
        <Text style={styles.currentMonthText}>Current Month: {item.currentMonth}</Text>
      </View>

      <View style={styles.groupListProgressSection}>
        <View style={styles.groupListProgressBar}>
          <View 
            style={[
              styles.groupListProgressFill, 
              { width: `${(item.currentMonth / item.totalMonths) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.groupListProgressText}>
          {item.currentMonth}/{item.totalMonths} months
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header 
          title="My Group"
          onBack={onBack}
        />

        <View style={styles.groupListContainer}>
          {/* Summary Stats */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Portfolio Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{userGroups.length}</Text>
                <Text style={styles.summaryStatLabel}>Total Groups</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {userGroups.filter(g => g.paymentStatus === 'completed').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Paid</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {userGroups.filter(g => g.paymentStatus === 'pending').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Groups Grid */}
          <FlatList
            data={userGroups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.groupListContent}
            columnWrapperStyle={styles.groupListRow}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: -27,
  },

  // Group List Styles
  groupListContainer: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  groupListContent: {
    paddingBottom: 20,
  },
  groupListRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupListCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupListCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2A4E',
    flex: 1,
    marginRight: 8,
  },
  groupListStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  groupListStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groupListCardId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: 8,
  },
  groupListCardInfo: {
    marginBottom: 16,
  },
  currentMonthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
    marginBottom: 8,
  },
  groupListProgressSection: {
    marginBottom: 12,
  },
  groupListProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  groupListProgressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 2,
  },
  groupListProgressText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Status Badge Styles
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompletedText: {
    color: '#065F46',
  },
  statusPendingText: {
    color: '#92400E',
  },
});

export default GroupCards;
