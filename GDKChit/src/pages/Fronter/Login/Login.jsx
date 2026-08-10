import {
    Text,
    View,
    Keyboard,
    Pressable,
    TouchableWithoutFeedback,
    ScrollView,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Animated,
    Platform,
    BackHandler,
    Modal,
} from 'react-native';
import styles from './Loginsty.jsx';
import { TextInput } from 'react-native-paper';
import React, { useRef, useState, useEffect } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
// Removed direct ApiService usage in favor of AuthContext hook
import { useAuth } from '../../../utils/AuthContext.js';
import Loginimg from '../../../assets/login/loginimg.svg';
import EyeOn from '../../../assets/login/eye-svgrepo-com.svg';
import EyeOff from '../../../assets/login/eye-slash-svgrepo-com.svg';
import Tickicon from '../../../assets/login/tick.svg';
import Tickbox from '../../../assets/login/tickbox.svg';
import Separator from '../../../assets/login/separator.svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const Login = () => {
    const navigation = useNavigation();
    const { login } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Error Modal states
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const passwordRef = useRef(null);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        const backAction = () => {
            if (errorModalVisible) {
                setErrorModalVisible(false);
                return true;
            }
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Welcome');
            }
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [errorModalVisible, navigation]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, scaleAnim]);

    const showErrorModal = (title, message) => {
        setErrorTitle(title);
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const validatePhone = (text) => {
        setPhoneNumber(text);
        if (text && text.length < 10) {
            setPhoneError('Phone number must be at least 10 digits');
        } else {
            setPhoneError('');
        }
    };

    const validatePassword = (text) => {
        setPassword(text);
        if (text && text.length < 4) {
            setPasswordError('Password must be at least 4 characters');
        } else {
            setPasswordError('');
        }
    };

    const handleLogin = async () => {
        if (isLoading) return;

        const cleanPhone = phoneNumber.trim();
        const cleanPassword = password.trim();

        if (!cleanPhone || !cleanPassword) {
            showErrorModal(
                "Missing Information ⚠️",
                "Please enter both your registered mobile number and password to log in."
            );
            return;
        }

        if (cleanPhone.length < 10) {
            showErrorModal(
                "Invalid Mobile Number 📱",
                "Mobile number must be at least 10 digits. Please check your mobile number and try again."
            );
            return;
        }

        setLoading(true);
        
        try {
            const response = await login(cleanPhone, cleanPassword);
            
            if (response.success) {
                const user = response.data.user;
                
                // Save user data to AsyncStorage
                await AsyncStorage.setItem("userPhone", String(user.phone));
                await AsyncStorage.setItem("userName", String(user.username));
                await AsyncStorage.setItem("userRole", String(user.role));
                await AsyncStorage.setItem("userId", String(user.id));
                
                // Navigate to home page based on role
                const isPlatformAdmin = String(user.role || '').toLowerCase() === 'admin';
                navigation.reset({
                    index: 0, 
                    routes: [{ name: isPlatformAdmin ? "AdminTabs" : "TabRouter", params: { role: user.role } }],
                });
            } else {
                showErrorModal(
                    "Invalid Credentials ❌",
                    response.message || "The mobile number or password you entered is incorrect. Please check your details and try again."
                );
            }
        } catch (error) {
            console.error('Login error:', error);
            showErrorModal(
                "Invalid Credentials ❌",
                error.message || "The mobile number or password you entered is incorrect. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <Animated.View 
                            style={[
                                styles.contentContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <View style={styles.headerContainer}>
                                <Text style={styles.hi}>Welcome Back!</Text>
                                <Text style={styles.sectoptext}>Login to continue your journey</Text>
                                <View style={styles.decorativeLine} />
                            </View>

                            <Animated.View 
                                style={[
                                    styles.imageContainer,
                                    { transform: [{ scale: scaleAnim }] }
                                ]}
                            >
                                <View style={styles.imageShadow}>
                                    <Loginimg height={200} width={520} style={styles.logimg} />
                                </View>
                            </Animated.View>

                            <View style={styles.inputcontainer}>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIconContainer}>
                                        <MaterialCommunityIcons name="phone" size={20} color="#2842C4" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        label="Mobile Number"
                                        value={phoneNumber}
                                        onChangeText={validatePhone}
                                        mode="outlined"
                                        activeOutlineColor="#2842C4"
                                        outlineColor="#E0E0E0"
                                        keyboardType="phone-pad"
                                        returnKeyType="next"
                                        onSubmitEditing={() => passwordRef.current?.focus()}
                                        blurOnSubmit={false}
                                        error={!!phoneError}
                                        theme={{
                                            colors: {
                                                primary: '#2842C4',
                                                error: '#FF4444',
                                            },
                                            roundness: 12,
                                        }}
                                    />
                                </View>
                                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                                <View style={styles.passwordWrapper}>
                                    <View style={styles.inputIconContainer}>
                                        <MaterialCommunityIcons name="lock-outline" size={20} color="#2842C4" />
                                    </View>
                                    <TextInput
                                        ref={passwordRef}
                                        style={styles.input}
                                        label="Password"
                                        value={password}
                                        onChangeText={validatePassword}
                                        mode="outlined"
                                        activeOutlineColor="#2842C4"
                                        outlineColor="#E0E0E0"
                                        secureTextEntry={!showPassword}
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                        error={!!passwordError}
                                        theme={{
                                            colors: {
                                                primary: '#2842C4',
                                                error: '#FF4444',
                                            },
                                            roundness: 12,
                                        }}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        {showPassword ? 
                                            <EyeOn width={24} height={24} /> : 
                                            <EyeOff width={24} height={24} />
                                        }
                                    </Pressable>
                                </View>
                                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                            </View>

                            <View style={styles.lowercontainer}>
                                <Pressable 
                                    style={styles.checkboxContainer} 
                                    onPress={() => setChecked(!checked)}
                                >
                                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                        {checked ? <Tickicon height={14} width={14} /> : <Tickbox height={14} width={14} />}
                                    </View>
                                    <Text style={styles.checkboxText}>
                                        I agree with the{' '}
                                        <Text style={styles.linkText}>Privacy Policy</Text>
                                    </Text>
                                </Pressable>

                                <TouchableOpacity
                                    style={[styles.pressablebtn, isLoading && { opacity: 0.7 }]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.btn}>
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Text style={styles.btntext}>LOGIN</Text>
                                                <MaterialCommunityIcons 
                                                    name="arrow-right" 
                                                    size={20} 
                                                    color="#FFFFFF" 
                                                    style={styles.arrowIcon}
                                                />
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {/* <View style={styles.signupContainer}>
                                    <Text style={styles.signupText}>Don't have an account? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                        <Text style={styles.signupLink}>Sign Up</Text>
                                    </TouchableOpacity>
                                </View> */}
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Custom Error Dialog Modal */}
                <Modal
                    visible={errorModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setErrorModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.errorIconCircle}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#DC2626" />
                            </View>
                            <Text style={styles.modalTitle}>{errorTitle}</Text>
                            <Text style={styles.modalMessage}>{errorMessage}</Text>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setErrorModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default Login;