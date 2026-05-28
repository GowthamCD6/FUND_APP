import { StyleSheet, Platform, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Setup Screen Container
  setupScreenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    flexDirection: "column",
  },

  // Setup Scroll Container
  setupScrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
  },

  // Tab Container
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 10,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#6B46C1",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B46C1",
  },
  activeTabText: {
    color: "#FFFFFF",
  },

  // Section Styles
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },

  // Group List
  groupListContainer: {
    marginBottom: -10,
  },

  // Member Card Styles
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  selectedMember: {
    borderColor: "#6B46C1",
    backgroundColor: "#F5F3FF",
    elevation: 2,
    shadowOpacity: 0.12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    elevation: 2,
    shadowColor: "#6B46C1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  memberPhone: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 0,
    fontWeight: "500",
  },
  checkIcon: {
    marginLeft: 12,
  },

  // Start Button
  startButton: {
    backgroundColor: "#6B46C1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeButton: {
    backgroundColor: "#10B981",
  },
  disabledButton: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    width: width * 0.9,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },

  // Auction Info
  auctionInfo: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  auctionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  auctionMeta: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 16,
  },

  // Result Modal
  resultModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxHeight: height * 0.8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 10,
  },
  winnerListSection: {
    width: "100%",
    marginBottom: 20,
  },
  winnerListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  winnerList: {
    maxHeight: height * 0.4,
  },
  winnerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  winnerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedWinner: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  winnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  winnerAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  winnerDetails: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  winnerBid: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10B981",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  // Reusing disabledButton style for consistency
  // disabledButton: {
  //   opacity: 0.6,
  // },
  diceResult: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B46C1",
  },
});

export default styles;
