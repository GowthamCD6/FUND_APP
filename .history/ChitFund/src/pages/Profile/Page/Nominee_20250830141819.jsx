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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Adjust for iOS status bar
    paddingBottom: 16, // Increased paddingBottom for better spacing
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20, // Slightly smaller to match image
    fontWeight: '500', // Adjusted fontWeight
    color: '#1F2937', // Darker color
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24, // Increased padding top for content
  },
  inputContainer: {
    marginBottom: 20, // Spacing between input sections
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB', // Light gray border
    borderRadius: 8, // Rounded corners for inputs
    paddingHorizontal: 16, // More padding inside input
    paddingVertical: 12, // More vertical padding
    fontSize: 16,
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  relationshipInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  relationshipText: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF', // Lighter placeholder color
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  saveButton: {
    backgroundColor: '#6D28D9', // Purple color for the button
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
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
      fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },  
  re  lationshipItem: {
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