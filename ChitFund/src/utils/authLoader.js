import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

const AuthLoader = () => {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            const storedPhoneNumber = await AsyncStorage.getItem('userPhoneNumber');
            const storedRole = await AsyncStorage.getItem('userRole');
            setPhoneNumber(storedPhoneNumber);
            if (storedPhoneNumber) {
                // Navigate to main app screen with stored role
                const role = storedRole || 'user';
                console.log("User is logged in, navigating to main app with role:", role);
                navigation.navigate('Tab', { role })
            }
            else{
                navigation.navigate('Welcome')
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <View>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View>
            <Text>Welcome back, user!</Text>
        </View>
    );
};

export default AuthLoader;