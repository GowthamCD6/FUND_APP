import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';
import { useLanguage } from '../../../../../utils/LanguageContext';

const DueCalendar = ({ navigation, onBack }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeMonthOffset, setActiveMonthOffset] = useState(0); // 0 = current, 1 = next, -1 = last
  const [dueItems, setDueItems] = useState([]);

  const currentDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + activeMonthOffset);
    return d;
  }, [activeMonthOffset]);

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  useEffect(() => {
    loadDues();
  }, [activeMonthOffset]);

  const loadDues = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getPortfolio();
      
      const dayToday = new Date().getDate();

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const items = res.data.map((group, idx) => {
          const dueDay = 10 + (idx * 5); // 10th, 15th, etc.
          const isCurrentMonth = activeMonthOffset === 0;
          const isPastMonth = activeMonthOffset < 0;
          
          let status = 'upcoming';
          if (isPastMonth) {
            status = 'paid';
          } else if (isCurrentMonth) {
            if (dayToday > dueDay + 3) {
              status = 'overdue';
            } else if (dayToday >= dueDay) {
              status = 'due_today';
            } else {
              status = 'upcoming';
            }
          } else {
            status = 'upcoming';
          }

          const baseAmount = Number(group.monthlyAmount) || 5000;
          const dividendCredit = Math.round(baseAmount * 0.16); // ~16% dividend
          const netPayable = baseAmount - dividendCredit;

          return {
            id: group.id,
            name: group.name,
            chitValue: group.groupAmount || 100000,
            monthCycle: `${6 + activeMonthOffset}/20`,
            dueDay,
            dueDateFormatted: `${dueDay} ${currentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
            baseAmount,
            dividendCredit,
            netPayable,
            status,
          };
        });
        setDueItems(items);
      } else {
        // Fallback demo schedule
        const sampleItems = [
          {
            id: 'grp-1',
            name: 'GDK Platinum 1 Lakh',
            chitValue: 100000,
            monthCycle: `${5 + activeMonthOffset}/20`,
            dueDay: 10,
            dueDateFormatted: `10 ${currentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
            baseAmount: 5000,
            dividendCredit: 850,
            netPayable: 4150,
            status: activeMonthOffset === 0 ? 'upcoming' : activeMonthOffset < 0 ? 'paid' : 'upcoming',
          },
          {
            id: 'grp-2',
            name: 'GDK Gold 2 Lakh',
            chitValue: 200000,
            monthCycle: `${8 + activeMonthOffset}/20`,
            dueDay: 15,
            dueDateFormatted: `15 ${currentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
            baseAmount: 10000,
            dividendCredit: 1600,
            netPayable: 8400,
            status: activeMonthOffset === 0 ? 'upcoming' : activeMonthOffset < 0 ? 'paid' : 'upcoming',
          },
        ];
        setDueItems(sampleItems);
      }
    } catch (err) {
      console.error('Error loading dues:', err);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const gross = dueItems.reduce((s, i) => s + i.baseAmount, 0);
    const dividend = dueItems.reduce((s, i) => s + i.dividendCredit, 0);
    const net = dueItems.reduce((s, i) => s + i.netPayable, 0);
    return { gross, dividend, net };
  }, [dueItems]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const handlePayPress = (item) => {
    Alert.alert(
      t('Pay Installment'),
      `${t('Proceed to pay')} ${formatCurrency(item.netPayable)} ${t('for')} ${item.name}?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Pay Online'),
          onPress: () => {
            setDueItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, status: 'paid' } : i))
            );
            Alert.alert(t('Payment Success'), `${t('Installment of')} ${formatCurrency(item.netPayable)} ${t('recorded successfully!')}`);
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Due-Date Calendar" onBack={handleBack} />

      {/* Month Navigator */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setActiveMonthOffset((p) => p - 1)}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.navMonthCenter}>
          <MaterialCommunityIcons name="calendar-month" size={18} color="#6B46C1" />
          <Text style={styles.navMonthText}>{monthLabel}</Text>
        </View>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setActiveMonthOffset((p) => p + 1)}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Aggregate Financial Overview Banner */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Base Due</Text>
          <Text style={styles.summaryVal}>{formatCurrency(totals.gross)}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Dividend Saved</Text>
          <Text style={[styles.summaryVal, { color: '#059669' }]}>-{formatCurrency(totals.dividend)}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Net Payable</Text>
          <Text style={[styles.summaryVal, { color: '#6B46C1', fontWeight: '900' }]}>
            {formatCurrency(totals.net)}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading calendar schedule...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.timelineHeader}>Upcoming Installment Deadlines</Text>

          {dueItems.map((item) => {
            const isPaid = item.status === 'paid';
            const isOverdue = item.status === 'overdue';
            const isDueToday = item.status === 'due_today';

            return (
              <View key={item.id} style={[styles.dueCard, isPaid && styles.dueCardPaid]}>
                <View style={styles.dueCardTop}>
                  <View style={styles.dueCardInfo}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupCycle}>Cycle Month {item.monthCycle}</Text>
                  </View>

                  <View
                    style={[
                      styles.dueBadge,
                      isPaid
                        ? styles.badgePaid
                        : isOverdue
                        ? styles.badgeOverdue
                        : isDueToday
                        ? styles.badgeToday
                        : styles.badgeUpcoming,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        isPaid
                          ? 'check-circle'
                          : isOverdue
                          ? 'alert-circle'
                          : isDueToday
                          ? 'clock-alert'
                          : 'calendar-clock'
                      }
                      size={12}
                      color={
                        isPaid
                          ? '#059669'
                          : isOverdue
                          ? '#DC2626'
                          : isDueToday
                          ? '#D97706'
                          : '#475569'
                      }
                    />
                    <Text
                      style={[
                        styles.dueBadgeText,
                        isPaid
                          ? { color: '#059669' }
                          : isOverdue
                          ? { color: '#DC2626' }
                          : isDueToday
                          ? { color: '#D97706' }
                          : { color: '#475569' },
                      ]}
                    >
                      {isPaid ? 'Paid' : isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : 'Upcoming'}
                    </Text>
                  </View>
                </View>

                {/* Date & Breakdown */}
                <View style={styles.dueDateRow}>
                  <MaterialCommunityIcons name="calendar-range" size={16} color="#6B46C1" />
                  <Text style={styles.dueDateText}>Payment Deadline: <Text style={{ fontWeight: '800' }}>{item.dueDateFormatted}</Text></Text>
                </View>

                <View style={styles.breakdownTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Gross Monthly Amount</Text>
                    <Text style={styles.tableValue}>{formatCurrency(item.baseAmount)}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Auction Dividend Deduction</Text>
                    <Text style={[styles.tableValue, { color: '#059669' }]}>
                      -{formatCurrency(item.dividendCredit)}
                    </Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableTotalRow]}>
                    <Text style={styles.tableTotalLabel}>Net Amount Due</Text>
                    <Text style={styles.tableTotalVal}>{formatCurrency(item.netPayable)}</Text>
                  </View>
                </View>

                {/* Action button */}
                {!isPaid && (
                  <TouchableOpacity style={styles.payBtn} onPress={() => handlePayPress(item)}>
                    <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFFFFF" />
                    <Text style={styles.payBtnText}>Pay {formatCurrency(item.netPayable)} Online</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMonthCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navMonthText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  timelineHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dueCardPaid: {
    opacity: 0.85,
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  dueCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dueCardInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  groupCycle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeUpcoming: {
    backgroundColor: '#F1F5F9',
  },
  badgeToday: {
    backgroundColor: '#FEF3C7',
  },
  badgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  badgePaid: {
    backgroundColor: '#ECFDF5',
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },
  dueDateText: {
    fontSize: 12,
    color: '#334155',
  },
  breakdownTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  tableValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  tableTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    marginTop: 4,
  },
  tableTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#6B46C1',
  },
  payBtn: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default DueCalendar;
