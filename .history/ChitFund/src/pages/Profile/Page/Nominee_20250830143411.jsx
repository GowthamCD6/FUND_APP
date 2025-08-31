import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Nominee = ({ onBack }) => {
  const [nomineeName, setNomineeName] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const relationships = [
    'Father',
    'Mother',
    'Husband',
    'Wife',
    'Brother',
    'Sister',
    'Son',
    'Daughter',
    'Friend',
    'Relative',
    'Other',
  ];

  const handleSelectRelationship = (relationship) => {
    setSelectedRelationship(relationship);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Nominee</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Nominee Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9CA3AF"
            value={nomineeName}
            onChangeText={setNomineeName}
          />
        </View>

        {/* Nominee Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="1234567890"
            placeholderTextColor="#9CA3AF"
            value={nomineePhone}
            onChangeText={setNomineePhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Nominee Relationship Input with Modal Trigger */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Relationship</Text>
          <TouchableOpacity
            style={styles.relationshipInput}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={selectedRelationship ? styles.relationshipText : styles.placeholderText}>
              {selectedRelationship || 'Select'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={() => console.log('Save Nominee')}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      {/* Relationship Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nominee Relation</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={relationships}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.relationshipItem}
                  onPress={() => handleSelectRelationship(item)}
                >
                  <Text style={styles.relationshipItemText}>{item}</Text>
                  {selectedRelationship === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputContainer: {
    marginBottom: 18,
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    backgroundColor: '#F9F9F9',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
    height: 52,
    width: '100%',
  },
  relationshipInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9F9F9',
    height: 52,
    width: '100%',
  },
  relationshipText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  placeholderText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  saveButton: {
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
    width: '96%',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  bottomSpacing: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Adjust for safe area on iOS
    maxHeight: '50%',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#212121',
    marginTop
    
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  relationshipItem: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
 paddingHorizontal: 20,
 paddingVertical: 15,
 borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
relationshipItemText: {
  fontSize: 17,
  color: '#1F2937',
  fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
},
});

export default Nominee;