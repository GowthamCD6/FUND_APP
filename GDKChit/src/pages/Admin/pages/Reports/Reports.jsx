import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../../components/HeaderComponent/Header';
import GroupCard from '../../../../components/GroupCard/GroupCard';
import styles from './ReportsStyles';
import ApiService from '../../../../services/ApiService';

const SkeletonBox = ({ width, height, borderRadius = 6, style }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#CBD5E1',
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

const GroupCardSkeleton = () => (
  <View style={[styles.groupCard, { opacity: 0.85 }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox width={160} height={18} borderRadius={4} />
        <SkeletonBox width={70} height={20} borderRadius={10} />
      </View>
      <SkeletonBox width={24} height={24} borderRadius={12} />
    </View>

    <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonBox width={100} height={14} borderRadius={4} />
        <SkeletonBox width={100} height={14} borderRadius={4} />
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonBox width={80} height={14} borderRadius={4} />
          <SkeletonBox width={36} height={14} borderRadius={4} />
        </View>
        <SkeletonBox width="100%" height={6} borderRadius={3} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width={110} height={12} borderRadius={4} />
        <SkeletonBox width={90} height={14} borderRadius={4} />
      </View>
    </View>
  </View>
);

const Reports = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeStatus = (status) => {
    const value = String(status || '')
      .toLowerCase()
      .replace(/-/g, ' ')
      .trim();

    if (value === 'completed' || value === 'complete') return 'completed';
    if (value === 'active' || value === 'ongoing' || value === 'on going' || value === 'on_going') {
      return 'active';
    }

    return 'hidden';
  };

  const loadGroups = useCallback(async () => {
    try {
      const response = await ApiService.makeRequest('/admin/reports/groups', {
        method: 'GET',
      });

      const contentType = response.headers.get('content-type') || '';
      let result;

      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response: ${text.substring(0, 200)}`);
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to fetch groups');
      }

      const mapped = (result.data || [])
        .map((g) => {
          const totalNum = Number(g.totalMembers || g.total_members || 1) || 1;
          const totalAmount = Number(g.groupAmount || g.group_amount || 0) || 0;

          const normalizedStatus = normalizeStatus(g.status);

          return {
            ...g,
            id: Number(g.id),
            name: g.name || g.group_name || 'Untitled',
            status: normalizedStatus,
            totalMembers: Number(g.totalMembers || g.total_members || 0),
            currentMembers: Number(g.currentMembers || g.current_members || 0),
            completedCycles: Number(g.completedCycles || g.completed_cycles || 0),
            duration: Number(g.duration || totalNum || 1),
            totalCycles: Number(g.totalCycles || g.duration || totalNum || 1),
            monthlyAmount:
              Number(g.monthlyAmount || g.monthly_amount) || Math.round(totalAmount / Math.max(1, Number(g.duration || totalNum || 1))),
            groupAmount: totalAmount,
            startDate: g.startDate || g.start_date,
            endDate: g.endDate || g.end_date,
            nextDueDate: g.nextDueDate || g.next_due_date,
            collectedAmount: Number(g.collectedAmount || g.collected_amount || 0),
            remainingAmount: Number(g.remainingAmount || g.remaining_amount || 0),
          };
        })
        .filter((g) => g.status === 'active' || g.status === 'completed');

      setGroups(mapped);
    } catch (error) {
      console.error('Error fetching groups in Reports:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const getFilteredGroups = () => {
    if (activeTab === 'active') {
      return groups.filter((group) => group.status === 'active');
    }

    return groups.filter((group) => group.status === 'completed');
  };

  const openGroupDetails = () => {
    // Disabled for main card body; details page opened via right arrow chevron (>).
  };

  const openGroupModal = (group) => {
    if (group) {
      navigation.navigate('MembersDetails', { group });
    }
  };

  const getTabCounts = () => {
    const active = groups.filter((g) => g.status === 'active').length;
    const completed = groups.filter((g) => g.status === 'completed').length;
    return { active, completed };
  };

  const tabCounts = getTabCounts();

  const renderGroupCard = ({ item }) => (
    <GroupCard group={item} onPress={openGroupDetails} onArrowPress={openGroupModal} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Header title="Reports" onBack={() => navigation.navigate('Dashboard')} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({tabCounts.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({tabCounts.completed})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((key) => (
            <GroupCardSkeleton key={key} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={getFilteredGroups()}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ paddingTop: 48, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280', fontSize: 15 }}>No {activeTab} groups found.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Reports;