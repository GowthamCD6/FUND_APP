import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import pageStyles from '../ManageGsty';

const GroupInfoAdmin = ({ group, onBack, onSave }) => {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = current, -1 = previous
  const [expandedSections, setExpandedSections] = useState({
    payment: true,
    winner: true,
    members: true,
    history: false
  });

  // Sample members data
  const [allMembers] = useState([
    { id: '9876543210', name: 'முருகன் குமார்', phone: '9876543210' },
    { id: '9876543211', name: 'லட்சுமி செல்வி', phone: '9876543211' },
    { id: '9876543212', name: 'ராஜேஷ் பாபு', phone: '9876543212' },
    { id: '9876543213', name: 'பிரியா தேவி', phone: '9876543213' },
    { id: '9876543214', name: 'கண்ணன் ராஜ்', phone: '9876543214' },
  ]);

  // Month-wise data storage
  const [monthlyData] = useState([
    {
      month: -1,
      date: '2024-09-15',
      amount: 10000,
      discount: 500,
      commission: 200,
      winner: { name: 'முருகன் குமார்', memberId: '9876543210', amountTaken: 9300, date: '2024-09-15' },
      mappedMembers: [
        { memberId: '9876543210', name: 'முருகன் குமார்', status: 'paid', amount: 10000, paidDate: '2024-09-15' },
        { memberId: '9876543211', name: 'லட்சுமி செல்வி', status: 'paid', amount: 10000, paidDate: '2024-09-14' },
        { memberId: '9876543212', name: 'ராஜேஷ் பாபு', status: 'pending', amount: 10000 },
      ]
    }
  ]);

  const [formData, setFormData] = useState({
    currentMonthAmount: group.currentMonthAmount?.toString() || group.monthlyAmount?.toString() || '',
    elathThalupadi: group.elathThalupadi?.toString() || '',
    commission: group.commission?.toString() || '',
    chitWinnerName: group.currentChitWinner?.name || '',
    chitWinnerMemberId: group.currentChitWinner?.memberId || '',
    amountTaken: group.currentChitWinner?.amountTaken?.toString() || '',
    datePicked: group.currentChitWinner?.datePicked || '',
  });

  const [memberMappings, setMemberMappings] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [currentMappingId, setCurrentMappingId] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addMemberMapping = () => {
    setMemberMappings([...memberMappings, {
      id: Date.now(),
      memberId: '',
      name: '',
      status: 'pending',
      amount: formData.currentMonthAmount || '10000',
      paidDate: null
    }]);
  };

  const removeMemberMapping = (id) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setMemberMappings(memberMappings.filter(m => m.id !== id))
        }
      ]
    );
  };

  const updateMemberMapping = (id, field, value) => {
    setMemberMappings(memberMappings.map(m => {
      if (m.id === id) {
        if (field === 'memberId') {
          const member = allMembers.find(mem => mem.id === value);
          return { ...m, memberId: value, name: member?.name || '' };
        }
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const openMemberPicker = (mappingId) => {
    setCurrentMappingId(mappingId);
    setShowMemberPicker(true);
  };

  const selectMember = (memberId) => {
    updateMemberMapping(currentMappingId, 'memberId', memberId);
    setShowMemberPicker(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentMonthAmount || parseFloat(formData.currentMonthAmount) <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid amount';
    }

    const hasChitWinnerData = formData.chitWinnerName || formData.chitWinnerMemberId || 
                               formData.amountTaken || formData.datePicked;

    if (hasChitWinnerData) {
      if (!formData.chitWinnerName) newErrors.chitWinnerName = 'Winner name is required';
      if (!formData.chitWinnerMemberId) newErrors.chitWinnerMemberId = 'Member ID is required';
      if (!formData.amountTaken || parseFloat(formData.amountTaken) <= 0) {
        newErrors.amountTaken = 'Please enter valid amount taken';
      }
      if (!formData.datePicked) newErrors.datePicked = 'Date picked is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    const dataToSave = {
      month: currentMonth,
      date: new Date().toISOString().split('T')[0],
      currentMonthAmount: parseFloat(formData.currentMonthAmount),
      elathThalupadi: formData.elathThalupadi ? parseFloat(formData.elathThalupadi) : 0,
      commission: formData.commission ? parseFloat(formData.commission) : 0,
      currentChitWinner: formData.chitWinnerName ? {
        name: formData.chitWinnerName,
        memberId: formData.chitWinnerMemberId,
        amountTaken: parseFloat(formData.amountTaken),
        datePicked: formData.datePicked,
      } : null,
      mappedMembers: memberMappings
    };

    onSave(dataToSave);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDateSelect = () => {
    const formattedDate = formatDateForInput(selectedDate);
    handleInputChange('datePicked', formattedDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    if (formData.datePicked) {
      setSelectedDate(new Date(formData.datePicked));
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
  };

  const getMonthLabel = (offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonthData = () => {
    return monthlyData.find(m => m.month === currentMonth) || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'not-started': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const currentMonthData = getCurrentMonthData();
  const totalCollected = memberMappings.filter(m => m.status === 'paid').reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
  const totalPending = memberMappings.filter(m => m.status === 'pending').reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={pageStyles.header}>
        <View style={pageStyles.headerContent}>
          <TouchableOpacity onPress={onBack} style={pageStyles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={pageStyles.headerTitle}>Group Management</Text>
            <Text style={styles.headerSubtitle}>Update monthly details & member payments</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Group Info Card */}
        <View style={styles.listContainer}>
          <View style={pageStyles.groupCard}>
            {/* Header with Group Name */}
            <View style={pageStyles.groupCardHeader}>
              <View style={pageStyles.groupNameContainer}>
                <Text style={pageStyles.groupName}>{group.name}</Text>
                <Text style={styles.groupCode}>#{group.groupCode}</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={pageStyles.statusContainer}>
              <View style={[pageStyles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}>
                <MaterialCommunityIcons name="progress-clock" size={12} color="#FFFFFF" />
                <Text style={pageStyles.statusText}>
                  {group.status === 'not-started' ? 'NOT STARTED' : group.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={pageStyles.groupCardContent}>
              {/* Group Info Row */}
              <View style={pageStyles.groupInfoRow}>
                <View style={pageStyles.groupInfoItem}>
                  <MaterialCommunityIcons name="account-group" size={16} color="#6B46C1" />
                  <Text style={pageStyles.groupInfoText}>{memberMappings.length} Members</Text>
                </View>
                <View style={pageStyles.groupInfoItem}>
                  <MaterialCommunityIcons name="currency-inr" size={16} color="#059669" />
                  <Text style={pageStyles.groupInfoText}>{formatCurrency(group.monthlyAmount)}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={pageStyles.groupCardFooter}>
                <Text style={pageStyles.groupDate}>
                  Created: {new Date(group.createdDate).toLocaleDateString('en-IN')}
                </Text>
                <Text style={pageStyles.groupAmount}>
                  Total Fund: {formatCurrency(group.monthlyAmount * memberMappings.length)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
          <TouchableOpacity 
            onPress={() => setCurrentMonth(currentMonth - 1)}
            style={styles.monthNavButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color="#6B46C1" />
            <Text style={styles.monthNavButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <View style={styles.monthDisplay}>
            <Text style={styles.monthLabel}>Viewing Month</Text>
            <Text style={styles.monthValue}>{getMonthLabel(currentMonth)}</Text>
            {currentMonth === 0 && <Text style={styles.currentMonthBadge}>(Current)</Text>}
          </View>
          
          <TouchableOpacity 
            onPress={() => setCurrentMonth(currentMonth + 1)}
            disabled={currentMonth >= 0}
            style={[styles.monthNavButton, currentMonth >= 0 && styles.monthNavButtonDisabled]}
          >
            <Text style={styles.monthNavButtonText}>Next</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={() => toggleSection('payment')}
            style={styles.sectionHeader}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="cash-multiple" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Payment Details</Text>
                <Text style={styles.sectionSubtitle}>Monthly amount, discount & commission</Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name={expandedSections.payment ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {expandedSections.payment && (
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount to be Paid This Month *</Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.inputWithPrefix, errors.currentMonthAmount && styles.inputError]}
                    value={formData.currentMonthAmount}
                    onChangeText={(value) => handleInputChange('currentMonthAmount', value)}
                    placeholder="10000"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.currentMonthAmount && (
                  <Text style={styles.errorText}>{errors.currentMonthAmount}</Text>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="trending-down" size={14} color="#6B7280" />
                    {' '}எலத் தள்ளுபடி
                  </Text>
                  <View style={styles.inputWithIcon}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={[styles.inputWithPrefix, errors.elathThalupadi && styles.inputError]}
                      value={formData.elathThalupadi}
                      onChangeText={(value) => handleInputChange('elathThalupadi', value)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="percent" size={14} color="#6B7280" />
                    {' '}கசர்
                  </Text>
                  <View style={styles.inputWithIcon}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={[styles.inputWithPrefix, errors.commission && styles.inputError]}
                      value={formData.commission}
                      onChangeText={(value) => handleInputChange('commission', value)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Chit Winner Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={() => toggleSection('winner')}
            style={styles.sectionHeader}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Chit Auction Winner</Text>
                <Text style={styles.sectionSubtitle}>Register monthly auction winner</Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name={expandedSections.winner ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {expandedSections.winner && (
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Winner Name</Text>
                <TextInput
                  style={[styles.input, errors.chitWinnerName && styles.inputError]}
                  value={formData.chitWinnerName}
                  onChangeText={(value) => handleInputChange('chitWinnerName', value)}
                  placeholder="Enter winner's name"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.chitWinnerName && (
                  <Text style={styles.errorText}>{errors.chitWinnerName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Member Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.chitWinnerMemberId && styles.inputError]}
                  value={formData.chitWinnerMemberId}
                  onChangeText={(value) => handleInputChange('chitWinnerMemberId', value)}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#9CA3AF"
                />
                {errors.chitWinnerMemberId && (
                  <Text style={styles.errorText}>{errors.chitWinnerMemberId}</Text>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Amount Taken</Text>
                  <View style={styles.inputWithIcon}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={[styles.inputWithPrefix, errors.amountTaken && styles.inputError]}
                      value={formData.amountTaken}
                      onChangeText={(value) => handleInputChange('amountTaken', value)}
                      placeholder="9300"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Auction Date</Text>
                  <TouchableOpacity
                    style={[styles.datePickerButton, errors.datePicked && styles.inputError]}
                    onPress={openDatePicker}
                  >
                    <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
                    <Text style={[styles.datePickerText, !formData.datePicked && styles.placeholderText]}>
                      {formData.datePicked ? formatDateForDisplay(formData.datePicked) : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Member Registration */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={() => toggleSection('members')}
            style={styles.sectionHeader}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="account-group" size={20} color="#6B46C1" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Member Registration</Text>
                <Text style={styles.sectionSubtitle}>Add and manage group members</Text>
              </View>
            </View>
            <MaterialCommunityIcons 
              name={expandedSections.members ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {expandedSections.members && (
            <View style={styles.sectionContent}>
              {memberMappings.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberCardHeader}>
                    <TouchableOpacity
                      style={styles.memberSelectButton}
                      onPress={() => openMemberPicker(member.id)}
                    >
                      <MaterialCommunityIcons name="account" size={16} color="#6B7280" />
                      <Text style={[styles.memberSelectText, !member.name && styles.placeholderText]}>
                        {member.name || 'Select member'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => removeMemberMapping(member.id)}
                      style={styles.removeButton}
                    >
                      <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>


                </View>
              ))}

              <TouchableOpacity
                onPress={addMemberMapping}
                style={styles.addMemberButton}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#6B46C1" />
                <Text style={styles.addMemberButtonText}>Add Member</Text>
              </TouchableOpacity>

              {memberMappings.length > 0 && (
                <View style={styles.memberSummary}>
                  <View style={styles.memberSummaryRow}>
                    <Text style={styles.memberSummaryLabel}>Total Registered Members</Text>
                    <Text style={styles.memberSummaryValue}>{memberMappings.length}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Previous Month Data */}
        {currentMonthData && (
          <View style={styles.section}>
            <TouchableOpacity 
              onPress={() => toggleSection('history')}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
                  <MaterialCommunityIcons name="history" size={20} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Saved Month Data</Text>
                  <Text style={styles.sectionSubtitle}>Previously saved information</Text>
                </View>
              </View>
              <MaterialCommunityIcons 
                name={expandedSections.history ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>

            {expandedSections.history && (
              <View style={styles.sectionContent}>
                <View style={styles.historyGrid}>
                  <View style={styles.historyCard}>
                    <Text style={styles.historyCardLabel}>Amount</Text>
                    <Text style={styles.historyCardValue}>{formatCurrency(currentMonthData.amount)}</Text>
                  </View>
                  <View style={styles.historyCard}>
                    <Text style={styles.historyCardLabel}>Discount</Text>
                    <Text style={styles.historyCardValue}>{formatCurrency(currentMonthData.discount)}</Text>
                  </View>
                  <View style={styles.historyCard}>
                    <Text style={styles.historyCardLabel}>Commission</Text>
                    <Text style={styles.historyCardValue}>{formatCurrency(currentMonthData.commission)}</Text>
                  </View>
                </View>

                {currentMonthData.winner && (
                  <View style={styles.winnerDetailsCard}>
                    <Text style={styles.winnerDetailsTitle}>Winner Details</Text>
                    <Text style={styles.winnerDetailsText}>
                      <Text style={styles.winnerDetailsLabel}>Name: </Text>
                      {currentMonthData.winner.name}
                    </Text>
                    <Text style={styles.winnerDetailsText}>
                      <Text style={styles.winnerDetailsLabel}>Amount: </Text>
                      {formatCurrency(currentMonthData.winner.amountTaken)}
                    </Text>
                    <Text style={styles.winnerDetailsText}>
                      <Text style={styles.winnerDetailsLabel}>Date: </Text>
                      {formatDateForDisplay(currentMonthData.winner.date)}
                    </Text>
                  </View>
                )}

                <View style={styles.historyMembersContainer}>
                  <Text style={styles.historyMembersTitle}>
                    Member Payments ({currentMonthData.mappedMembers.length})
                  </Text>
                  {currentMonthData.mappedMembers.map((member, idx) => (
                    <View key={idx} style={styles.historyMemberCard}>
                      <View>
                        <Text style={styles.historyMemberName}>{member.name}</Text>
                        <Text style={styles.historyMemberPhone}>{member.memberId}</Text>
                      </View>
                      <View style={styles.historyMemberRight}>
                        <Text style={styles.historyMemberAmount}>{formatCurrency(member.amount)}</Text>
                        <View style={[
                          styles.historyMemberStatus,
                          { backgroundColor: member.status === 'paid' ? '#D1FAE5' : '#FEF3C7' }
                        ]}>
                          <Text style={[
                            styles.historyMemberStatusText,
                            { color: member.status === 'paid' ? '#10B981' : '#F59E0B' }
                          ]}>
                            {member.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Amount:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(formData.currentMonthAmount || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount:</Text>
            <Text style={styles.summaryValue}>
              - {formatCurrency(formData.elathThalupadi || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Commission:</Text>
            <Text style={styles.summaryValue}>
              - {formatCurrency(formData.commission || 0)}
            </Text>
          </View>
          {formData.amountTaken && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount to Winner:</Text>
              <Text style={[styles.summaryValue, styles.winnerAmountText]}>
                {formatCurrency(formData.amountTaken || 0)}
              </Text>
            </View>
          )}
          {memberMappings.length > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Collected:</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {formatCurrency(totalCollected)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Pending:</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  {formatCurrency(totalPending)}
                </Text>
              </View>
            </>
          )}
        </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Member Picker Modal */}
      <Modal
        visible={showMemberPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMemberPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Member</Text>
              <TouchableOpacity onPress={() => setShowMemberPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {allMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberOption}
                  onPress={() => selectMember(member.id)}
                >
                  <View style={styles.memberOptionIcon}>
                    <MaterialCommunityIcons name="account" size={24} color="#6B46C1" />
                  </View>
                  <View style={styles.memberOptionInfo}>
                    <Text style={styles.memberOptionName}>{member.name}</Text>
                    <Text style={styles.memberOptionPhone}>{member.phone}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Auction Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContent}>
                <View style={styles.datePickerControls}>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#6B46C1" />
                  </TouchableOpacity>
                  
                  <View style={styles.dateDisplay}>
                    <Text style={styles.selectedDateText}>
                      {selectedDate.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#6B46C1" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.quickDateButtons}>
                  <TouchableOpacity 
                    style={styles.quickDateBtn}
                    onPress={() => setSelectedDate(new Date())}
                  >
                    <Text style={styles.quickDateText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickDateBtn}
                    onPress={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setSelectedDate(yesterday);
                    }}
                  >
                    <Text style={styles.quickDateText}>Yesterday</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.datePickerActions}>
                <TouchableOpacity 
                  style={styles.cancelDateButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelDateText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.selectDateButton}
                  onPress={handleDateSelect}
                >
                  <Text style={styles.selectDateText}>Select Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onBack}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  
  // Group Header
  groupHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupHeaderLeft: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  groupCode: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  groupHeaderRight: {
    alignItems: 'flex-end',
  },
  monthlyAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  monthlyAmountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
  },

  // Month Navigation
  monthNavigation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  monthNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  monthValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  currentMonthBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 2,
  },

  // Section Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputPrefix: {
    position: 'absolute',
    left: 16,
    top: 12,
    fontSize: 16,
    color: '#6B7280',
    zIndex: 1,
  },
  inputWithPrefix: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  placeholderText: {
    color: '#9CA3AF',
  },

  // Date Picker Button
  datePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerText: {
    fontSize: 14,
    color: '#212121',
  },

  // Member Card Styles
  memberCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginRight: 8,
  },
  memberSelectText: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
  },
  removeButton: {
    padding: 8,
  },
  memberCardRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  memberCardInput: {
    paddingHorizontal: 8,
  },
  memberCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  memberCardInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212121',
  },
  statusPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  paidDateContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  memberSummary: {
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
  },
  memberSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  memberSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },

  // History Styles
  historyGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  historyCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  historyCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  winnerDetailsCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  winnerDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
    marginBottom: 8,
  },
  winnerDetailsText: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
  },
  winnerDetailsLabel: {
    fontWeight: '600',
  },
  historyMembersContainer: {
    marginTop: 8,
  },
  historyMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  historyMemberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  historyMemberPhone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  historyMemberRight: {
    alignItems: 'flex-end',
  },
  historyMemberAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  historyMemberStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyMemberStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Summary Section
  summarySection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  winnerAmountText: {
    color: '#10B981',
    fontSize: 17,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#C7D2FE',
    marginVertical: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  modalContent: {
    maxHeight: 400,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberOptionInfo: {
    flex: 1,
  },
  memberOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  memberOptionPhone: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Date Picker Modal
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  datePickerContent: {
    padding: 20,
  },
  datePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  datePickerActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelDateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectDateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GroupInfoAdmin;