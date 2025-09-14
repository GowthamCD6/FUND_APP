import React from 'react';
import { Share as RNShare, Alert } from 'react-native';

const ShareModal = ({ visible, onClose }) => {
  const shareMessage = `🌟 Hey! Just found GDK Chit Fund™ - an app for secure chit fund operations! Start from Rs.100. Join now and start your financial journey. Download: https://www.gdkchitfund.com`;

  const handleNativeShare = async () => {
    try {
      const result = await RNShare.share({
        message: shareMessage,
        url: 'https://www.gdkchitfund.com',
        title: 'GDK Chit Fund™'
      });
      
      if (result.action === RNShare.sharedAction) {
        onClose();
      }
    } catch (error) {
      Alert.alert('Share Error', 'Could not share at this time');
      onClose();
    }
  };

  // Auto-trigger native share when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      handleNativeShare();
    }
  }, [visible]);

  return null; // No UI needed since we use native share
};

export default ShareModal;
