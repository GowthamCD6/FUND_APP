import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "../Tab/UTab/Tab";
import AccountD from "../../pages/User/Pages/Profile/Page/AccountD";
import LinkBA from "../../pages/User/Pages/Profile/Page/LinkBA";
import Nominee from "../../pages/User/Pages/Profile/Page/Nominee";
import SecurPermis from "../../pages/User/Pages/Profile/Page/SecurPermis";
import AuthLoader from "../../utils/authLoader";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Welcome from "../../pages/Fronter/Welcome/Welcome";
import Login from "../../pages/Fronter/Login/Login";
import MemberDetails from "../../pages/Admin/pages/Reports/pages/MemberDetails/MemberDetails";

const Routes = () => {
    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Welcome" component={Welcome} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Tab" component={TabNavigator} />    
                <Stack.Screen name="Auth" component={AuthLoader} />
                <Stack.Screen name="AccountD" component={AccountD} />
                <Stack.Screen name="LinkBA" component={LinkBA} />
                <Stack.Screen name="Nominee" component={Nominee} />
                <Stack.Screen name="SecurityPerm" component={SecurPermis} />
                <Stack.Screen name="MembersDetails" component={MemberDetails} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default Routes;