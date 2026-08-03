import { StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
    marginTop: -15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: -15,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    letterSpacing: -0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // List
  listContainer: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },

  // Group Cards (exact Reports page styling)
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
  
  // Header with Group Name and Arrow
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
  },
  groupNameContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },

  // Status Badge Container
  statusContainer: {
    paddingHorizontal: 20,
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
  },

  // Content Section
  groupCardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Members and Amount Row
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
  },

  // Progress Section
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
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B46C1',
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

  // Footer Section
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },

  // Arrow Button
  arrowButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },

  // Group Details Page
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 32,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  previewCode: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },

// Modal Overlay and Content
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
modalContent: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  width: '100%',
  maxWidth: 400,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  overflow: 'hidden',
},
modalHeader: {
  paddingHorizontal: 20,
  paddingTop: 24,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  backgroundColor: '#F9FAFB',
},
modalTitle: {
  fontSize: 22,
  fontWeight: '500',
  color: '#1F2937',
  marginBottom: 6,
  fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
},
modalSubtitle: {
  fontSize: 15,
  color: '#6B7280',
  fontWeight: '500',
  fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
},
modalActionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 18,
  paddingHorizontal: 20,
  backgroundColor: '#FFFFFF',
},
modalActionText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1F2937',
  marginLeft: 12,
  flex: 1,
  fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
},
deleteText: {
  color: '#EF4444',
},
modalDivider: {
  height: 1,
  backgroundColor: '#E5E7EB',
  marginHorizontal: 0,
},
modalCancelButton: {
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  alignItems: 'center',
  backgroundColor: '#F9FAFB',
  marginTop: 0,
},
modalCancelText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#6B7280',
  fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
},
});

export default styles;