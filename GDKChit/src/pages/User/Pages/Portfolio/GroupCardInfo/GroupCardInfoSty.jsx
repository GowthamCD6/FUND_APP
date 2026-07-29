import { StyleSheet, Platform } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 10,
  },

  // Group Info Header
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  groupNameTitle: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#111827',
    fontWeight: '700',
  },
  groupIdText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#6B7280',
    marginTop: 4,
    display: 'none',
  },
  statusBadge: {
    display: 'none',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    fontWeight: '600',
  },

  // Month Calendar
  monthCalendarContainer: {
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  monthCalendarLabel: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
    marginBottom: 14,
  },
  monthSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 0,
    gap: 12,
  },
  monthNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 3,
    minWidth: 70,
    justifyContent: 'center',
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  monthNavButtonText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    fontWeight: '600',
    color: '#3B82F6',
  },
  monthDisplay: {
    alignItems: 'center',
    minWidth: 160,
    maxWidth: 180,
    height: 70,
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#64748B',
    marginBottom: 4,
  },
  monthValue: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#1E293B',
    fontWeight: '700',
  },
  currentMonthBadge: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 2,
  },
  monthYearDisplay: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendarDay: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  calendarDayActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  calendarDayText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#4B5563',
    fontWeight: '500',
  },
  calendarDayTextActive: {
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    fontWeight: '600',
    fontSize: 13,
  },

  // Status Card
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#6B7280',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },
  daysInfo: {
    alignItems: 'center',
  },
  daysValue: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#F59E0B',
    fontWeight: '700',
  },
  daysLabel: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#6B7280',
    fontWeight: '500',
  },
  paidInfo: {
    alignItems: 'flex-end',
  },
  paidLabel: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#6B7280',
    fontWeight: '500',
  },
  paidDate: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },

  // Modal Card Style
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalCardHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalCardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardIconBgWinner: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalCardTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
  },
  modalCardSubtitle: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#6B7280',
    marginTop: 2,
  },
  modalCardContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalCardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Form Card Style - Payment Details
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 0,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#212121',
    fontWeight: '600',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  formGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  formRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#212121',
    fontWeight: '500',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontWeight: '700',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  labelWithIconStack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  labelTextStack: {
    flex: 1,
  },
  formLabelEnglish: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#212121',
    fontWeight: '500',
    lineHeight: 14,
    marginLeft: -15,
  },
  formLabelTamil: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#212121',
    fontWeight: '500',
    lineHeight: 14,
  },
  inputFieldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#9CA3AF',
    fontWeight: '500',
    marginRight: 8,
  },
  inputValue: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#6B7280',
    fontWeight: '600',
  },
  inputFieldHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputValueHighlight: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#1E40AF',
    fontWeight: '600',
  },
  dueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  dueTextForm: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Payment Breakdown
  paymentBreakdown: {
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  breakdownItemLabel: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#6B7280',
  },
  breakdownItemValue: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#1E293B',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#10B981',
    fontWeight: '600',
  },
  commissionValue: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#F59E0B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerBold: {
    height: 1.5,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
  },
  totalItem: {
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#059669',
    fontWeight: '700',
  },
  dueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dueText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },

  // Winner Container
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  winnerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  winnerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerDetails: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    color: '#111827',
    fontWeight: '600',
  },
  winnerDateLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#6B7280',
    marginTop: 2,
  },
  winnerAmount: {
    alignItems: 'flex-end',
  },
  winnerAmountLabel: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
    }),
    color: '#6B7280',
    fontWeight: '500',
  },
  winnerAmountValue: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 2,
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
    marginTop: 2,
  },
  payNowButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    fontWeight: '600',
  },
  contactAdminButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  contactAdminButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
    }),
    fontWeight: '600',
  },

  // Info Cards
  infoCardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#1E3A8A',
    lineHeight: 18,
  },

  winnerInfo: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
    }),
    color: '#6B7280',
    flex: 1,
  },
});
export default styles;
