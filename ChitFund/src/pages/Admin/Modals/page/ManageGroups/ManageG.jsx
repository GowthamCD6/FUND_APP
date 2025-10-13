import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './ManageGsty';
import GroupInfoAdmin from './page/GroupInfo';
import ApiService from '../../../../../services/ApiService';

const ManageGroups = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  // Sample data - replace with actual API calls
  const sampleGroups = [
    {
      id: 1,
      name: 'Business Investment Group',
      status: 'active',
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
      createdDate: '2024-01-10'
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
      createdDate: '2024-07-25'
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
      createdDate: '2024-10-01'
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
      createdDate: '2024-10-05'
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
      createdDate: '2023-10-20'
    }
  ];

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async() => {
    try{
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

      setGroups(result.data);
      // console.log(result.data);
      
    }
    catch(error){
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Not Started': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return 'progress-clock';
      case 'Not Started': return 'clock-outline';
      default: return 'help-circle';
    }
  };

  const openGroupDetails = (group) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
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
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => openGroupDetails(item)}
      activeOpacity={0.7}
    >
      {/* Header with Group Name and Arrow */}
      <View style={styles.groupCardHeader}>
        <View style={styles.groupNameContainer}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
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
        <View style={styles.arrowButton}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.groupCardContent}>
        {/* Members and Amount Info */}
        <View style={styles.groupInfoRow}>
          <View style={styles.groupInfoItem}>
            <MaterialCommunityIcons name="account-group" size={16} color="#6B7280" />
            <Text style={styles.groupInfoText}>{item.totalMembers} Members</Text>
          </View>
          <View style={styles.groupInfoItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
            <Text style={styles.groupInfoText}>{formatCurrency(item.monthlyAmount)}/month</Text>
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
                  { width: `${getProgressPercentage(item.completedCycles, item.totalCycles)}%` }
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
              : `Start Date: ${formatDate(item.startDate)}`
            }
          </Text>
          <Text style={styles.groupAmount}>
            {item.status === 'Active' 
              ? `${formatCurrency(item.collectedAmount)} collected`
              : `${formatCurrency(item.groupAmount)} total`
            }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getTabCounts = () => {
    const active = groups.filter(g => g.status === 'Active').length;
    const notStarted = groups.filter(g => g.status === 'Not Started').length;
    return { active, notStarted };
  };

  const tabCounts = getTabCounts();

  if (showGroupDetails && selectedGroup) {
    return (
      <GroupInfoAdmin 
        group={selectedGroup} 
        onBack={() => setShowGroupDetails(false)} 
        onSave={(data) => {
          console.log('Group data updated:', data);
          // Handle saving the data here
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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Groups</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>
            Active Groups ({tabCounts.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Not Started' && styles.activeTab]}
          onPress={() => setActiveTab('Not Started')}
        >
          <Text style={[styles.tabText, activeTab === 'Not Started' && styles.activeTabText]}>
            Not Started ({tabCounts.notStarted})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <FlatList
        data={getFilteredGroups()}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id.toString()}
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
                : 'Groups will appear here once created'
              }
            </Text>
          </View>
        )}
      />
    </View>
  );
};

// Group Details Page Component
const GroupDetailsPage = ({ group, onBack }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Not Started': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return 'progress-clock';
      case 'Not Started': return 'clock-outline';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Details</Text>
        </View>
      </View>

      {/* Content will be added based on your requirements */}
      <View style={styles.detailsContainer}>
        <Text style={styles.comingSoonText}>
          Group details content will be added here.
          Please provide the content structure you want to include.
        </Text>
        
        {/* Basic Group Info Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{group.name}</Text>
          <Text style={styles.previewCode}>#{group.groupCode}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}>
            <MaterialCommunityIcons 
              name={getStatusIcon(group.status)} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={styles.statusText}>
              {group.status === 'not-started' ? 'NOT STARTED' : group.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ManageGroups;
