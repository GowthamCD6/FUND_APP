import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './ManageGsty';
import GroupInfoAdmin from './GroupManagement/GroupInfo.jsx';
import ApiService from '../../../../../services/ApiService';

const ManageGroups = ({onBack}) => {
  const [activeTab, setActiveTab] = useState('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [longPressedGroup, setLongPressedGroup] = useState(null);

  // Sample data - replace with actual API calls
  const sampleGroups = [
    {
      id: 1,
      name: 'Business Investment Group',
      status: 'ctive',
      totalMembers: 20,
      currentMembers: 18,
      completedCycles: 8,
      totalCycles: 20,
      monthlyAmount: 10000,
      groupAmount: 200000,
      startDate: '2024-01-15',
      nextDueDate: '2024-11-15',
      collectedAmount: 1600000,
      remainingAmount: 400000,
      groupCode: 'GRP001',
      createdBy: 'Admin',
      createdDate: '2024-01-10',
    },
    {
      id: 2,
      name: 'Family Savings Circle',
      status: 'active',
      totalMembers: 12,
      currentMembers: 12,
      completedCycles: 3,
      totalCycles: 12,
      monthlyAmount: 5000,
      groupAmount: 60000,
      startDate: '2024-08-01',
      nextDueDate: '2024-11-01',
      collectedAmount: 180000,
      remainingAmount: 420000,
      groupCode: 'GRP002',
      createdBy: 'Admin',
      createdDate: '2024-07-25',
    },
    {
      id: 3,
      name: 'Student Education Fund',
      status: 'not-started',
      totalMembers: 15,
      currentMembers: 8,
      completedCycles: 0,
      totalCycles: 15,
      monthlyAmount: 3000,
      groupAmount: 45000,
      startDate: '2024-12-01',
      nextDueDate: null,
      collectedAmount: 0,
      remainingAmount: 675000,
      groupCode: 'GRP003',
      createdBy: 'Admin',
      createdDate: '2024-10-01',
    },
    {
      id: 4,
      name: 'Women Empowerment Fund',
      status: 'not-started',
      totalMembers: 10,
      currentMembers: 5,
      completedCycles: 0,
      totalCycles: 10,
      monthlyAmount: 8000,
      groupAmount: 80000,
      startDate: '2024-12-15',
      nextDueDate: null,
      collectedAmount: 0,
      remainingAmount: 800000,
      groupCode: 'GRP004',
      createdBy: 'Admin',
      createdDate: '2024-10-05',
    },
    {
      id: 5,
      name: 'Retirement Planning Group',
      status: 'active',
      totalMembers: 25,
      currentMembers: 25,
      completedCycles: 12,
      totalCycles: 25,
      monthlyAmount: 15000,
      groupAmount: 375000,
      startDate: '2023-11-01',
      nextDueDate: '2024-11-01',
      collectedAmount: 4500000,
      remainingAmount: 4875000,
      groupCode: 'GRP005',
      createdBy: 'Admin',
      createdDate: '2023-10-20',
    },
  ];

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
        throw new Error(result?.message || 'Failed to create group');
      }

      const mapped = (result.data || []).map(g => {
        const totalNum = Number(g.totalMembers || g.total_members) || 1;
        const totalAmount = Number(g.groupAmount || g.group_amount) || 0;
        return {
          ...g,
          id: g.id,
          name: g.name || g.group_name || 'Untitled',
          status: g.status === 'Not Started' || g.status === 'not started' || g.status === 'not-started' ? 'Not Started' : 'Active',
          totalMembers: g.totalMembers !== undefined ? g.totalMembers : (g.total_members !== undefined ? g.total_members : 0),
          currentMembers: g.currentMembers !== undefined ? g.currentMembers : (g.current_members !== undefined ? g.current_members : 0),
          completedCycles: g.completedCycles || 0,
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
      console.log(mapped);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]); // Fallback to sample data on error
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
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
      default:
        return 'help-circle';
    }
  };

  const openGroupDetails = group => {
    // console.log(group);
    
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  const handleLongPress = group => {
    if (group.status === 'Not Started') {
      setLongPressedGroup(group);
      setShowActionModal(true);
    }
  };

  const handleActivateGroup = async () => {
    setShowActionModal(false);
    
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
          onPress: async () => {
            try {
              const response = await ApiService.makeRequest('/admin/groups/activate', {
                method: 'POST',
                body: JSON.stringify({ groupId: longPressedGroup.id }),
              });
              
              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to activate group');
              }
              
              // Update locally after successful backend confirmation
              setGroups(prevGroups =>
                prevGroups.map(g =>
                  g.id === longPressedGroup.id
                    ? {...g, status: 'Active'}
                    : g
                )
              );
              
              Alert.alert('Success', 'Group activated successfully');
              setLongPressedGroup(null);
            } catch (error) {
              console.error('Error activating group:', error);
              Alert.alert('Error', 'Failed to activate group. Please try again later.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async () => {
    setShowActionModal(false);
    
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${longPressedGroup.name}"? This action cannot be undone.`,
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
                method: 'POST', // Backend route maps to POST /groups/delete
                body: JSON.stringify({ groupId: longPressedGroup.id }),
              });
              
              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to delete group');
              }
              
              // Update locally after successful backend confirmation
              setGroups(prevGroups =>
                prevGroups.filter(g => g.id !== longPressedGroup.id)
              );
              
              Alert.alert('Success', 'Group deleted successfully');
              setLongPressedGroup(null);
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group. Please try again later.');
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

  const renderGroupCard = ({item}) => (
    <View style={styles.groupCard}>
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={1}
        style={{flex: 1}}>
        {/* Header with Group Name and Arrow */}
        <View style={styles.groupCardHeader}>
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: getStatusColor(item.status)},
              ]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={10}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {item.status === 'Not Started' ? 'NOT STARTED' : 'ACTIVE'}
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
                {item.totalMembers} Members
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

          {/* Progress Section - Only for Active Groups */}
          {item.status === 'Active' && (
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
                : `Start Date: ${formatDate(item.startDate)}`}
            </Text>
            <Text style={styles.groupAmount}>
              {item.status === 'Active'
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
    return {active, notStarted};
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
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#212121"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Groups</Text>
        </View>
      </View>

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
            Active Groups ({tabCounts.active})
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
      </View>

      {/* Groups List */}
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
              No {activeTab === 'Active' ? 'Active' : 'Pending'} groups found
            </Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'Active'
                ? 'Create a new group to get started'
                : 'Groups will appear here once created'}
            </Text>
          </View>
        )}
      />

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

// Group Details Page Component
const GroupDetailsPage = ({group, onBack}) => {
  const formatDate = dateString => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
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

  const getStatusColor = status => {
    switch (status) {
      case 'Active':
        return '#10B981';
      case 'Not Started':
        return '#F59E0B';
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
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#212121"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Details</Text>
        </View>
      </View>

      {/* Content will be added based on your requirements */}
      <View style={styles.detailsContainer}>
        <Text style={styles.comingSoonText}>
          Group details content will be added here. Please provide the content
          structure you want to include.
        </Text>

        {/* Basic Group Info Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{group.name}</Text>
          <Text style={styles.previewCode}>#{group.groupCode}</Text>

          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(group.status)},
            ]}>
            <MaterialCommunityIcons
              name={getStatusIcon(group.status)}
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {group.status === 'not-started'
                ? 'NOT STARTED'
                : group.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ManageGroups;