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
    // return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return text;
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
        throw new Error(result?.message || 'Failed to create group');
      }
      Alert.alert(
        'Success',
        `User added!\n\nName: ${formData.name}\nPhone: ${formData.phoneNumber}\nYear of Birth: ${formData.yearOfBirth}\nRole: ${formData.role}`
      );
      setFormData({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user' });
      setErrors({});
      onBack();
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

