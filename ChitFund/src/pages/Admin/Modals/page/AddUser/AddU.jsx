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
    phoneNumber: '',
    dateOfBirth: '',
    role: 'user',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Helpers
  const validatePhoneNumber = (phone) => /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));
  const validateDate = (date) =>
    /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(date);

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  const formatDateOfBirth = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
  };

  // Handlers
  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setFormData((s) => ({ ...s, phoneNumber: formatted }));
    if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: '' }));
  };

  const handleDateChange = (text) => {
    const formatted = formatDateOfBirth(text);
    setFormData((s) => ({ ...s, dateOfBirth: formatted }));
    if (errors.dateOfBirth) setErrors((e) => ({ ...e, dateOfBirth: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!validatePhoneNumber(formData.phoneNumber))
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number';

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    else if (!validateDate(formData.dateOfBirth))
      newErrors.dateOfBirth = 'Enter date as MM/DD/YYYY';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      // TODO: call API to add user
      Alert.alert(
        'Success',
        `User added!\n\nPhone: ${formData.phoneNumber}\nDOB: ${formData.dateOfBirth}\nRole: ${formData.role}`
      );
      setFormData({ phoneNumber: '', dateOfBirth: '', role: 'user' });
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
                label="Phone Number"
                placeholder="123 456 7890"
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
                    label="Date of Birth"
                    placeholder="MM/DD/YYYY"
                    value={formData.dateOfBirth}
                    onChangeText={handleDateChange}
                    icon="calendar-blank-outline"
                    keyboardType="numeric"
                    maxLength={10}
                    required
                    error={errors.dateOfBirth}
                  />
                </View>
                <View style={[styles.halfWidth, { marginLeft: 8 }]}>
                  <RoleField
                    label="Role"
                    value={formData.role}
                    onChangeRole={(role) => setFormData(s => ({ ...s, role }))}
                    icon="account-badge-outline"
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
            setFormData({ phoneNumber: '', dateOfBirth: '', role: 'user' });
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

const RoleField = ({ label, value, onChangeRole, icon, required = false }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#212121" />
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
    </View>
    <View style={styles.roleContainer}>
      <TouchableOpacity
        onPress={() => onChangeRole('user')}
        activeOpacity={0.8}
        style={[
          styles.roleButton,
          value === 'user' && styles.roleButtonActive,
        ]}
      >
        <Text
          style={[
            styles.roleButtonText,
            value === 'user' && styles.roleButtonTextActive,
          ]}
        >
          User
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChangeRole('admin')}
        activeOpacity={0.8}
        style={[
          styles.roleButton,
          value === 'admin' && styles.roleButtonActive,
        ]}
      >
        <Text
          style={[
            styles.roleButtonText,
            value === 'admin' && styles.roleButtonTextActive,
          ]}
        >
          Admin
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
    width: 120,
    height: 120,
  },
  formContainer: {
    paddingBottom: 40,
  },
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
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
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