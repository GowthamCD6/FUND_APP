import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';

export default function AddUser({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    yearOfBirth: '',
    role: 'user',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Helpers
  const validatePhoneNumber = (phone) => /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));
  const validateYear = (year) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    return /^\d{4}$/.test(year) && yearNum >= 1900 && yearNum <= currentYear;
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  const formatYear = (text) => {
    return text.replace(/\D/g, '').slice(0, 4);
  };

  // Handlers
  const handleNameChange = (text) => {
    setFormData((s) => ({ ...s, name: text }));
    if (errors.name) setErrors((e) => ({ ...e, name: '' }));
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setFormData((s) => ({ ...s, phoneNumber: formatted }));
    if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: '' }));
  };

  const handleYearChange = (text) => {
    const formatted = formatYear(text);
    setFormData((s) => ({ ...s, yearOfBirth: formatted }));
    if (errors.yearOfBirth) setErrors((e) => ({ ...e, yearOfBirth: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!validatePhoneNumber(formData.phoneNumber))
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number';

    if (!formData.yearOfBirth) newErrors.yearOfBirth = 'Year of birth is required';
    else if (!validateYear(formData.yearOfBirth))
      newErrors.yearOfBirth = 'Enter a valid year (1900-2025)';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      // TODO: call API to add user
      Alert.alert(
        'Success',
        `User added!\n\nName: ${formData.name}\nPhone: ${formData.phoneNumber}\nYear of Birth: ${formData.yearOfBirth}\nRole: ${formData.role}`
      );
      setFormData({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user' });
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New User</Text>
      </View>
      <View style={styles.separator} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../../../../animation/Add-user.json')}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>

          <View style={styles.formContainer}>
            {/* Form Fields */}
            <View style={styles.formSection}>
              <InputField
                label="User Name"
                placeholder="Enter user's name"
                value={formData.name}
                onChangeText={handleNameChange}
                icon="account-outline"
                required
                error={errors.name}
              />

              <InputField
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChangeText={handlePhoneChange}
                icon="phone-outline"
                keyboardType="phone-pad"
                maxLength={12}
                required
                error={errors.phoneNumber}
              />

              <View style={styles.row}>
                <View style={[styles.halfWidth, { marginRight: 8 }]}>
                  <InputField
                    label="Year of Birth"
                    placeholder="YYYY"
                    value={formData.yearOfBirth}
                    onChangeText={handleYearChange}
                    icon="calendar-blank-outline"
                    keyboardType="numeric"
                    maxLength={4}
                    required
                    error={errors.yearOfBirth}
                  />
                </View>
                <View style={[styles.halfWidth, { marginLeft: 8 }]}>
                  <RoleDropdown
                    label="Role"
                    value={formData.role}
                    onChangeRole={(role) => setFormData(s => ({ ...s, role }))}
                    icon="shield-account"
                    required
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, submitting && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <Text style={styles.createButtonText}>Adding...</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Add User</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setFormData({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user' });
            setErrors({});
          }}
          activeOpacity={0.8}
          style={styles.clearButton}
        >
          <Text style={styles.clearButtonText}>Clear Form</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = 'default',
  maxLength,
  required = false,
  error
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#212121" />
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
    </View>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#999999"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const RoleDropdown = ({ label, value, onChangeRole, icon, required = false }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const roles = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' }
  ];

  const handleRoleSelect = (roleValue) => {
    onChangeRole(roleValue);
    setDropdownOpen(false);
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <MaterialCommunityIcons name={icon} size={20} color="#212121" />
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.dropdownContainer}
        onPress={() => setDropdownOpen(!dropdownOpen)}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownText}>
          {roles.find(role => role.value === value)?.label || 'Select Role'}
        </Text>
        <MaterialCommunityIcons 
          name={dropdownOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666666" 
        />
      </TouchableOpacity>

      {dropdownOpen && (
        <View style={styles.dropdownOptions}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.dropdownOption,
                value === role.value && styles.dropdownOptionSelected
              ]}
              onPress={() => handleRoleSelect(role.value)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.dropdownOptionText,
                value === role.value && styles.dropdownOptionTextSelected
              ]}>
                {role.label}
              </Text>
              {value === role.value && (
                <MaterialCommunityIcons name="check" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginTop: -4,
  },
  headerTitle: {
    marginTop: -6,
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  animation: {
    width: 160,
    height: 160,
  },
  formContainer: {
    paddingBottom: 40,
    marginTop: 0,},
  formSection: {
    gap: 24,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
    width: '100%',
    marginTop: 8,
    height: 48,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    height: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  dropdownOptionTextSelected: {
    color: '#007AFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  clearButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
});