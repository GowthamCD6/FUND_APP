import {
    SafeAreaView,
    Text,
    View,
    Keyboard,
    Pressable,
    TouchableWithoutFeedback,
    ScrollView,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import styles from './Loginsty.jsx';
import { TextInput } from 'react-native-paper';
import React, { useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Encryption key generation removed - using direct messaging
const Login = () => {
    const navigation = useNavigation();
    // Reference credentials (not defaulted in UI)
    const USER_PHONE = '987654321';
    const USER_PASSWORD = 'abc';
    const ADMIN_PHONE = '123456789';
    const ADMIN_PASSWORD = 'abc';
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        // --- VALIDATION LOGIC START ---

        // 1. Check if Mobile Number is empty
        if (!phoneNumber.trim()) {
            Alert.alert("Login Error", "Please enter your mobile number.");
            return; 
        }

        // 2. Check if Password is empty
        if (!password) {
            Alert.alert("Login Error", "Please enter your password.");
            return; 
        }
        
        // 3. Check if Privacy Policy is accepted
        if (!checked) {
            Alert.alert("Privacy Policy", "Please accept the Privacy Policy to continue.");
            return; 
        }

        // --- VALIDATION LOGIC END ---

        // If all checks pass, proceed with the login process
        setIsLoading(true);

        await AsyncStorage.setItem('userPhoneNumber', phoneNumber);
        // Your API call logic would go here.
        // For demonstration, I'll simulate a network request.
        console.log("Attempting to log in with:", { phoneNumber, password });
        let role = 'user';
        if (phoneNumber === ADMIN_PHONE && password === ADMIN_PASSWORD) {
            role = 'admin';
            console.log('Admin login detected, setting role to admin');
        }
        // Store the user role in AsyncStorage
        await AsyncStorage.setItem('userRole', role);
        console.log('Navigating with role:', role);
        
        setTimeout(() => {
            setIsLoading(false);
            navigation.navigate('Tab', { role });
        }, 1000); 
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View>
                        <Text style={styles.hi}>Hi !</Text>
                        <Text style={styles.sectoptext}>Login to continue</Text>
                        <View style={[styles.logimg, {justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6'}]}>
                            <MaterialCommunityIcons name="account-circle" size={120} color="#6B46C1" />
                        </View>

                        <View style={styles.inputcontainer}>
                            <TextInput
                                style={styles.input}
                                label="Mobile"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                mode="outlined"
                                activeOutlineColor="#2842C4"
                                keyboardType="phone-pad"
                            />
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.input}
                                    label="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    mode="outlined"
                                    activeOutlineColor="#2842C4"
                                    secureTextEntry={!showPassword}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: 22,
                                    }}
                                >
                                    <MaterialCommunityIcons 
                                        name={showPassword ? 'eye' : 'eye-off'} 
                                        size={24} 
                                        color="#6B7280" 
                                    />
                                </Pressable>
                            </View> 
                        </View>

                        <Pressable style={styles.checkboxContainer} onPress={() => setChecked(!checked)}>
                            <MaterialCommunityIcons 
                                name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                                size={18} 
                                color={checked ? '#6B46C1' : '#6B7280'} 
                            />
                            <Text style={styles.checkboxText}>I agree with the Privacy Policy</Text>
                        </Pressable>

                        <TouchableOpacity 
                            style={[styles.pressablebtn, isLoading && { opacity: 0.7 }]} 
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <View style={styles.btn}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.btntext}>LOGIN</Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        <View style={styles.separator}>
                            <View style={{height: 1, backgroundColor: '#E5E7EB', flex: 1}} />
                            <Text style={{marginHorizontal: 16, color: '#6B7280'}}>OR</Text>
                            <View style={{height: 1, backgroundColor: '#E5E7EB', flex: 1}} />
                        </View>
                        <Text style={styles.googletext}>Login with Google</Text>

                        <Pressable style={styles.googleauthcontainer}>
                            <MaterialCommunityIcons name="google" size={18} color="#DB4437" style={styles.googleicon} />
                            <Text style={styles.googleauthtext}>Continue with Google</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default Login;