import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // User Info Styles
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },

  // Group Details Styles
  groupDetailsContainer: {
    flex: 1,
    padding: 16,
  },

  // Chit Details Table Styles
  chitDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flex: 1,
    minHeight: 500,
    marginTop: -10,
  },
  chitDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
    marginBottom: 16,
    marginTop: 2,
    textAlign: 'center',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    overflow: 'hidden',
    // minHeight: 480,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
  },
  tableHeaderCell: {
    padding: 8,
    fontWeight: '700',
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#4CAF50',
  },
  tableBody: {
    maxHeight: 570,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    backgroundColor: '#FFFFFF',
  },
  completedRow: {
    backgroundColor: '#E8F5E8',
  },
  tableCell: {
    padding: 8,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#C8E6C9',
  },

  // Status Container Styles
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  paidText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  pendingText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  futureText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  payButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B46C1',
    gap: 8,
  },
  detailsButtonText: {
    color: '#6B46C1',
    fontSize: 13,
    fontWeight: '800',
  },

  // OTP Modal Styles
  otpModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  otpModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2A4E',
  },
  otpModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },

  // OTP Steps
  otpStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeOtpStep: {
    backgroundColor: '#EBF4FF',
    borderColor: '#6B46C1',
    borderWidth: 1,
  },
  otpStepText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  otpStepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // OTP Input
  otpInputContainer: {
    marginBottom: 24,
  },
  otpInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 8,
    backgroundColor: '#F9FAFB',
  },

  // OTP Buttons
  otpModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  otpCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  otpSubmitButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Security Action Styles (for init step)
  securityActionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  securityActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  securityActionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  securityActionButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  securityActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  centerIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  otpSentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpSentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  demoOtpHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  successDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 8,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  successDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  successDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
});

export default styles;