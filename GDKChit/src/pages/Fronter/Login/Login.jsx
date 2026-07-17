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

    const passwordRef = useRef(null);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
    }, []);

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
        if (text && text.length < 0) {
            setPasswordError('Password must be at least 6 characters');
        } else {
            setPasswordError('');
        }
    };

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            Alert.alert("Missing Info", "Please enter all required fields.");
            return;
        }

        setLoading(true);
        
        try {
            const response = await login(phoneNumber, password);
            
            if (response.success) {
                const user = response.data.user;
                
                // Save user data to AsyncStorage
                await AsyncStorage.setItem("userPhone", String(user.phone));
                await AsyncStorage.setItem("userName", String(user.username));
                await AsyncStorage.setItem("userRole", String(user.role));
                await AsyncStorage.setItem("userId", String(user.id));
                
                // Navigate to home page based on role
                navigation.reset({
                    index: 0, 
                    routes: [{ name: "TabRouter", params: { role: user.role } }],
                });
            }
        } catch (error) {
            Alert.alert("Login Failed", error.message || "Invalid phone or password.");
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

                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                    style={styles.forgotPassword}
                                >
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>
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
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default Login;