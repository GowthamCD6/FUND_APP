import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../utils/LanguageContext';

const GroupCard = ({ group, onPress, onArrowPress }) => {
  const { t, language } = useLanguage();

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

  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => onPress && onPress(group)}
      activeOpacity={1}
    >
      <View style={styles.groupCardHeader}>
        <View style={styles.groupNameContainer}>
          <Text style={[styles.groupName, language === 'ta' && { fontSize: 16 }]}>{group.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}>
              <MaterialCommunityIcons
                name={getStatusIcon(group.status)}
                size={12}
                color="#FFFFFF"
              />
              <Text style={[styles.statusText, language === 'ta' && { fontSize: 9 }]}>{t(group.status).toUpperCase()}</Text>
            </View>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#EFF6FF', 
              paddingHorizontal: 8, 
              paddingVertical: 2, 
              borderRadius: 12, 
              borderWidth: 1, 
              borderColor: '#BFDBFE' 
            }}>
              <MaterialCommunityIcons name="calendar-clock" size={11} color="#1D4ED8" style={{ marginRight: 3 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>
                {group.currentMonthDisplay || (group.duration ? `1st Month of ${group.duration}` : '1st Month')}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => (onArrowPress ? onArrowPress(group) : onPress && onPress(group))}
          style={styles.arrowButton}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.groupCardContent}>
        <View style={styles.groupInfoRow}>
          <View style={styles.groupInfoItem}>
            <MaterialCommunityIcons name="account-group" size={16} color="#6B7280" />
            <Text style={[styles.groupInfoText, language === 'ta' && { fontSize: 13 }]}>{(group.currentMembers !== undefined && group.currentMembers !== null) ? group.currentMembers : (group.totalMembers || 0)} / {group.totalMembers} {t('Members')}</Text>
          </View>
          <View style={styles.groupInfoItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
            <Text style={[styles.groupInfoText, language === 'ta' && { fontSize: 13 }]}>{formatCurrency(group.monthlyAmount)}{t('/month')}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, language === 'ta' && { fontSize: 13 }]}>
              {group.completedCycles}/{group.totalCycles} {t('Cycles')}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round((group.completedCycles / group.totalCycles) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(group.completedCycles / group.totalCycles) * 100}%` }
              ]}
            />
          </View>
        </View>

        <View style={styles.groupCardFooter}>
          <Text style={[styles.groupDate, language === 'ta' && { fontSize: 11 }]}>
            {group.status === 'completed'
              ? `${t('Completed:')} ${formatDate(group.completedDate)}`
              : `${t('Next Due:')} ${formatDate(group.nextDueDate)}`
            }
          </Text>
          <Text style={[styles.groupAmount, language === 'ta' && { fontSize: 13 }]}>
            {formatCurrency(group.collectedAmount)} {t('collected')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  groupNameContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  groupCardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  groupInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B46C1',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 3,
  },
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
  groupAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  },
});

export default GroupCard;