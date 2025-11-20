import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import GroupCard from '../../../../components/GroupCard/GroupCard';
import styles from './ReportsStyles';

const { width } = Dimensions.get('window');

const Reports = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);

  // Sample data - replace with actual API calls
  const sampleGroups = [
    {
      id: 1,
      name: 'Business Group A',
      status: 'active',
      totalMembers: 20,
      completedCycles: 5,
      totalCycles: 20,
      monthlyAmount: 5000,
      startDate: '2024-01-15',
      nextDueDate: '2024-11-15',
      collectedAmount: 500000,
      remainingAmount: 1500000,
      members: [
        { id: 1, name: 'Rajesh Kumar', phone: '9876543210', status: 'paid', amount: 5000, dueDate: '2024-11-15' },
        { id: 2, name: 'Priya Sharma', phone: '9876543211', status: 'pending', amount: 5000, dueDate: '2024-11-15' },
        { id: 3, name: 'Amit Singh', phone: '9876543212', status: 'paid', amount: 5000, dueDate: '2024-11-15' },
        { id: 4, name: 'Sunita Devi', phone: '9876543213', status: 'overdue', amount: 5000, dueDate: '2024-10-15' },
        { id: 5, name: 'Vikash Yadav', phone: '9876543214', status: 'paid', amount: 5000, dueDate: '2024-11-15' },
      ]
    },
    {
      id: 2,
      name: 'Family Savings Group',
      status: 'completed',
      totalMembers: 12,
      completedCycles: 12,
      totalCycles: 12,
      monthlyAmount: 3000,
      startDate: '2023-01-15',
      completedDate: '2024-01-15',
      collectedAmount: 432000,
      remainingAmount: 0,
      members: [
        { id: 1, name: 'Mohan Lal', phone: '9876543215', status: 'completed', amount: 3000, completedDate: '2024-01-15' },
        { id: 2, name: 'Geeta Devi', phone: '9876543216', status: 'completed', amount: 3000, completedDate: '2024-01-15' },
        { id: 3, name: 'Ravi Kumar', phone: '9876543217', status: 'completed', amount: 3000, completedDate: '2024-01-15' },
        { id: 4, name: 'Meera Singh', phone: '9876543218', status: 'completed', amount: 3000, completedDate: '2024-01-15' },
      ]
    },
    {
      id: 3,
      name: 'Women Empowerment Fund',
      status: 'active',
      totalMembers: 15,
      completedCycles: 3,
      totalCycles: 15,
      monthlyAmount: 2000,
      startDate: '2024-08-01',
      nextDueDate: '2024-11-01',
      collectedAmount: 90000,
      remainingAmount: 360000,
      members: [
        { id: 1, name: 'Anita Sharma', phone: '9876543219', status: 'paid', amount: 2000, dueDate: '2024-11-01' },
        { id: 2, name: 'Kavita Singh', phone: '9876543220', status: 'paid', amount: 2000, dueDate: '2024-11-01' },
        { id: 3, name: 'Pooja Gupta', phone: '9876543221', status: 'pending', amount: 2000, dueDate: '2024-11-01' },
      ]
    },
    {
      id: 4,
      name: 'Student Education Fund',
      status: 'completed',
      totalMembers: 8,
      completedCycles: 8,
      totalCycles: 8,
      monthlyAmount: 1500,
      startDate: '2023-06-01',
      completedDate: '2024-02-01',
      collectedAmount: 96000,
      remainingAmount: 0,
      members: [
        { id: 1, name: 'Deepak Verma', phone: '9876543222', status: 'completed', amount: 1500, completedDate: '2024-02-01' },
        { id: 2, name: 'Neha Agarwal', phone: '9876543223', status: 'completed', amount: 1500, completedDate: '2024-02-01' },
      ]
    },
  ];

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    // Simulate API call
    setTimeout(() => {
      setGroups(sampleGroups);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
    setRefreshing(false);
  };

  const getFilteredGroups = () => {
    if (activeTab === 'all') return groups;
    return groups.filter(group => group.status === activeTab);
  };

  const openGroupDetails = (group) => {
    navigation.navigate('MembersDetails', { group });
  };

  const openGroupModal = (group) => {
    setSelectedGroup(group);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B46C1';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'paid': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'progress-clock';
      case 'completed': return 'check-circle';
      case 'pending': return 'clock-outline';
      case 'overdue': return 'alert-circle';
      case 'paid': return 'check-circle';
      default: return 'help-circle';
    }
  };

  const renderGroupCard = ({ item }) => (
    <GroupCard 
      group={item}
      onPress={openGroupDetails}
      onArrowPress={openGroupModal}
    />
  );

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.memberStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <MaterialCommunityIcons 
            name={getStatusIcon(item.status)} 
            size={10} 
            color="#FFFFFF" 
          />
          <Text style={styles.memberStatusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.memberDetails}>
        <Text style={styles.memberAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.memberDate}>
          {item.status === 'completed' 
            ? `Completed: ${formatDate(item.completedDate)}`
            : `Due: ${formatDate(item.dueDate)}`
          }
        </Text>
      </View>
    </View>
  );

  const getTabCounts = () => {
    const all = groups.length;
    const active = groups.filter(g => g.status === 'active').length;
    const completed = groups.filter(g => g.status === 'completed').length;
    return { all, active, completed };
  };

  const tabCounts = getTabCounts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({tabCounts.all})
          </Text>
        </TouchableOpacity>
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

      {/* Groups List */}
      <FlatList
        data={getFilteredGroups()}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Group Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedGroup?.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedGroup && (
              <>
                <View style={styles.modalGroupInfo}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedGroup.status) }]}>
                      <MaterialCommunityIcons 
                        name={getStatusIcon(selectedGroup.status)} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.statusText}>{selectedGroup.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Total Members:</Text>
                    <Text style={styles.modalInfoValue}>{selectedGroup.totalMembers}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Monthly Amount:</Text>
                    <Text style={styles.modalInfoValue}>{formatCurrency(selectedGroup.monthlyAmount)}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Collected:</Text>
                    <Text style={styles.modalInfoValue}>{formatCurrency(selectedGroup.collectedAmount)}</Text>
                  </View>
                </View>

                <Text style={styles.membersTitle}>Members ({selectedGroup.members.length})</Text>
                
                <FlatList
                  data={selectedGroup.members}
                  renderItem={renderMemberItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.membersList}
                  showsVerticalScrollIndicator={false}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Reports;
