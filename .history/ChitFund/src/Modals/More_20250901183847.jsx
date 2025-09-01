import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const MoreModal = ({ visible, onClose }) => (
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
            icon={<MaterialCommunityIcons name="cash-plus" size={26} color="#6B46C1" />}
            title="Buy"
            description="The right time to buy gold is now"
          />
          <MenuItem
            icon={<MaterialCommunityIcons name="autorenew" size={26} color="#6B46C1" />}
            title="Auto Savings"
            description="Set up recurring transactions"
          />
          <MenuItem
            icon={<MaterialCommunityIcons name="cube-send" size={26} color="#6B46C1" />}
            title="Gold Redemption"
            description="Get physical gold delivered at your doorstep."
          />
          <MenuItem
            icon={<MaterialCommunityIcons name="wallet-outline" size={26} color="#6B46C1" />}
            title="Sell"
            description="Liquidate your gold to cash"
          />
        </View>
        {/* X Button */}
        <TouchableOpacity style={styles.xButton} onPress={onClose}>
          <Text style={styles.xButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const MenuItem = ({ icon, title, description }) => (
  <View style={styles.menuItemRow}>
    <View style={styles.menuIconWrap}>
      <View style={styles.menuIconCircle}>
        {icon}
      </View>
    </View>
    <View style={styles.menuTextWrap}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuDesc}>{description}</Text>
    </View>
  </View>
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
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
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
