import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, TextInput, Alert, Modal, FlatList, BackHandler, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';

const SOUTH_INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
];
const TAMIL_NADU_CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore', 'Tirunelveli', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Kanchipuram', 'Nagercoil', 'Kumbakonam', 'Rajapalayam', 'Pudukkottai', 'Hosur', 'Ambur', 'Krishnagiri', 'Cuddalore', 'Tiruvannamalai', 'Pollachi', 'Nagapattinam', 'Viluppuram', 'Tirupur', 'Ariyalur', 'Perambalur', 'Dharmapuri', 'Virudhunagar', 'Namakkal', 'Tenkasi', 'Mayiladuthurai', 'Thiruvarur', 'Udhagamandalam', 'Gudiyatham', 'Panruti', 'Mettur', 'Sankarankoil', 'Pattukkottai', 'Ramanathapuram', 'Arakkonam', 'Sirkazhi', 'Palani', 'Papanasam', 'Gobichettipalayam', 'Manapparai', 'Paramakudi', 'Tiruchengode', 'Karaikudi', 'Kovilpatti', 'Thiruvallur', 'Avadi', 'Tambaram', 'Tiruppur', 'Ambattur', 'Chengalpattu', 'Sriperumbudur', 'Others'
];

const formatDateForSave = (date) => {
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const yyyy = date.getFullYear();
	return `${yyyy}-${mm}-${dd}`;
};

const formatDateForDisplay = (date) => {
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const yyyy = date.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
};

const parseStoredDate = (value) => {
	if (!value || typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim().split('T')[0];
	let parsedDate = null;

	if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
		const [year, month, day] = normalizedValue.split('-').map(Number);
		parsedDate = new Date(year, month - 1, day);
	} else if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalizedValue)) {
		const [month, day, year] = normalizedValue.split('/').map(Number);
		parsedDate = new Date(year, month - 1, day);
	} else if (/^\d{2}-\d{2}-\d{4}$/.test(normalizedValue)) {
		const [day, month, year] = normalizedValue.split('-').map(Number);
		parsedDate = new Date(year, month - 1, day);
	} else {
		const fallbackDate = new Date(normalizedValue);
		if (!Number.isNaN(fallbackDate.getTime())) {
			parsedDate = fallbackDate;
		}
	}

	return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
};

const AccountD = ({ onBack }) => {
	const navigation = useNavigation();
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		dateOfBirth: '',
		streetAddress: '',
		city: '',
		state: '',
		userImage: '',
	});

	const [errors, setErrors] = useState({});
	const [stateModalVisible, setStateModalVisible] = useState(false);
	const [cityModalVisible, setCityModalVisible] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [loading, setLoading] = useState(true);

	// Handle hardware back button to navigate back to profile page
	useEffect(() => {
		const backAction = () => {
			navigation.goBack(); 
			return true; 
		};

		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

		return () => backHandler.remove();
	}, [navigation]);

	useEffect(() => {
		const loadProfile = async () => {
			try {
				const response = await ApiService.getProfile();
				if (response.success && response.data?.user) {
					const user = response.data.user;
					const profile = response.data.profile || {};
					setFormData(prev => ({
						...prev,
						name: profile.name || user.name || user.username || '',
						email: profile.email || user.email || '',
						dateOfBirth: parseStoredDate(profile.dateOfBirth) ? formatDateForSave(parseStoredDate(profile.dateOfBirth)) : '',
						streetAddress: profile.streetAddress || '',
						city: profile.city || '',
						state: profile.state || '',
						userImage: profile.userImage || '',
					}));
				}
			} catch (error) {
				console.error('Failed to load account details:', error);
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, []);

	const handlePickProfileImage = async () => {
		try {
			const result = await launchImageLibrary({
				mediaType: 'photo',
				selectionLimit: 1,
				quality: 0.8,
			});

			if (result.didCancel || !result.assets || result.assets.length === 0) {
				return;
			}

			const selectedImage = result.assets[0]?.uri || '';
			if (selectedImage) {
				handleInputChange('userImage', selectedImage);
			}
		} catch (error) {
			console.error('Image picker error:', error);
			Alert.alert('Error', 'Unable to pick image from gallery.', [{ text: 'OK' }]);
		}
	};

	const openDatePicker = () => {
		const initialDate = parseStoredDate(formData.dateOfBirth) || new Date();
		setSelectedDate(initialDate);
		setShowDatePicker(true);
	};

	const handleDateChange = (event, pickedDate) => {
		if (event?.type === 'dismissed') {
			setShowDatePicker(false);
			return;
		}

		const nextDate = pickedDate || selectedDate;
		setShowDatePicker(false);
		handleInputChange('dateOfBirth', formatDateForSave(nextDate));
	};

	const handleIOSDateChange = (_event, pickedDate) => {
		if (pickedDate) {
			setSelectedDate(pickedDate);
		}
	};

	const confirmIOSDate = () => {
		handleInputChange('dateOfBirth', formatDateForSave(selectedDate));
		setShowDatePicker(false);
	};

	const cancelIOSDate = () => {
		setShowDatePicker(false);
	};

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
		const newErrors = {};
		
		if (!formData.name.trim()) newErrors.name = 'Name is required';
		if (!formData.email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email';
		}
		if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
		if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
		if (!formData.city.trim()) newErrors.city = 'City is required';
		if (!formData.state.trim()) newErrors.state = 'State is required';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateForm()) {
			ApiService.updateProfile({
				name: formData.name,
				email: formData.email,
				dateOfBirth: formData.dateOfBirth,
				streetAddress: formData.streetAddress,
				city: formData.city,
				state: formData.state,
				userImage: formData.userImage,
			})
				.then((response) => {
					if (response.success) {
						Alert.alert(
							'Success',
							'Account details saved successfully!',
						[{ text: 'OK', onPress: () => navigation.goBack() }]
					);
					return;
				}

					Alert.alert('Error', response.message || 'Failed to save account details.', [{ text: 'OK' }]);
				})
				.catch((error) => {
					console.error('Profile update error:', error);
					Alert.alert('Error', error.message || 'Failed to save account details.', [{ text: 'OK' }]);
				});
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

	// Modal styles
	const modalSheetStyle = {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: '#fff',
		// borderTopLeftRadius: 24,
		// borderTopRightRadius: 24,
		paddingHorizontal: 24,
		paddingTop: 18,
		paddingBottom: 0,
		minHeight: 320,
		maxHeight: '50%',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 8,
	};
	const modalTitleStyle = {
		fontSize: 19,
		fontWeight: 700,
		color: '#212121',
		fontFamily: 'Roboto',
	};
	const modalCloseStyle = {
		padding: 4,
	};
	const modalDividerStyle = {
		height: 1,
		backgroundColor: '#F0F0F0',
		marginBottom: 8,
	};
	const modalItemStyle = {
		paddingVertical: 16,
		
	};
	const modalItemTextStyle = {
		fontSize: 17,
		color: '#212121',
		fontFamily: 'Roboto',
	};

	return (
		<View style={styles.container}>
			<Header 
				title="Account Details"
				onBack={() => navigation.goBack()}
				showBackButton={true}
			/>
			
			{/* Form Content */}
			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.formContainer}>
					{loading && (
						<Text style={{ marginBottom: 16, color: '#6B7280' }}>Loading profile details...</Text>
					)}

					<View style={styles.imagePreviewContainer}>
						{formData.userImage ? (
							<Image source={{ uri: formData.userImage }} style={styles.imagePreview} />
						) : (
							<View style={styles.imagePlaceholder}>
								<MaterialCommunityIcons name="account" size={34} color="#FFFFFF" />
							</View>
						)}
						<Text style={styles.imagePreviewText}>Profile Image</Text>
						<TouchableOpacity style={styles.pickImageButton} onPress={handlePickProfileImage}>
							<MaterialCommunityIcons name="image-plus" size={18} color="#FFFFFF" />
							<Text style={styles.pickImageButtonText}>Choose from phone</Text>
						</TouchableOpacity>
					</View>
					
					{/* Name Field */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="account" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>Name</Text>
						</View>
						<TextInput
							style={[styles.textInput, errors.name && styles.errorInput]}
							placeholder="Enter your name"
							placeholderTextColor="#A0A0A0"
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
							placeholderTextColor="#A0A0A0"
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
						<TouchableOpacity
							style={[styles.datePickerButton, errors.dateOfBirth && styles.errorInput]}
							onPress={openDatePicker}
							activeOpacity={0.8}
						>
							<Text style={[styles.datePickerText, !formData.dateOfBirth && styles.placeholderText]}>
								{formData.dateOfBirth ? formatDateForDisplay(parseStoredDate(formData.dateOfBirth) || new Date()) : 'Select date of birth'}
							</Text>
							<MaterialCommunityIcons name="calendar-month-outline" size={20} color="#6B7280" />
						</TouchableOpacity>
						{errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
						{showDatePicker && (
							Platform.OS === 'ios' ? (
								<View style={styles.iosPickerContainer}>
									<View style={styles.iosPickerHeader}>
										<TouchableOpacity onPress={cancelIOSDate} style={styles.iosPickerButton}>
											<Text style={styles.iosPickerButtonText}>Cancel</Text>
										</TouchableOpacity>
										<Text style={styles.iosPickerTitle}>Select Date</Text>
										<TouchableOpacity onPress={confirmIOSDate} style={styles.iosPickerButton}>
											<Text style={[styles.iosPickerButtonText, { color: '#2842C4' }]}>Done</Text>
										</TouchableOpacity>
									</View>
									<DateTimePicker
										value={selectedDate}
										mode="date"
										display="spinner"
										onChange={handleIOSDateChange}
									/>
								</View>
							) : (
								<DateTimePicker
									value={selectedDate}
									mode="date"
									display="default"
									onChange={handleDateChange}
								/>
							)
						)}
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
							placeholderTextColor="#A0A0A0"
							value={formData.streetAddress}
							onChangeText={(value) => handleInputChange('streetAddress', value)}
							multiline={true}
							numberOfLines={3}
						/>
						{errors.streetAddress && <Text style={styles.errorText}>{errors.streetAddress}</Text>}
					</View>

					{/* City Field (Popup) */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="city" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>City</Text>
						</View>
						<TouchableOpacity
							style={styles.textInput}
							onPress={() => setCityModalVisible(true)}
							activeOpacity={0.7}
						>
							<Text style={{ color: formData.city ? '#6B7280' : '#A0A0A0', fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold', fontSize: 17 }}>
								{formData.city || 'Select city'}
							</Text>
						</TouchableOpacity>
						{errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
						<Modal
							visible={cityModalVisible}
							transparent
							animationType="slide"
							onRequestClose={() => setCityModalVisible(false)}
						>
							<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' }}>
								<View style={modalSheetStyle}>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
										<Text style={modalTitleStyle}>Select City</Text>
										<TouchableOpacity onPress={() => setCityModalVisible(false)} style={modalCloseStyle}>
											<MaterialCommunityIcons name="close" size={24} color="#212121" />
										</TouchableOpacity>
									</View>
									<View style={modalDividerStyle} />
									<FlatList
										data={TAMIL_NADU_CITIES}
										keyExtractor={item => item}
										renderItem={({ item }) => (
											<TouchableOpacity
												style={modalItemStyle}
												onPress={() => {
													handleInputChange('city', item);
													setCityModalVisible(false);
												}}
											>
												<Text style={modalItemTextStyle}>{item}</Text>
											</TouchableOpacity>
										)}
									/>
								</View>
							</View>
						</Modal>
					</View>

					{/* State Field (Popup) */}
					<View style={styles.inputContainer}>
						<View style={styles.labelContainer}>
							<MaterialCommunityIcons name="map" size={16} color="#6B7280" />
							<Text style={styles.inputLabel}>State</Text>
						</View>
						<TouchableOpacity
							style={styles.textInput}
							onPress={() => setStateModalVisible(true)}
							activeOpacity={0.7}
						>
							<Text style={{ color: formData.state ? '#6B7280' : '#A0A0A0', fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold', fontSize: 17 }}>
								{formData.state || 'Select state'}
							</Text>
						</TouchableOpacity>
						{errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
						<Modal
							visible={stateModalVisible}
							transparent
							animationType="slide"
							onRequestClose={() => setStateModalVisible(false)}
						>
							<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' }}>
								<View style={modalSheetStyle}>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
										<Text style={modalTitleStyle}>Select State</Text>
										<TouchableOpacity onPress={() => setStateModalVisible(false)} style={modalCloseStyle}>
											<MaterialCommunityIcons name="close" size={24} color="#212121" />
										</TouchableOpacity>
									</View>
									<View style={modalDividerStyle} />
									<FlatList
										data={SOUTH_INDIAN_STATES}
										keyExtractor={item => item}
										renderItem={({ item }) => (
											<TouchableOpacity
												style={modalItemStyle}
												onPress={() => {
													handleInputChange('state', item);
													setStateModalVisible(false);
												}}
											>
												<Text style={modalItemTextStyle}>{item}</Text>
											</TouchableOpacity>
										)}
									/>
								</View>
							</View>
						</Modal>
					</View>

					{/* Save Button */}
					<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
						<MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
						<Text style={styles.saveButtonText}>Save Changes</Text>
					</TouchableOpacity>
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
	imagePreviewContainer: {
		alignItems: 'center',
		marginBottom: 24,
	},
	imagePreview: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: '#E5E7EB',
	},
	pickImageButton: {
		marginTop: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: '#6B46C1',
	},
	pickImageButtonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '600',
		fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
	},
	imagePlaceholder: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: '#6B46C1',
		justifyContent: 'center',
		alignItems: 'center',
	},
	imagePreviewText: {
		marginTop: 10,
		fontSize: 13,
		color: '#6B7280',
		fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
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
			color: '#6B7280',
			fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
		},
		datePickerButton: {
			borderRadius: 12,
			paddingHorizontal: 16,
			paddingVertical: 14,
			backgroundColor: '#F5F5F5',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		datePickerText: {
			fontSize: 17,
			color: '#6B7280',
			fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
			flex: 1,
			paddingRight: 12,
		},
		placeholderText: {
			color: '#A0A0A0',
		},
		iosPickerContainer: {
			backgroundColor: '#FFFFFF',
			borderTopWidth: 1,
			borderTopColor: '#E5E7EB',
			paddingBottom: 8,
		},
		iosPickerHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: 16,
			paddingTop: 8,
			paddingBottom: 12,
		},
		iosPickerButton: {
			paddingVertical: 4,
			paddingHorizontal: 4,
		},
		iosPickerButtonText: {
			fontSize: 16,
			color: '#6B7280',
			fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
		},
		iosPickerTitle: {
			fontSize: 16,
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
		marginBottom: 20,
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
});

export default AccountD;