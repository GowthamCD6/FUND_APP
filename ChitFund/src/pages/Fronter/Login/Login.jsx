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
import ApiService from '../../../services/ApiService.js';
import AuthContext from '../../../utils/AuthContext.js';

// Encryption key generation removed - using direct messaging
const Login = () => {
    const navigation = useNavigation();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setLoading] = useState(false);

    // const handleLogin = async () => {
    //     if (!phoneNumber || !password) {
    //         Alert.alert("Missing Info", "Please enter all required fields.");
    //         return;
    //     }

    //     setLoading(true);
    //     try {
    //         // ✅ If user entered email, use email as username for login
    //         const phone = phoneNumber;

    //         const response = await AuthContext.login(phone, password);
    //         if (!response.success) {
    //             throw new Error(response.message || "Login failed");
    //         }

    //         await AsyncStorage.setItem("userEmail", user.get("email") || "");
    //         await AsyncStorage.setItem("userName", user.get("username"));
    //         await AsyncStorage.setItem("userFullName", user.get("name") || "");
    //         await AsyncStorage.setItem("userState", user.get("state") || "");
    //         await AsyncStorage.setItem("userLoginMethod", "EmailPassword");

    //         navigation.reset({
    //             index: 0,
    //             routes: [{ name: "TabRouting" }],
    //         });
    //     } catch (error) {
    //         console.error("Login Error:", error);
    //         Alert.alert("Login Failed", error.message || "Invalid username or password.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            Alert.alert("Missing Info", "Please enter all required fields.");
            return;
        }
        
        // Check if admin credentials
        if(phoneNumber === '123456789' && password === 'abc'){
            await AsyncStorage.setItem('userPhone', phoneNumber);
            await AsyncStorage.setItem('userName', 'Admin');
            await AsyncStorage.setItem('userRole', 'admin');
            navigation.navigate('Tab', { role: 'admin' });
            return;
        }

        // Regular user login
        await AsyncStorage.setItem('userPhone', phoneNumber);
        await AsyncStorage.setItem('userName', 'User');
        await AsyncStorage.setItem('userRole', 'user');
        navigation.navigate('Tab', { role: 'user' });
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View>
                        <Text style={styles.hi}>Hi !</Text>
                        <Text style={styles.sectoptext}>Login to continue</Text>
                        <View style={[styles.logimg, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }]}>
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
                            <View style={{ height: 1, backgroundColor: '#E5E7EB', flex: 1 }} />
                            <Text style={{ marginHorizontal: 16, color: '#6B7280' }}>OR</Text>
                            <View style={{ height: 1, backgroundColor: '#E5E7EB', flex: 1 }} />
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