import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },

  // Modern Header with Gradient Effect
  headerContainer: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
    borderBottomWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.8,
  },

  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },

  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  headerIconButtonPrimary: {
    backgroundColor: '#6B46C1',
  },

  // Animated Search Bar
  animatedSearchBar: {
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 0,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    elevation: 2,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontWeight: '500',
  },

  // Filter Tabs
  filterTabsContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  filterTabsContent: {
    gap: 8,
    justifyContent: 'space-between',
    flexGrow: 1,
  },

  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E9D5FF',
    borderWidth: 0,
    borderColor: 'transparent',
  },

  filterTabActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },

  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Recent Label Container with dividers
  recentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 12,
    marginHorizontal: 24,
    justifyContent: 'center',
  },

  recentLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9D5FF',
  },

  // Recent Label
  recentLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#9CA3AF',
    marginHorizontal: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },

  // List Styles - Card Based
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    paddingBottom: 100,
    backgroundColor: '#F3E8FF',
  },

  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 0,
    borderColor: 'transparent',
  },

  chatItemSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6B46C1',
    borderWidth: 1,
    elevation: 3,
    shadowOpacity: 0.15,
  },

  chatItemUnread: {
    backgroundColor: '#FAFAF9',
    borderLeftWidth: 0,
  },

  // Avatar Styles - Enhanced
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },

  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  avatarCircleUnread: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1.5,
    borderColor: '#6B46C1',
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // Chat Content - Enhanced
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  chatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },

  chatNameUnread: {
    fontWeight: '800',
    color: '#111827',
    fontSize: 16.5,
  },

  lastMessage: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  lastMessageUnread: {
    fontWeight: '700',
    color: '#6B7280',
    fontSize: 13.5,
  },

  timestamp: {
    fontSize: 11,
    color: '#FFFFFF',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 35,
    textAlign: 'center',
    elevation: 1,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },

  timestampUnread: {
    color: '#FFFFFF',
    fontWeight: '600',
    backgroundColor: '#6B46C1',
  },

  // Chat Divider
  chatDivider: {
    height: 0,
    backgroundColor: 'transparent',
    marginHorizontal: 0,
  },

  // Unread Badge - Enhanced
  unreadBadge: {
    marginLeft: 8,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    elevation: 4,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  rightPlaceholder: {
    width: 28,
    height: 28,
  },

  // Empty State - Premium
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
    backgroundColor: '#F3E8FF',
  },

  emptyStateText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  emptyStateSubtext: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  emptyStateButton: {
    flexDirection: 'row',
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#6B46C1',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Floating Action Button - Premium
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  fabInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;
