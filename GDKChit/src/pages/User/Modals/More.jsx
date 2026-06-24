import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Join from './Pages/JoinGroup/JoinGroup';
import GroupCards from './Pages/ChitGroupCard/GroupCards';
import Auction from './Pages/Auction/Auction';
import Finance from './Pages/Finance/Finance';

const MoreModal = ({ visible, onClose, selectedGroup }) => {
  const [showJoinPage, setShowJoinPage] = useState(false);
  const [showGroupCard, setShowGroupCard] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const [showFinance, setShowFinance] = useState(false);

  const handleJoinPress = () => {
    setShowJoinPage(true);
  };

  const handleGroupCardPress = () => {
    setShowGroupCard(true);
  };

  const handleAuctionPress = () => {
    setShowAuction(true);
  };

  const handleJoinBack = () => {
    setShowJoinPage(false);
  };

  const handleGroupCardBack = () => {
    setShowGroupCard(false);
  };

  const handleAuctionBack = () => {
    setShowAuction(false);
  };

  const handleFinancePress = () => {
    setShowFinance(true);
  };

  const handleFinanceBack = () => {
    setShowFinance(false);
  };

  const handleModalClose = () => {
    setShowJoinPage(false);
    setShowGroupCard(false);
    setShowAuction(false);
    setShowFinance(false);
    onClose();
  };

  if (showJoinPage) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleModalClose}
      >
        <Join onBack={handleJoinBack} />
      </Modal>
    );
  }

  if (showGroupCard) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleModalClose}
      >
        <GroupCards onBack={handleGroupCardBack} />
      </Modal>
    );
  }

  if (showAuction) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleModalClose}
      >
        <Auction onClose={handleAuctionBack} />
      </Modal>
    );
  }

  if (showFinance) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleModalClose}
      >
        <Finance selectedGroup={selectedGroup} onBack={handleFinanceBack} />
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Modal Content */}
          <View style={styles.menuList}>
            <MenuItem
              icon={<MaterialCommunityIcons name="account-group" size={26} color="#6B46C1" />}
              title="Join the Group"
              description="Enter the group code to join the group"
              onPress={handleJoinPress}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="credit-card" size={26} color="#6B46C1" />}
              title="Group card"
              description="View and confirm the pay details"
              onPress={handleGroupCardPress}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="gavel" size={26} color="#6B46C1" />}
              title="Auction"
              description="Participate in chit auction bidding"
              onPress={handleAuctionPress}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="cash-multiple" size={26} color="#6B46C1" />}
              title="Finance"
              description="Contribute and earn extra interest"
              onPress={handleFinancePress}
            />
          </View>
          {/* X Button */}
          <TouchableOpacity style={styles.xButton} onPress={handleModalClose}>
            <Text style={styles.xButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const MenuItem = ({ icon, title, description, onPress }) => (
  <TouchableOpacity style={styles.menuItemRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.menuIconWrap}>
      <View style={styles.menuIconCircle}>
        {icon}
      </View>
    </View>
    <View style={styles.menuTextWrap}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuDesc}>{description}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 0,
    paddingBottom: 32,
    minHeight: 320,
    alignItems: 'center',
  },
  menuList: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconWrap: {
    marginRight: 18,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D1E5B',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  menuDesc: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  xButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  xButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: -2,
  },
});

export default MoreModal;