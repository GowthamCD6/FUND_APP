import { StyleSheet, Platform } from 'react-native';

// --- PORTFOLIO STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
    marginTop: 0,
  },
  fixedHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  stickyContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 90,
    paddingTop: 0,
  },
  scrollView: {
    paddingHorizontal: 16,
    marginBottom: 110, // Add bottom padding to prevent content hiding behind bottom tab navigation
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginBottom: 25,
    marginTop: -15,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  cardLabel: {
    fontSize: 12,
    color: 'black',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
    fontWeight: '400',
  },
  cardValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  selectorChip: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  selectorChipActive: {
    backgroundColor: '#6B46C1', 
  },
  selectorChipText: {
    color: '#4B5563',
    fontWeight: '500',
    fontSize: 13,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'System',
  },
  selectorChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  groupsSection: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  
  // --- Simplified Styles from your original code for the bottom cards ---
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  statusDate: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'System',
  },
  groupContent: {
    padding: 20,
  },
  investmentAmount: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  groupName: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
    fontWeight: '400',
  },
  payButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  
  
  // Special styling for "Your Chit Groups" title
  chitGroupSectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    fontWeight: '800', // Semi-Bold
    color: '#212121',
    marginBottom: 12,
  },
  
  // Section divider
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
    borderRadius: 20,
  },

  // Group selector divider (better styling for below group amount values)
  groupSelectorDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 0,
  },

  // The main updated card container
  updatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFF2F5',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    // --- Shadow and elevation for more attractiveness ---
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08, 
    shadowRadius: 6, 
    elevation: 0.5, 
  },

  // Header section with group name and view icon
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, 
  },

  // Updated group name styling
  updatedGroupName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System',
  },

  // The touchable area for the view icon
  viewIconTouchable: {
    padding: 4,
  },
  circleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15, 
    backgroundColor: '#F0F3F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // The stylish divider with a mild color
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginTop: 0, 
    marginBottom: 16, 
  },

  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
  },
  leftColumn: {
    flex: 1, 
    justifyContent: 'space-between', 
    marginRight: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, 
  },
  detailLabel: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  detailValue: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '400',
    color: '#718096',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
  },
  rightColumn: {
    alignItems: 'flex-end', 
  },

  // Updated chit value label (centered within the right-aligned container)
  chitValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginRight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },

  // Updated chit value amount (right-aligned container but centered text)
  chitValueAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System',
  },

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 5,
    marginTop: -10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'System',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
  },

  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
  },

  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 24,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },

  // Empty portfolio state styles
  emptyPortfolioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyPortfolioContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyPortfolioTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System',
  },
  emptyPortfolioMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
});

export default styles;