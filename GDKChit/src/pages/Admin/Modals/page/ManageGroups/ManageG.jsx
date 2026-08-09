import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './ManageGsty';
import GroupInfoAdmin from './GroupManagement/GroupInfo.jsx';
import ApiService from '../../../../../services/ApiService';
import Header from '../../../../../components/HeaderComponent/Header';

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
  <View style={[styles.groupCard, { padding: 16 }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <SkeletonBox width={160} height={18} borderRadius={4} />
      <SkeletonBox width={75} height={20} borderRadius={10} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <SkeletonBox width={110} height={14} borderRadius={4} />
      <SkeletonBox width={110} height={14} borderRadius={4} />
    </View>
    <View style={{ gap: 6, marginBottom: 12 }}>
      <SkeletonBox width="100%" height={8} borderRadius={4} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
      <SkeletonBox width={100} height={12} borderRadius={4} />
      <SkeletonBox width={120} height={12} borderRadius={4} />
    </View>
  </View>
);

const ManageGroups = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [longPressedGroup, setLongPressedGroup] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await ApiService.makeRequest('/admin/groups/getGroups', {
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

      const mapped = (result.data || result.groups || []).map(g => {
        const totalNum = Number(g.totalMembers || g.total_members) || 1;
        const totalAmount = Number(g.groupAmount || g.group_amount) || 0;
        const completed = Number(g.completedCycles) || 0;

        const rawStatus = String(g.status || '').toLowerCase().trim();
        let status = 'Active';
        if (rawStatus.includes('not started') || rawStatus === 'not-started') {
          status = 'Not Started';
        } else if (rawStatus === 'completed' || (completed > 0 && completed >= totalNum)) {
          status = 'Completed';
        }

        return {
          ...g,
          id: g.id,
          name: g.name || g.group_name || 'Untitled',
          status,
          totalMembers: g.totalMembers !== undefined ? g.totalMembers : (g.total_members !== undefined ? g.total_members : 0),
          currentMembers: g.currentMembers !== undefined ? g.currentMembers : (g.current_members !== undefined ? g.current_members : 0),
          completedCycles: completed,
          duration: g.duration || totalNum || 20,
          totalCycles: g.duration || totalNum || 20,
          monthlyAmount: g.monthly_amount || Math.round(totalAmount / (g.duration || totalNum)),
          groupAmount: totalAmount,
          startDate: g.startDate || g.start_date,
          endDate: g.endDate || g.end_date,
          nextDueDate: g.nextDueDate || g.next_due_date,
          collectedAmount: g.collectedAmount || 0,
          remainingAmount: g.remainingAmount || 0,
          groupCode: g.groupCode || g.group_code,
          createdDate: g.createdDate || g.created_at,
        };
      });

      setGroups(mapped);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const getFilteredGroups = () => {
    return groups.filter(group => group.status === activeTab);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'Active':
        return '#10B981';
      case 'Not Started':
        return '#F59E0B';
      case 'Completed':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'Active':
        return 'progress-clock';
      case 'Not Started':
        return 'clock-outline';
      case 'Completed':
        return 'check-decagram';
      default:
        return 'help-circle';
    }
  };

  const openGroupDetails = group => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  const handleLongPress = group => {
    setLongPressedGroup(group);
    setShowActionModal(true);
  };

  const executeActivation = async (groupId) => {
    try {
      const response = await ApiService.makeRequest('/admin/groups/activate', {
        method: 'POST',
        body: JSON.stringify({ groupId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to activate group');
      }

      setGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId
            ? { ...g, status: 'Active' }
            : g
        )
      );

      Alert.alert('Success', 'Group activated successfully');
      setLongPressedGroup(null);
    } catch (error) {
      console.error('Error activating group:', error);
      Alert.alert('Error', error?.message || 'Failed to activate group. Please try again later.');
    }
  };

  const handleActivateGroup = async () => {
    setShowActionModal(false);
    if (!longPressedGroup) return;

    if (longPressedGroup.currentMembers === 0) {
      Alert.alert(
        'Warning: Zero Members',
        `"${longPressedGroup.name}" currently has 0 members enrolled. Are you sure you want to activate it?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLongPressedGroup(null) },
          { text: 'Activate Anyway', onPress: () => executeActivation(longPressedGroup.id) },
        ]
      );
      return;
    }

    Alert.alert(
      'Activate Group',
      `Are you sure you want to activate "${longPressedGroup.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setLongPressedGroup(null),
        },
        {
          text: 'Activate',
          style: 'default',
          onPress: () => executeActivation(longPressedGroup.id),
        },
      ]
    );
  };

  const handleDeleteGroup = async () => {
    setShowActionModal(false);
    if (!longPressedGroup) return;

    if (longPressedGroup.status === 'Active' && (longPressedGroup.collectedAmount > 0 || longPressedGroup.completedCycles > 0)) {
      Alert.alert(
        'Cannot Delete Active Group',
        `"${longPressedGroup.name}" is currently active with ongoing payments or completed cycles. You cannot delete active financial groups directly.`
      );
      setLongPressedGroup(null);
      return;
    }

    Alert.alert(
      'Delete Group & Chat Room',
      `Are you sure you want to delete "${longPressedGroup.name}"? Deleting this group will permanently remove it and its linked chat room for all members. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setLongPressedGroup(null),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.makeRequest('/admin/groups/delete', {
                method: 'POST',
                body: JSON.stringify({ groupId: longPressedGroup.id }),
              });

              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(result?.message || 'Failed to delete group');
              }

              setGroups(prevGroups =>
                prevGroups.filter(g => g.id !== longPressedGroup.id)
              );

              Alert.alert('Success', 'Group deleted successfully');
              setLongPressedGroup(null);
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', error?.message || 'Failed to delete group. Please try again later.');
            }
          },
        },
      ]
    );
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const renderGroupCard = ({ item }) => (
    <View style={styles.groupCard}>
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={1}
        style={{ flex: 1 }}>
        {/* Header with Group Name and Status */}
        <View style={styles.groupCardHeader}>
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}>
              <MaterialCommunityIcons
                name={getStatusIcon(item.status)}
                size={10}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => openGroupDetails(item)}
            activeOpacity={0.6}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {/* Card Content */}
        <View style={styles.groupCardContent}>
          {/* Members and Amount Info */}
          <View style={styles.groupInfoRow}>
            <View style={styles.groupInfoItem}>
              <MaterialCommunityIcons
                name="account-group"
                size={16}
                color="#6B7280"
              />
              <Text style={styles.groupInfoText}>
                {item.currentMembers || item.totalMembers || 0} / {item.totalMembers} Members
              </Text>
            </View>
            <View style={styles.groupInfoItem}>
              <MaterialCommunityIcons
                name="currency-inr"
                size={16}
                color="#6B7280"
              />
              <Text style={styles.groupInfoText}>
                {formatCurrency(item.monthlyAmount)}/month
              </Text>
            </View>
          </View>

          {/* Progress Section - For Active & Completed Groups */}
          {(item.status === 'Active' || item.status === 'Completed') && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {item.completedCycles}/{item.totalCycles} Cycles
                </Text>
                <Text style={styles.progressPercentage}>
                  {getProgressPercentage(item.completedCycles, item.totalCycles)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: item.status === 'Completed' ? '#3B82F6' : '#10B981',
                      width: `${getProgressPercentage(
                        item.completedCycles,
                        item.totalCycles,
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Footer with Date and Collection Amount */}
          <View style={styles.groupCardFooter}>
            <Text style={styles.groupDate}>
              {item.status === 'Active'
                ? `Next Due: ${formatDate(item.nextDueDate)}`
                : item.status === 'Completed'
                  ? `Completed On: ${formatDate(item.endDate || item.nextDueDate)}`
                  : `Start Date: ${formatDate(item.startDate)}`}
            </Text>
            <Text style={styles.groupAmount}>
              {item.status === 'Active' || item.status === 'Completed'
                ? `${formatCurrency(item.collectedAmount)} collected`
                : `${formatCurrency(item.groupAmount)} total`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const getTabCounts = () => {
    const active = groups.filter(g => g.status === 'Active').length;
    const notStarted = groups.filter(g => g.status === 'Not Started').length;
    const completed = groups.filter(g => g.status === 'Completed').length;
    return { active, notStarted, completed };
  };

  const tabCounts = getTabCounts();

  if (showGroupDetails && selectedGroup) {
    return (
      <GroupInfoAdmin
        group={selectedGroup}
        onBack={() => setShowGroupDetails(false)}
        onSave={data => {
          console.log('Group data updated:', data);
          setShowGroupDetails(false);
          loadGroups();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Manage Groups" onBack={onBack} />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Active' && styles.activeTabText,
            ]}>
            Active ({tabCounts.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Not Started' && styles.activeTab]}
          onPress={() => setActiveTab('Not Started')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Not Started' && styles.activeTabText,
            ]}>
            Not Started ({tabCounts.notStarted})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
          onPress={() => setActiveTab('Completed')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Completed' && styles.activeTabText,
            ]}>
            Completed ({tabCounts.completed})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          <GroupCardSkeleton />
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={getFilteredGroups()}
          renderItem={renderGroupCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={80}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>
                No {activeTab} groups found
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 'Active'
                  ? 'Create a new group to get started'
                  : activeTab === 'Completed'
                    ? 'Completed groups will appear here'
                    : 'Groups will appear here once created'}
              </Text>
            </View>
          )}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowActionModal(false);
          setLongPressedGroup(null);
        }}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowActionModal(false);
            setLongPressedGroup(null);
          }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Actions</Text>
              <Text style={styles.modalSubtitle}>
                {longPressedGroup?.name}
              </Text>
            </View>

            {longPressedGroup?.status === 'Not Started' && (
              <>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleActivateGroup}>
                  <MaterialCommunityIcons
                    name="play-circle"
                    size={24}
                    color="#10B981"
                  />
                  <Text style={styles.modalActionText}>Activate Group</Text>
                </TouchableOpacity>

                <View style={styles.modalDivider} />
              </>
            )}

            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={handleDeleteGroup}>
              <MaterialCommunityIcons
                name="delete"
                size={24}
                color="#EF4444"
              />
              <Text style={[styles.modalActionText, styles.deleteText]}>
                Delete Group
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowActionModal(false);
                setLongPressedGroup(null);
              }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ManageGroups;