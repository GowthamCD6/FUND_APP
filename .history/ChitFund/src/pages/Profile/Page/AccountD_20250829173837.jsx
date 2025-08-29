import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, TextInput, Alert, Modal, FlatList } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SOUTH_INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
];
const TAMIL_NADU_CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore', 'Tirunelveli', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Kanchipuram', 'Nagercoil', 'Kumbakonam', 'Rajapalayam', 'Pudukkottai', 'Hosur', 'Ambur', 'Krishnagiri', 'Cuddalore', 'Tiruvannamalai', 'Pollachi', 'Vaniyambadi', 'Nagapattinam', 'Viluppuram', 'Tirupur', 'Ariyalur', 'Perambalur', 'Dharmapuri', 'Virudhunagar', 'Namakkal', 'Tenkasi', 'Mayiladuthurai', 'Thiruvarur', 'Udhagamandalam', 'Gudiyatham', 'Panruti', 'Mettur', 'Sankarankoil', 'Pattukkottai', 'Ramanathapuram', 'Arakkonam', 'Sirkazhi', 'Palani', 'Papanasam', 'Gobichettipalayam', 'Manapparai', 'Paramakudi', 'Tiruchengode', 'Karaikudi', 'Kovilpatti', 'Thiruvallur', 'Avadi', 'Tambaram', 'Tiruppur', 'Vaniyambadi', 'Ambattur', 'Chengalpattu', 'Sriperumbudur', 'Others'
];

const AccountD = ({ onBack }) => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		dateOfBirth: '',
		streetAddress: '',
		city: '',
		state: '',
	});

	const [errors, setErrors] = useState({});
	const [stateModalVisible, setStateModalVisible] = useState(false);
	const [cityModalVisible, setCityModalVisible] = useState(false);

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({
				...prev,
				[field]: ''
			}));
		}
	};

	const validateForm = () => {
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateForm()) {
			Alert.alert(
				'Success',
				'Account details saved successfully!',
				[{ text: 'OK' }]
			);
			console.log('Form Data:', formData);
		} else {
			Alert.alert(
				'Error',
				'Please fill in all required fields correctly.',
				[{ text: 'OK' }]
			);
		}
	};

	const InputField = ({ 
		icon, 
		label, 
		placeholder, 
		field, 
		keyboardType = 'default',
		multiline = false 
	}) => (
		<View style={styles.inputContainer}>
			<View style={styles.labelContainer}>
				<MaterialCommunityIcons name={icon} size={16} color="#6B7280" />
				<Text style={styles.inputLabel}>
					{label} <Text style={styles.required}>*</Text>
				</Text>
			</View>
			<TextInput
				style={[
					styles.textInput,
					multiline && styles.multilineInput,
					errors[field] && styles.errorInput,
					{ fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold' } // Force font family for input text
				]}
				placeholder={placeholder}
				placeholderTextColor="#A0A0A0"
				value={formData[field]}
				onChangeText={(value) => handleInputChange(field, value)}
				keyboardType={keyboardType}
				multiline={multiline}
				numberOfLines={multiline ? 3 : 1}
			/>
			{errors[field] && (
				<Text style={styles.errorText}>{errors[field]}</Text>
			)}
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={onBack}>
					<MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Account Details</Text>
			</View>
			<View style={styles.separator} />
			
			{/* Form Content */}
			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.formContainer}>
					
					{/* Name Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="account" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>Name</Text>
						</View>
						<TextInput
							style={[styles.textInput, errors.name && styles.errorInput]}
							placeholder="Enter your name"
							value={formData.name}
							onChangeText={(value) => handleInputChange('name', value)}
						/>
						{errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
					</View>

					{/* Email Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="email" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>Email Id</Text>
						</View>
						<TextInput
							style={[styles.textInput, errors.email && styles.errorInput]}
							placeholder="Enter email address"
							value={formData.email}
							onChangeText={(value) => handleInputChange('email', value)}
							keyboardType="email-address"
						/>
						{errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
					</View>

					{/* Date of Birth Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>Date of Birth</Text>
						</View>
						<TextInput
							style={[styles.textInput, errors.dateOfBirth && styles.errorInput]}
							placeholder="MM/DD/YYYY"
							value={formData.dateOfBirth}
							onChangeText={(value) => handleInputChange('dateOfBirth', value)}
						/>
						{errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
					</View>

					{/* Street Address Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="home" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>Street Address</Text>
						</View>
						<TextInput
							style={[styles.textInput, styles.multilineInput, errors.streetAddress && styles.errorInput]}
							placeholder="Enter your street address"
							value={formData.streetAddress}
							onChangeText={(value) => handleInputChange('streetAddress', value)}
							multiline={true}
							numberOfLines={3}
						/>
						{errors.streetAddress && <Text style={styles.errorText}>{errors.streetAddress}</Text>}
					</View>

					{/* City Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="city" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>City</Text>
						</View>
						<TextInput
							style={[styles.textInput, errors.city && styles.errorInput]}
							placeholder="Enter city"
							value={formData.city}
							onChangeText={(value) => handleInputChange('city', value)}
						/>
						{errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
					</View>

					{/* State Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="map" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>State</Text>
						</View>
						<TextInput
							style={[styles.textInput, errors.state && styles.errorInput]}
							placeholder="Enter state"
							value={formData.state}
							onChangeText={(value) => handleInputChange('state', value)}
						/>
						{errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
					</View>

					{/* Save Button */}
					<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
						<MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
						<Text style={styles.saveButtonText}>Save Changes</Text>
					</TouchableOpacity>

					{/* Bottom spacing */}
					<View style={styles.bottomSpacing} />
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF', // Pure white background
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
	content: {
		flex: 1,
	},
	formContainer: {
		paddingTop: 32,
		paddingHorizontal: 20,
	},
	inputContainer: {
		marginBottom: 28,
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
			fontSize: 17,
			backgroundColor: '#F5F5F5', // Light gray for input box
			color: '#212121',
			fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
		},
	multilineInput: {
		height: 80,
		textAlignVertical: 'top',
	},
	errorInput: {
		borderColor: '#EF4444',
	},
	errorText: {
		color: '#EF4444',
		fontSize: 13,
		marginTop: 6,
		fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
	},
	saveButton: {
		backgroundColor: '#3B82F6',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
		marginTop: 20,
		marginBottom: 100,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
	},
		saveButtonText: {
			color: '#FFFFFF',
			fontSize: 16,
			fontWeight: '600',
			fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
		},
	bottomSpacing: {
		height: 32,
	},
});

export default AccountD;