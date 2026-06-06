import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../../../../../services/ApiService';

const Nominee = ({ onBack }) => {
  const navigation = useNavigation();
  const [nomineeName, setNomineeName] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (errors.relationship) {
      setErrors(prev => ({ ...prev, relationship: '' }));
    }
    setIsModalVisible(false);
  };

  useEffect(() => {
    const loadNominee = async () => {
      try {
        const response = await ApiService.getNomineeDetails();
        if (response.success && response.data?.nominee) {
          setNomineeName(response.data.nominee.nomineeName || '');
          setNomineePhone(response.data.nominee.nomineePhone || '');
          setSelectedRelationship(response.data.nominee.relationship || '');
        }
      } catch (error) {
        console.error('Failed to load nominee details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNominee();
  }, []);

  const validateForm = () => {
    const nextErrors = {};

    if (!nomineeName.trim()) {
      nextErrors.name = 'Nominee name is required';
    }

    if (!nomineePhone.trim()) {
      nextErrors.phone = 'Nominee phone is required';
    } else if (!/^\d{10,15}$/.test(nomineePhone.trim())) {
      nextErrors.phone = 'Enter a valid phone number';
    }

    if (!selectedRelationship.trim()) {
      nextErrors.relationship = 'Relationship is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all nominee details correctly.');
      return;
    }

    try {
      setSaving(true);
      const response = await ApiService.updateNomineeDetails({
        nomineeName: nomineeName.trim(),
        nomineePhone: nomineePhone.trim(),
        relationship: selectedRelationship.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Nominee details saved successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      Alert.alert('Error', response.message || 'Failed to save nominee details.');
    } catch (error) {
      console.error('Save nominee error:', error);
      Alert.alert('Error', error.message || 'Failed to save nominee details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Nominee</Text>
      </View>
      <View style={styles.separator} />
      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6D28D9" />
            <Text style={styles.loadingText}>Loading nominee details...</Text>
          </View>
        ) : null}

        {/* Nominee Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Full Name"
            placeholderTextColor="#9CA3AF"
            value={nomineeName}
            onChangeText={(value) => {
              setNomineeName(value);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }));
              }
            }}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Nominee Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="1234567890"
            placeholderTextColor="#9CA3AF"
            value={nomineePhone}
            onChangeText={(value) => {
              setNomineePhone(value);
              if (errors.phone) {
                setErrors(prev => ({ ...prev, phone: '' }));
              }
            }}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Nominee Relationship Input with Modal Trigger */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Relationship</Text>
          <TouchableOpacity
            style={[styles.relationshipInput, errors.relationship && styles.inputError]}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={selectedRelationship ? styles.relationshipText : styles.placeholderText}>
              {selectedRelationship || 'Select'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {errors.relationship && <Text style={styles.errorText}>{errors.relationship}</Text>}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
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
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#d7dce4ff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    marginTop: -10,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
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
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
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
  saveButtonDisabled: {
    opacity: 0.75,
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
    marginTop: 3,
    marginBottom: 3,
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