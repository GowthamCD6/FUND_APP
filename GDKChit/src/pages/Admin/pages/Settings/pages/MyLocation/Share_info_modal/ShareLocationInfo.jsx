import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ShareLocationInfo = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Location Information</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#212121" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Tamil Section - Top */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleTamil}>உங்கள் இருப்பிடம் பகிர்ந்து கொள்ளுங்கள்</Text>
              <Text style={styles.sectionTextTamil}>
                உங்கள் வீட்டின் இருப்பிடத்தை பகிர்ந்து கொண்டால், எங்கள் குழு சேவை வழங்கப்படும் போது உங்கள் வீட்டைக் கண்டுபிடிக்க முடியும். இது எங்கள் சேவையை மேலும் திறமையாக நடத்த உதவுகிறது.
              </Text>
            </View>

            {/* Tamil How it Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleTamil}>இது எப்படி வேலை செய்கிறது</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>"உங்கள் இருப்பிடத்தை பகிரவும்" என்பதை நொக்கவும்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>உங்கள் ஜிபிஎஸ் இருப்பிடம் பிடிக்கப்படும்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>முகவரி கணக்கிடப்பட்டு சேமிக்கப்படும்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>உங்கள் தகவல் பாதுகாப்பாக இருக்கும்</Text>
              </View>
            </View>

            {/* Tamil Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleTamil}>நன்மைகள்</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletTextTamil}>வேகமான சேவை வழங்கப்படும்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletTextTamil}>நிர்வாகிகள் எளிதாக உங்களை கண்டுபிடிக்கலாம்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletTextTamil}>சேவை மற்றும் ஆதரவு மேலும் திறமையாக</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* English Section - Bottom */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Share Your Location</Text>
              <Text style={styles.sectionText}>
                By sharing your house location, our team can easily find your address when delivering services. This helps us serve you more efficiently and accurately.
              </Text>
            </View>

            {/* English How it Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How it Works</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Tap "Share My Address" button</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Your GPS location will be captured</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Address will be calculated and saved</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Your information remains secure</Text>
              </View>
            </View>

            {/* English Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletText}>Faster service delivery</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletText}>Admins can locate you easily</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletText}>Improved service and support</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  sectionTitleTamil: {
    fontSize: 19,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  sectionTextTamil: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  bulletText: {
    fontSize: 15,
    color: '#555555',
    flex: 1,
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  bulletTextTamil: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  modalCloseButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
});

export default ShareLocationInfo;
