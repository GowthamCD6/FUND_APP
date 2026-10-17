import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../../../../../../../utils/LanguageContext';

const { width, height } = Dimensions.get('window');

const MemberSelectingModal = ({
  visible,
  loading = false,
  selectedGroup,
  selectedMembers,
  selectedCycleMonth,
  completedAuctions = [],
  onSelectCycleMonth,
  onClose,
  onMemberToggle,
  onProceed,
}) => {
  const { t } = useLanguage();
  const [isOverridingCompletedMonth, setIsOverridingCompletedMonth] = useState(false);

  // Chronologically sorted completed auctions with strictly 1-to-1 cycle assignment
  const sortedCompletedAuctions = (completedAuctions && completedAuctions.length > 0)
    ? [...completedAuctions].sort((a, b) => {
        const dateA = new Date(a.auction_date || a.collection_period || 0).getTime();
        const dateB = new Date(b.auction_date || b.collection_period || 0).getTime();
        return dateA - dateB;
      })
    : [];

  const getWinnerForCycle = (cycleNum) => {
    if (!sortedCompletedAuctions || sortedCompletedAuctions.length === 0) return null;

    const num = Number(cycleNum);
    if (!num || num < 1 || num > sortedCompletedAuctions.length) {
      return null;
    }

    const byExplicitCycle = sortedCompletedAuctions.find(ca => Number(ca.cycle_month) === num);
    if (byExplicitCycle) return byExplicitCycle;

    return sortedCompletedAuctions[num - 1] || null;
  };

  const activeCycleMonth = selectedCycleMonth || (selectedGroup?.completedCycles ? selectedGroup.completedCycles + 1 : 1);
  const currentCycleWinner = getWinnerForCycle(activeCycleMonth);

  const allMembers = selectedGroup?.members || [];
  const eligibleMembers = allMembers.filter(m => !m.hasWonAuction);
  const ineligibleCount = allMembers.filter(m => m.hasWonAuction).length;
  const allEligibleSelected = eligibleMembers.length > 0 && eligibleMembers.every(em => selectedMembers.some(sm => sm.id === em.id));

  const handleSelectAllEligible = () => {
    if (allEligibleSelected) {
      eligibleMembers.forEach(em => {
        if (selectedMembers.some(sm => sm.id === em.id)) {
          onMemberToggle(em);
        }
      });
    } else {
      eligibleMembers.forEach(em => {
        if (!selectedMembers.some(sm => sm.id === em.id)) {
          onMemberToggle(em);
        }
      });
    }
  };

  const renderMemberItem = ({ item }) => {
    const isSelected = selectedMembers.some(m => m.id === item.id);
    const isIneligible = Boolean(item.hasWonAuction);

    return (
      <TouchableOpacity
        style={[
          styles.memberCard,
          isSelected && styles.selectedMember,
          isIneligible && styles.ineligibleMemberCard
        ]}
        onPress={() => onMemberToggle(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.memberAvatar, isIneligible && styles.ineligibleAvatar]}>
          <Text style={[styles.avatarText, isIneligible && styles.ineligibleAvatarText]}>
            {item.avatar}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <Text style={[styles.memberName, isIneligible && styles.ineligibleMemberName]} numberOfLines={1}>
              {item.name}
            </Text>
            {isIneligible && (
              <View style={styles.ineligibleBadge}>
                <Text style={styles.ineligibleBadgeText}>
                  {t('NOT ELIGIBLE')}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.memberPhone}>{item.phone}</Text>
          {isIneligible && (
            <Text style={styles.prizeTakenSubtext}>
              {t('Prize Taken')}: {item.amountTaken ? `₹${Number(item.amountTaken).toLocaleString('en-IN')}` : t('Claimed')}
            </Text>
          )}
        </View>
        {isIneligible ? (
          <View style={styles.ineligibleIconWrapper}>
            <MaterialCommunityIcons
              name="cancel"
              size={22}
              color="#EF4444"
            />
          </View>
        ) : isSelected ? (
          <View style={styles.checkIcon}>
            <MaterialCommunityIcons
              name="check-circle"
              size={22}
              color="#10B981"
            />
          </View>
        ) : (
          <View style={styles.uncheckedIcon}>
            <MaterialCommunityIcons
              name="checkbox-blank-circle-outline"
              size={20}
              color="#D1D5DB"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.memberModalContainer}>
          <View style={styles.memberModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberModalTitle} numberOfLines={1}>
                {t('Select Members')} - {selectedGroup?.name}
              </Text>
              <Text style={styles.memberModalSubtitle}>
                {t('Only eligible members who have not won can participate')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <MaterialCommunityIcons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Month Cycle Selector (1, 2, 3...) */}
          <View style={styles.modalCycleContainer}>
            <View style={styles.modalCycleHeader}>
              <View style={styles.modalCycleBadge}>
                <MaterialCommunityIcons name="calendar-clock" size={15} color="#6B46C1" />
                <Text style={styles.modalCycleBadgeText}>
                  {t('AUCTION CYCLE')}: {t('MONTH')} {selectedCycleMonth || (selectedGroup?.completedCycles ? selectedGroup.completedCycles + 1 : 1)} {t('OF')} {selectedGroup?.duration || selectedGroup?.totalMembers || 20}
                </Text>
              </View>
              <Text style={styles.modalCycleHint}>
                {t('Select Month')}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalMonthPillsScroll}
              style={{ marginBottom: 2 }}
            >
              {Array.from({ length: Number(selectedGroup?.duration || selectedGroup?.totalMembers || 20) }, (_, i) => i + 1).map((cycleNum) => {
                const activeMonth = selectedCycleMonth || (selectedGroup?.completedCycles ? selectedGroup.completedCycles + 1 : 1);
                const isSelected = activeMonth === cycleNum;
                const cycleWinner = getWinnerForCycle(cycleNum);
                const isDone = Boolean(cycleWinner);
                return (
                  <TouchableOpacity
                    key={cycleNum}
                    style={[
                      styles.modalMonthPill,
                      isDone && { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
                      isSelected && styles.modalMonthPillActive
                    ]}
                    onPress={() => {
                      setIsOverridingCompletedMonth(false);
                      onSelectCycleMonth && onSelectCycleMonth(cycleNum);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[
                        styles.modalMonthPillText,
                        isDone && { color: '#15803D' },
                        isSelected && styles.modalMonthPillTextActive
                      ]}>
                        Month {cycleNum}
                      </Text>
                      {isDone && (
                        <MaterialCommunityIcons
                          name="check"
                          size={13}
                          color={isSelected ? '#FFFFFF' : '#16A34A'}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ═══ VIEW 1: MONTH AUCTION COMPLETED ═══ */}
          {currentCycleWinner && !isOverridingCompletedMonth ? (
            <View style={{ flex: 1, padding: 16 }}>
              {/* Completed Banner */}
              <View style={{
                backgroundColor: '#F0FDF4',
                borderColor: '#BBF7D0',
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: '#DCFCE7',
                    borderColor: '#86EFAC',
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 3
                  }}>
                    <MaterialCommunityIcons name="check-circle" size={13} color="#16A34A" />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
                      {t('AUCTION COMPLETED • MONTH')} {activeCycleMonth}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>
                    {t('Winner Registered')}
                  </Text>
                </View>

                {/* Winner Card */}
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1FAE5',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12
                }}>
                  <View style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: '#10B981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
                      {(currentCycleWinner.winner_name || 'W').substring(0, 2).toUpperCase()}
                    </Text>
                    <View style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      backgroundColor: '#FEF08A',
                      borderColor: '#CA8A04',
                      borderWidth: 1,
                      borderRadius: 9,
                      width: 18,
                      height: 18,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MaterialCommunityIcons name="crown" size={11} color="#A16207" />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                      {currentCycleWinner.winner_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {currentCycleWinner.winner_member_phone || t('Registered Subscriber')}
                    </Text>
                  </View>
                </View>

                {/* Key Metrics */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>{t('PRIZE TAKEN')}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#059669', marginTop: 2 }}>
                      ₹{Number(currentCycleWinner.amount_taken || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>{t('AUCTION DATE')}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 3 }}>
                      {currentCycleWinner.auction_date ? new Date(currentCycleWinner.auction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : t('Completed')}
                    </Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8, padding: 10 }}>
                  <Text style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}>
                    ℹ️ {t('The prize for Month')} {activeCycleMonth} {t('was awarded to')} {currentCycleWinner.winner_name}. {t('Member is ineligible for subsequent auctions.')}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 'auto', gap: 10, paddingTop: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#FCA5A5',
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6
                  }}
                  onPress={() => setIsOverridingCompletedMonth(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="refresh" size={16} color="#DC2626" />
                  <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>
                    {t('Re-run / Overwrite Month')} {activeCycleMonth} {t('Auction')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelModalButtonText}>{t('Close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ═══ VIEW 2: ACTIVE MEMBER SELECTOR ═══ */
            <>
              {isOverridingCompletedMonth && currentCycleWinner && (
                <View style={{
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FECACA',
                  borderWidth: 1,
                  borderRadius: 8,
                  marginHorizontal: 16,
                  marginTop: 8,
                  marginBottom: 4,
                  padding: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 11, color: '#991B1B', flex: 1, fontWeight: '600' }}>
                    {t('Re-run Mode')}: {t('Overwriting Month')} {activeCycleMonth}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsOverridingCompletedMonth(false)}
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}
                  >
                    <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '700' }}>{t('Cancel')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.statsAndSelectAllRow}>
                <View style={styles.memberCountBadge}>
                  <Text style={styles.memberCountText}>
                    {t('Selected:')} {selectedMembers.length}/{eligibleMembers.length} {t('Eligible')}
                    {ineligibleCount > 0 ? ` • ${ineligibleCount} ${t('Ineligible')}` : ''}
                  </Text>
                </View>

                {eligibleMembers.length > 0 && !loading && (
                  <TouchableOpacity 
                    style={styles.selectAllBtn} 
                    onPress={handleSelectAllEligible}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectAllBtnText}>
                      {allEligibleSelected ? t('Deselect All') : t('Select Eligible')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#6B46C1" />
                  <Text style={styles.modalLoadingText}>{t('Loading group members...')}</Text>
                </View>
              ) : (
                <FlatList
                  data={allMembers}
                  renderItem={renderMemberItem}
                  keyExtractor={item => item.id}
                  style={styles.membersList}
                  contentContainerStyle={styles.memberListContent}
                  showsVerticalScrollIndicator={false}
                />
              )}

              <View style={styles.memberModalFooter}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={onClose}
                >
                  <Text style={styles.cancelModalButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.proceedModalButton,
                    (loading || selectedMembers.length < 2) && styles.disabledButton,
                  ]}
                  onPress={onProceed}
                  disabled={loading || selectedMembers.length < 2}
                >
                  <Text style={styles.proceedModalButtonText}>
                    {t('Start Auction')} ({selectedMembers.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Member Modal Container
  memberModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: height * 0.75,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    overflow: 'hidden',
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 12,
  },
  memberModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  memberModalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  statsAndSelectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  memberCountBadge: {
    flex: 1,
  },
  memberCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  selectAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B46C1',
  },

  // Modal Cycle Bar
  modalCycleContainer: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  modalCycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  modalCycleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B46C1',
    letterSpacing: 0.5,
  },
  modalCycleHint: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  modalMonthPillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  modalMonthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalMonthPillActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#5B21B6',
  },
  modalMonthPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalMonthPillTextActive: {
    color: '#FFFFFF',
  },

  // Members List
  membersList: {
    maxHeight: height * 0.42,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 36,
  },
  memberListContent: {
    paddingBottom: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 0,
    shadowOpacity: 0,
  },
  selectedMember: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
    elevation: 1,
  },
  ineligibleMemberCard: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    opacity: 0.9,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ineligibleAvatar: {
    backgroundColor: '#FEE2E2',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  ineligibleAvatarText: {
    color: '#EF4444',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  ineligibleMemberName: {
    color: '#991B1B',
  },
  memberPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 0,
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  ineligibleBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  ineligibleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.4,
  },
  prizeTakenSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 12,
  },
  uncheckedIcon: {
    marginLeft: 12,
  },
  ineligibleIconWrapper: {
    marginLeft: 12,
  },

  // Modal Footer
  memberModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  proceedModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  proceedModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily:
      Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '500',
  },
});

export default MemberSelectingModal;
