import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import ChitCard from './ChitCard';
import ApiService from '../../../../../services/ApiService';

const { width } = Dimensions.get('window');

const GroupCards = ({ onBack, onSelectGroup }) => {
  const [showChitCard, setShowChitCard] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch portfolio data from backend
  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getPortfolio();
      if (response.success && response.data) {
        setUserGroups(response.data);
      } else {
        setError('Failed to fetch groups');
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err.message || 'Error fetching groups');
    } finally {
      setLoading(false);
    }
  };

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
          ['completed', 'paid'].includes(item.paymentStatus) ? styles.statusCompleted : styles.statusPending
        ]}>
          <Text style={[
            styles.groupListStatusText,
            ['completed', 'paid'].includes(item.paymentStatus) ? styles.statusCompletedText : styles.statusPendingText
          ]}>
            {['completed', 'paid'].includes(item.paymentStatus) ? 'PAID' : 'PENDING'}
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
    <SafeAreaProvider>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header 
          title="My Group"
          onBack={onBack}
        />

        <View style={styles.groupListContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B46C1" />
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          ) : userGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No group card present</Text>
              <Text style={styles.emptySubText}>Join a chit group to start your investment journey</Text>
            </View>
          ) : (
            <>
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
                      {userGroups.filter(g => ['completed', 'paid'].includes(g.paymentStatus)).length}
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
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.groupListContent}
                columnWrapperStyle={styles.groupListRow}
              />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Group List Styles
  groupListContainer: {
    flex: 1,
    padding: 16,
  },

  // Loading, Error & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#1A2A4E',
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
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
