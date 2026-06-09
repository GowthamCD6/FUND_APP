import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5F5',
  },

  // Enhanced Header Styles - Exact UI Match
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 0,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -4,
  },
  avatarWithStatus: {
    position: 'relative',
    marginRight: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '600',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  profileStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 1,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE5F5',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  // Empty State
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Messages List
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#EDE5F5',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-start',
  },
  otherMessageContainer: {
    justifyContent: 'flex-end',
  },

  // Avatar Styles
  avatarContainer: {
    marginRight: 12,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCC9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  spacer: {
    width: 38,
  },

  // Message Bubble Styles - 100% Pixel Perfect
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  otherBubble: {
    backgroundColor: '#E8D5C4',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  groupedUserBubble: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  groupedOtherBubble: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#6B5344',
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'right',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'left',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 3,
  },
  timestamp: {
    fontSize: 12,
    color: '#9B8B7E',
    marginTop: 2,
    fontWeight: '400',
  },
  userTimestamp: {
    color: '#D8BFD8',
    fontSize: 12,
  },

  // Typing Indicator
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: 60,
    justifyContent: 'space-around',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },

  // Input Container - Pixel Perfect
  inputContainer: {
    backgroundColor: '#EDE5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 100,
  },
  emojiButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },

  // Dropdown Menu
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    width: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userListAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  userListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userListPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addUserButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeUserButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupInfoModalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  groupInfoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupInfoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 16,
  },
  groupInfoContent: {
    flex: 1,
  },
  groupInfoHeaderSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 8,
    borderBottomColor: '#F3F4F6',
  },
  groupInfoAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  groupInfoAvatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7C3AED',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  groupInfoNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  groupInfoNameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  groupInfoMembersSection: {
    flex: 1,
  },
  groupInfoMembersHeader: {
    padding: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupInfoAddMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  groupInfoAddMemberIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfoAddMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupInfoMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  groupInfoMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  groupInfoMemberInfo: {
    flex: 1,
  },
  groupInfoMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupInfoMemberPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  renameDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameDialogContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  renameDialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  renameDialogInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
    fontSize: 16,
    color: '#111827',
    paddingVertical: 8,
    marginBottom: 24,
  },
  renameDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  renameDialogButton: {
    marginLeft: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  renameDialogButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  renameDialogButtonCancelText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  renameDialogButtonSave: {
    backgroundColor: '#7C3AED',
  },
  renameDialogButtonSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default styles;
