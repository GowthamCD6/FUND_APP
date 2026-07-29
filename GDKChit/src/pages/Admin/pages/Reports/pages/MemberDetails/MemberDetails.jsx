import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../../components/HeaderComponent/Header';
import MemberChitCard from '../MemberChitCard/MemberChitCard';
import PaymentEditor from '../PaymentEditiorModal/PaymentStatusEditior';
import ApiService from '../../../../../../services/ApiService';
import styles from './MemberDetailsStyles';

class MemberDetails extends Component {
  constructor(props) {
    super(props);

    const group = props?.route?.params?.group || {};
    const initialDate = new Date();

    this.state = {
      group,
      selectedMember: null,
      selectedMonth: initialDate.getMonth(),
      selectedYear: initialDate.getFullYear(),
      showMonthPicker: false,
      showMemberChitCard: false,
      selectedMemberForChitCard: null,
      isLoading: true,
      groupData: {
        ...group,
        members: [],
      },
    };

    this.months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
  }

  componentDidMount() {
    this.loadMemberPayments();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevGroupId = prevState.group?.id;
    const currentGroupId = this.state.group?.id;

    if (
      prevState.selectedMonth !== this.state.selectedMonth ||
      prevState.selectedYear !== this.state.selectedYear ||
      prevGroupId !== currentGroupId
    ) {
      this.loadMemberPayments();
    }
  }



  getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  parseDateValue = (value) => {
    if (!value) return null;

    const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value;
    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) return null;
    return parsedDate;
  };

  isSelectedPeriodPast = () => {
    const { selectedMonth, selectedYear } = this.state;
    const now = new Date();

    if (selectedYear < now.getFullYear()) return true;
    if (selectedYear > now.getFullYear()) return false;
    return selectedMonth < now.getMonth();
  };

  isCurrentSelectedMonth = () => {
    const { selectedMonth, selectedYear } = this.state;
    const now = new Date();

    return selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  };

  getComparableHistoryDate = (entry) => {
    const historyDate = this.parseDateValue(entry?.collection_period || entry?.dueDate || entry?.due_date);
    if (historyDate) return historyDate;

    const month = Number(entry?.month);
    const year = Number(entry?.year);
    if (Number.isInteger(month) && Number.isInteger(year)) {
      return new Date(year, month, 1);
    }

    return new Date(0);
  };

  isPaymentOverdue = (paymentHistory, targetMonth, targetYear) => {
    if (!Array.isArray(paymentHistory) || paymentHistory.length === 0) return false;

    const targetPayment = paymentHistory.find(
      (entry) => Number(entry?.month) === Number(targetMonth) && Number(entry?.year) === Number(targetYear),
    );

    if (!targetPayment || String(targetPayment.status).toLowerCase() === 'paid') {
      return false;
    }

    const sortedHistory = [...paymentHistory].sort(
      (a, b) => this.getComparableHistoryDate(b).getTime() - this.getComparableHistoryDate(a).getTime(),
    );

    let unpaidCount = 0;

    for (let i = 0; i < sortedHistory.length; i += 1) {
      const status = String(sortedHistory[i]?.status || '').toLowerCase();

      if (status === 'pending' || status === 'overdue') {
        unpaidCount += 1;
        if (unpaidCount >= 2) {
          return true;
        }
      } else if (status === 'paid') {
        unpaidCount = 0;
      }
    }

    return false;
  };

  getComputedPaymentStatus = (member) => {
    const rawStatus = String(member?.currentPayment?.status || 'pending').toLowerCase();

    if (rawStatus === 'paid' || rawStatus === 'closed') {
      return rawStatus;
    }

    if (rawStatus === 'overdue') {
      return 'overdue';
    }

    const paymentHistory = Array.isArray(member?.paymentHistory) ? member.paymentHistory : [];
    const targetMonth = Number(member?.currentPayment?.month ?? this.state.selectedMonth);
    const targetYear = Number(member?.currentPayment?.year ?? this.state.selectedYear);

    if (this.isCurrentSelectedMonth()) {
      const previousMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      const previousYear = targetMonth === 0 ? targetYear - 1 : targetYear;
      const previousMonthPayment = paymentHistory.find(
        (entry) => Number(entry?.month) === previousMonth && Number(entry?.year) === previousYear,
      );
      const previousMonthStatus = String(previousMonthPayment?.status || '').toLowerCase();

      if (previousMonthPayment && previousMonthStatus !== 'paid') {
        return 'overdue';
      }
    }

    if (this.isPaymentOverdue(paymentHistory, targetMonth, targetYear)) {
      return 'overdue';
    }

    const dueDate = this.parseDateValue(
      member?.currentPayment?.dueDate ||
        member?.currentPayment?.due_date ||
        member?.paymentHistory?.[0]?.dueDate ||
        member?.paymentHistory?.[0]?.due_date,
    );

    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const normalizedDueDate = new Date(dueDate);
      normalizedDueDate.setHours(0, 0, 0, 0);

      if (normalizedDueDate < today) {
        return 'overdue';
      }
    }

    if (this.isSelectedPeriodPast()) {
      return 'overdue';
    }

    return rawStatus || 'pending';
  };

  loadMemberPayments = async () => {
    const { group, selectedMonth, selectedYear } = this.state;

    if (!group?.id) {
      this.setState({ isLoading: false });
      return;
    }

    try {
      this.setState({ isLoading: true });
      const response = await ApiService.makeRequest(
        `/admin/reports/group-members?groupId=${group.id}&month=${selectedMonth}&year=${selectedYear}`,
        { method: 'GET' },
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to fetch member report details');
      }

      this.setState({
        groupData: {
          ...group,
          ...result.data.group,
          members: result.data.members || [],
        },
      });
    } catch (error) {
      console.error('Failed to fetch report member details:', error);
      Alert.alert('Error', error.message || 'Unable to load member details');
      this.setState((prev) => ({
        groupData: {
          ...prev.groupData,
          members: [],
        },
      }));
    } finally {
      this.setState({ isLoading: false });
    }
  };

  getMonthlyStats = () => {
    const members = this.state.groupData.members || [];
    const paid = members.filter((m) => this.getComputedPaymentStatus(m) === 'paid').length;
    const pending = members.filter((m) => this.getComputedPaymentStatus(m) === 'pending').length;
    const overdue = members.filter((m) => this.getComputedPaymentStatus(m) === 'overdue').length;

    const totalAmount = members.reduce((sum, m) => {
      const payment = Number(m?.currentPayment?.amount || 0);
      return this.getComputedPaymentStatus(m) === 'paid' ? sum + payment : sum;
    }, 0);

    return { paid, pending, overdue, totalAmount, total: members.length };
  };



  updatePaymentStatus = async (memberId, newStatus) => {
    const { groupData, selectedMonth, selectedYear } = this.state;

    try {
      const member = (groupData.members || []).find((m) => m.id === memberId);
      if (!member) return;

      const payload = {
        groupId: groupData.id,
        userId: memberId,
        month: selectedMonth,
        year: selectedYear,
        status: newStatus,
        amount: Number(member?.currentPayment?.amount || groupData.monthlyAmount || 0),
      };

      const response = await ApiService.makeRequest('/admin/reports/payment-status', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to update payment status');
      }

      const updated = result.data;

      this.setState((prev) => ({
        groupData: {
          ...prev.groupData,
          members: (prev.groupData.members || []).map((m) => {
            if (m.id !== memberId) return m;

            const currentPayment = {
              ...m.currentPayment,
              ...updated,
            };

            const historyWithoutCurrent = (m.paymentHistory || []).filter(
              (p) => !(p.month === selectedMonth && p.year === selectedYear),
            );

            return {
              ...m,
              currentPayment,
              paymentHistory: [currentPayment, ...historyWithoutCurrent],
            };
          }),
        },
      }));
    } catch (error) {
      console.error('Failed to update payment status:', error);
      Alert.alert('Error', error.message || 'Unable to update payment status');
      throw error;
    }
  };

  openChitCard = (item) => {
    this.setState({
      selectedMemberForChitCard: item,
      showMemberChitCard: true,
    });
  };

  handlePaymentMarkedPaid = () => {
    // Refresh member data immediately after successful payment verification
    console.log('Payment marked as paid, refreshing data...');
    this.loadMemberPayments();
  };

  openPaymentEditor = (item) => {
    this.setState({
      selectedMember: {
        ...item,
        currentPayment: {
          ...item.currentPayment,
          status: this.getComputedPaymentStatus(item),
        },
      },
    });
  };

  renderMemberCard = ({ item }) => {
    const { groupData } = this.state;
    const paymentStatus = this.getComputedPaymentStatus(item);

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onLongPress={() => this.openPaymentEditor(item)}
        activeOpacity={1}
        delayLongPress={400}
      >
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatarContainer}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {item.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)}
              </Text>
            </View>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.name}</Text>
            <View style={styles.memberPhoneAmountRow}>
              <Text style={styles.memberPhone}>{item.phone}</Text>
              <View style={styles.phoneAmountDivider} />
              <Text style={styles.memberAmount}>
                {this.formatCurrency(item.currentPayment?.amount || groupData.monthlyAmount || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.statusAndArrowContainer}>
            <View style={[styles.statusBadge, { backgroundColor: this.getStatusColor(paymentStatus) }]}>
              <MaterialCommunityIcons name={this.getStatusIcon(paymentStatus)} size={10} color="#FFFFFF" />
              <Text style={styles.statusText}>{paymentStatus}</Text>
            </View>
            <TouchableOpacity onPress={() => this.openChitCard(item)} style={styles.arrowButton}>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" style={styles.arrowIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  getAvailableMonths = () => {
    const { groupData } = this.state;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let startYear = currentYear;
    let startMonth = 0;

    const groupStart = groupData?.startDate || groupData?.start_date;
    if (groupStart) {
      const parsedDate = typeof groupStart === 'string' ? groupStart.replace(' ', 'T') : groupStart;
      const startDate = new Date(parsedDate);
      if (!Number.isNaN(startDate.getTime())) {
        startYear = startDate.getFullYear();
        startMonth = startDate.getMonth();
      }
    }

    const availableMonths = [];
    const endYear = Math.max(currentYear, startYear);

    for (let y = startYear; y <= endYear; y++) {
      const sMonth = y === startYear ? startMonth : 0;
      let eMonth = 11;
      
      if (y === endYear) {
        if (endYear === currentYear) {
          eMonth = Math.max(currentMonth, y === startYear ? startMonth : 0);
        } else {
          eMonth = startMonth;
        }
      } else if (y === currentYear) {
        eMonth = currentMonth;
      }
      
      for (let m = sMonth; m <= eMonth; m++) {
        availableMonths.push({
          index: m,
          year: y,
          name: this.months[m],
          id: `${y}-${m}`
        });
      }
    }

    // Sort descending (newest first)
    return availableMonths.reverse();
  };

  render() {
    const {
      group,
      selectedMember,
      selectedMonth,
      selectedYear,
      showMonthPicker,
      showMemberChitCard,
      selectedMemberForChitCard,
      isLoading,
      groupData,
    } = this.state;

    const stats = this.getMonthlyStats();
    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <Header title={groupData?.name || group?.name || 'Member Details'} onBack={() => this.props.navigation.goBack()} />
        </View>

        <View style={styles.monthSelector}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthLabel}>Payment Details for:</Text>
            {isCurrentMonth ? <Text style={styles.currentMonthBadge}>Current Month</Text> : null}
          </View>
          <TouchableOpacity style={styles.monthButton} onPress={() => this.setState({ showMonthPicker: true })}>
            <MaterialCommunityIcons name="calendar" size={20} color="#64748B" />
            <Text style={styles.monthText}>
              {this.months[selectedMonth]} {selectedYear}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.statValue}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.paid}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6B46C1" />
          </View>
        ) : (
          <FlatList
            data={groupData.members || []}
            renderItem={this.renderMemberCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={{ paddingTop: 24, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280' }}>
                  No members found for this group.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <PaymentEditor
          visible={selectedMember !== null}
          selectedMember={selectedMember}
          onClose={() => this.setState({ selectedMember: null })}
          onUpdatePaymentStatus={this.updatePaymentStatus}
          formatCurrency={this.formatCurrency}
          getStatusColor={this.getStatusColor}
          getStatusIcon={this.getStatusIcon}
          formatDate={this.formatDate}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={showMonthPicker}
          onRequestClose={() => this.setState({ showMonthPicker: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Month</Text>
                <TouchableOpacity onPress={() => this.setState({ showMonthPicker: false })}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.monthList}>
                {this.getAvailableMonths().map(({ index, year, name, id }) => (
                  <TouchableOpacity
                    key={id}
                    style={[styles.monthItem, selectedMonth === index && selectedYear === year && styles.selectedMonthItem]}
                    onPress={() => this.setState({ selectedMonth: index, selectedYear: year, showMonthPicker: false })}
                  >
                    <Text style={[styles.monthItemText, selectedMonth === index && selectedYear === year && styles.selectedMonthItemText]}>
                      {name} {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={false}
          visible={showMemberChitCard}
          onRequestClose={() => {
            this.setState({ showMemberChitCard: false });
            // Refresh member data when closing chit card
            setTimeout(() => this.loadMemberPayments(), 500);
          }}
        >
          <MemberChitCard
            selectedGroup={groupData}
            selectedMember={selectedMemberForChitCard}
            onBack={() => {
              this.setState({ showMemberChitCard: false });
              // Refresh member data when going back from chit card
              setTimeout(() => this.loadMemberPayments(), 500);
            }}
            onPaymentMarkedPaid={this.handlePaymentMarkedPaid}
          />
        </Modal>
      </View>
    );
  }
}

export default MemberDetails;
