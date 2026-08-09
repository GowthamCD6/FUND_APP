import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import styles from './AddUsty';
import ApiService from '../../../../../services/ApiService';
import Header from '../../../../../components/HeaderComponent/Header';

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
  const validatePhoneNumber = (phone) => /^[0-9]{10}$/.test((phone || '').trim());
  const validateYear = (year) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    return /^\d{4}$/.test(year) && yearNum >= 1900 && yearNum <= currentYear;
  };

  const handleNameChange = (text) => {
    const clean = text.replace(/[<>&'"]/g, '');
    setFormData((s) => ({ ...s, name: clean }));
    if (errors.name) setErrors((e) => ({ ...e, name: '' }));
  };

  const handlePhoneChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData((s) => ({ ...s, phoneNumber: clean }));
    if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: '' }));
  };

  const handleYearChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    setFormData((s) => ({ ...s, yearOfBirth: clean }));
    if (errors.yearOfBirth) setErrors((e) => ({ ...e, yearOfBirth: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';

    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!validatePhoneNumber(formData.phoneNumber))
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number';

    const currentYr = new Date().getFullYear();
    if (!formData.yearOfBirth) newErrors.yearOfBirth = 'Year of birth is required';
    else if (!validateYear(formData.yearOfBirth))
      newErrors.yearOfBirth = `Enter a valid year (1900-${currentYr})`;

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      const response = await ApiService.makeRequest('/admin/users/addUser', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type') || '';
      let result;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response: ${text.substring(0, 200)}`);
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to add user');
      }

      Alert.alert(
        'Success',
        `User added successfully!\n\nName: ${formData.name}\nPhone: ${formData.phoneNumber}\nYear of Birth: ${formData.yearOfBirth}\nRole: ${formData.role === 'admin' ? 'Admin' : 'User'}`
      );
      setFormData({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user' });
      setErrors({});
      onBack();
    } catch (err) {
      console.error('Error adding user:', err);
      Alert.alert('Error', err?.message || 'Failed to add user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Add New User" onBack={onBack} />

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
                maxLength={10}
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

