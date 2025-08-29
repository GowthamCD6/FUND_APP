import { StyleSheet, Platform } from 'react-native';

// --- PORTFOLIO STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4, 
  },
  headerTitle: {
    marginTop: -10,
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff', // Darker gray color for better visibility
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
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : Platform.OS === 'ios' ? 'Gilroy-Regular' : 'Poppins-Regular',
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
    backgroundColor: '#6B46C1', // Purple color for active state
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
  
  // --- UPDATED Styles for the New Card Layout ---
  
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
    shadowOpacity: 0.08, // Increased opacity for a more visible shadow
    shadowRadius: 6, // Increased radius for a softer shadow
    elevation: 5, // Increased elevation for Android
  },

  // Header section with group name and view icon
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Space below the header before the divider
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
    width: 30, // Increased size for visibility
    height: 30, // Increased size for visibility
    borderRadius: 15, // Half of width/height for a perfect circle
    backgroundColor: '#F0F3F7', // Light gray background for the circle
    justifyContent: 'center',
    alignItems: 'center',
  },

  // The stylish divider with a mild color
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginTop: 0, // Adjusted margin top since it's already accounted for in cardHeader marginBottom
    marginBottom: 16, // Space below the divider
  },

  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top
  },
  leftColumn: {
    flex: 1, // Takes up available space
    justifyContent: 'space-between', // Pushes Group ID and Date apart
    marginRight: 10, // Space between left and right columns
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Space between Group ID and Date rows
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#718096',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'System',
  },
  rightColumn: {
    alignItems: 'flex-end', // Align chit value to the right
  },

  // Updated chit value label (centered within the right-aligned container)
  chitValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'System',
  },

  // Updated chit value amount (right-aligned container but centered text)
  chitValueAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System',
  },
});

export default styles;