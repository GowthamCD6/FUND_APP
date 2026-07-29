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

const LockInfo = ({ visible, onClose }) => {
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
            <Text style={styles.modalTitle}>Security Lock Function</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#212121" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Tamil Section - Top */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleTamil}>பாதுகாப்பு லாக் என்றால் என்ன?</Text>
              <Text style={styles.sectionTextTamil}>
                பாதுகாப்பு லாக் உங்கள் பயன்பாட்டை பாதுகாக்கிறது. நீங்கள் பயன்பாட்டை திறக்கும் பொழுது அல்லது நீண்ட நேரம் பயன்படுத்தாத பொழுது உங்களுக்கு உயிரியல் அல்லது சாதன PIN/வடிவம்/கடவுசொல் தேவை.
              </Text>
            </View>

            {/* Tamil How it Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleTamil}>இது எப்படி வேலை செய்கிறது</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>5 நிமிடம் செயல்படாத பிறகு தாறாக பூட்ட வேண்டும்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>நீங்கள் மற்ற பயன்பாட்டிற்கு சொல்லலாபோது பூட்ட வேண்டும்</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>உயிரியல் அல்லது சாதன PIN/வடிவம்/கடவுசொல் தேவை</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletTextTamil}>உங்கள் நிதி தகவல் பாதுகாப்பாக பாதுகாக்கப்படுகிறது</Text>
              </View>
            </View>

            {/* Tamil Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleTamil}>நன்மைகள்</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletTextTamil}>உங்கள் கணக்கை பாதுகாக்கிறது</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletTextTamil}>அனுமதி அணுகல் தடுக்கிறது</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletTextTamil}>தனிமை பாதுகாக்கிறது</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* English Section - Bottom */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What is Security Lock?</Text>
              <Text style={styles.sectionText}>
                Security Lock protects your app by requiring authentication (fingerprint, face ID, or PIN) every time you open the app or switch back to it after a timeout.
              </Text>
            </View>

            {/* English How it Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How it Works</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>App automatically locks after 5 minutes of inactivity</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Lock appears when you switch to another app</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Requires biometric or device PIN/Pattern/Password</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#3B82F6" />
                <Text style={styles.bulletText}>Protects your financial information securely</Text>
              </View>
            </View>

            {/* English Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletText}>Protects your account</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletText}>Prevents unauthorized access</Text>
              </View>
              <View style={styles.bulletPoint}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#10B981" />
                <Text style={styles.bulletText}>Maintains your privacy</Text>
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

export default LockInfo;