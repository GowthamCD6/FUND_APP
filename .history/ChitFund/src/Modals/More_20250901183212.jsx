import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';

const MoreModal = ({ visible, onClose, children }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          {/* You can add a close icon here if needed */}
        </TouchableOpacity>
        {children}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
});

export default MoreModal;
