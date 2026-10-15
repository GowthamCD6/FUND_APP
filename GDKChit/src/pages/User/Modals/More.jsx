import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform, DeviceEventEmitter, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Join from './Pages/JoinGroup/JoinGroup';
import GroupCards from './Pages/ChitGroupCard/GroupCards';
import Auction from './Pages/Auction/Auction';
import Finance from './Pages/Finance/Finance';
import ChitSimulator from '../Pages/Tools/ChitSimulator/ChitSimulator';
import PrizedSuretyTracker from '../Pages/Tools/PrizedSuretyTracker/PrizedSuretyTracker';
import DueCalendar from '../Pages/Tools/DueCalendar/DueCalendar';
import DocumentVault from '../Pages/Tools/DocumentVault/DocumentVault';
import { useRef } from 'react';

import Header from '../../../components/HeaderComponent/Header';
import { useLanguage } from '../../../utils/LanguageContext';

const MoreModal = ({ visible, onClose, selectedGroup, initialGroupCode = '' }) => {
  const [showJoinPage, setShowJoinPage] = useState(false);
  const [showGroupCard, setShowGroupCard] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showSuretyTracker, setShowSuretyTracker] = useState(false);
  const [showDueCalendar, setShowDueCalendar] = useState(false);
  const [showDocumentVault, setShowDocumentVault] = useState(false);
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const { t, language } = useLanguage();

  useEffect(() => {
    if (selectedGroup) {
      setShowAuction(true);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (initialGroupCode) {
      setJoinGroupCode(initialGroupCode);
      setShowJoinPage(true);
    }
  }, [initialGroupCode]);

  const itemRefs = useRef([]);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('REQUEST_MORE_LAYOUT', () => {
      const layouts = {};
      let count = 0;
      
      const measure = (index, key) => {
        if (itemRefs.current[index]) {
          itemRefs.current[index].measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) layouts[key] = { x, y, width: w, height: h };
            count++;
            if (count === 5) DeviceEventEmitter.emit('MORE_LAYOUT_MEASURED', layouts);
          });
        } else {
          count++;
          if (count === 5) DeviceEventEmitter.emit('MORE_LAYOUT_MEASURED', layouts);
        }
      };

      measure(0, 'plus_join');
      measure(1, 'plus_group_card');
      measure(2, 'plus_auction');
      measure(3, 'plus_finance');

      if (closeBtnRef.current) {
        closeBtnRef.current.measureInWindow((x, y, w, h) => {
          if (w > 0 && h > 0) layouts['plus_close'] = { x, y, width: w, height: h };
          count++;
          if (count === 5) DeviceEventEmitter.emit('MORE_LAYOUT_MEASURED', layouts);
        });
      } else {
        count++;
        if (count === 5) DeviceEventEmitter.emit('MORE_LAYOUT_MEASURED', layouts);
      }
    });

    return () => sub.remove();
  }, []);

  const handleJoinPress = () => {
    setJoinGroupCode('');
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
    setJoinGroupCode('');
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
    setShowSimulator(false);
    setShowSuretyTracker(false);
    setShowDueCalendar(false);
    setShowDocumentVault(false);
    setJoinGroupCode('');
    onClose();
  };

  if (showJoinPage) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleJoinBack}
      >
        <Join onBack={handleJoinBack} initialGroupCode={joinGroupCode} />
      </Modal>
    );
  }

  if (showGroupCard) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleGroupCardBack}
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
        onRequestClose={handleAuctionBack}
      >
        <Auction onClose={handleAuctionBack} selectedGroupId={selectedGroup?.id} selectedGroupType={selectedGroup?.type} />
      </Modal>
    );
  }

  if (showFinance) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={handleFinanceBack}
      >
        <Finance selectedGroup={selectedGroup} onBack={handleFinanceBack} />
      </Modal>
    );
  }

  if (showSimulator) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={() => setShowSimulator(false)}
      >
        <ChitSimulator onBack={() => setShowSimulator(false)} />
      </Modal>
    );
  }

  if (showSuretyTracker) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={() => setShowSuretyTracker(false)}
      >
        <PrizedSuretyTracker onBack={() => setShowSuretyTracker(false)} />
      </Modal>
    );
  }

  if (showDueCalendar) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={() => setShowDueCalendar(false)}
      >
        <DueCalendar onBack={() => setShowDueCalendar(false)} />
      </Modal>
    );
  }

  if (showDocumentVault) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={() => setShowDocumentVault(false)}
      >
        <DocumentVault onBack={() => setShowDocumentVault(false)} />
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
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.menuList}>
              <MenuItem
                viewRef={(el) => itemRefs.current[0] = el}
                icon={<MaterialCommunityIcons name="account-group" size={26} color="#6B46C1" />}
                title={t('Join the Group')}
                description={t('Enter the group code to join the group')}
                onPress={handleJoinPress}
                language={language}
              />
              <MenuItem
                viewRef={(el) => itemRefs.current[1] = el}
                icon={<MaterialCommunityIcons name="credit-card" size={26} color="#6B46C1" />}
                title={t('Group card')}
                description={t('View and confirm the pay details')}
                onPress={handleGroupCardPress}
                language={language}
              />
              <MenuItem
                viewRef={(el) => itemRefs.current[2] = el}
                icon={<MaterialCommunityIcons name="gavel" size={26} color="#6B46C1" />}
                title={t('Auction')}
                description={t('Participate in chit auction bidding')}
                onPress={handleAuctionPress}
                language={language}
              />
              <MenuItem
                viewRef={(el) => itemRefs.current[3] = el}
                icon={<MaterialCommunityIcons name="calculator-variant" size={26} color="#0D9488" />}
                title={t('Chit Simulator & ROI')}
                description={t('Calculate prize payout, dividends and borrowing ROI')}
                onPress={() => setShowSimulator(true)}
                language={language}
              />
              <MenuItem
                icon={<MaterialCommunityIcons name="shield-account" size={26} color="#B45309" />}
                title={t('Prized Status & Surety')}
                description={t('Track winning payouts and manage guarantor details')}
                onPress={() => setShowSuretyTracker(true)}
                language={language}
              />
              <MenuItem
                icon={<MaterialCommunityIcons name="calendar-month" size={26} color="#2563EB" />}
                title={t('Due-Date Calendar')}
                description={t('Upcoming payment deadlines across enrolled chits')}
                onPress={() => setShowDueCalendar(true)}
                language={language}
              />
              <MenuItem
                icon={<MaterialCommunityIcons name="folder-text" size={26} color="#7C3AED" />}
                title={t('E-Sign & Document Vault')}
                description={t('Sign agreement and download verified PDF receipts')}
                onPress={() => setShowDocumentVault(true)}
                language={language}
              />
              <MenuItem
                icon={<MaterialCommunityIcons name="cash-multiple" size={26} color="#6B46C1" />}
                title={t('Finance')}
                description={t('Contribute and earn extra interest')}
                onPress={handleFinancePress}
                language={language}
              />
            </View>
          </ScrollView>
          {/* X Button */}
          <TouchableOpacity ref={closeBtnRef} style={styles.xButton} onPress={handleModalClose}>
            <Text style={styles.xButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const MenuItem = ({ icon, title, description, onPress, viewRef, language }) => (
  <TouchableOpacity ref={viewRef} style={styles.menuItemRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.menuIconWrap}>
      <View style={styles.menuIconCircle}>
        {icon}
      </View>
    </View>
    <View style={styles.menuTextWrap}>
      <Text style={[styles.menuTitle, language === 'ta' && { fontSize: 15 }]}>{title}</Text>
      <Text style={[styles.menuDesc, language === 'ta' && { fontSize: 12 }]}>{description}</Text>
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
  menuScroll: {
    maxHeight: 440,
    width: '100%',
  },
  menuList: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 12,
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