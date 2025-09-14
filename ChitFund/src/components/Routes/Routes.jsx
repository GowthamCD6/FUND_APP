import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "../Tab/Tab";
import AccountD from "../../pages/Profile/Page/AccountD";
// import IdentyV from "../../pages/Profile/Page/IdentyV";
import LinkBA from "../../pages/Profile/Page/LinkBA";
import Nominee from "../../pages/Profile/Page/Nominee";
import SecurPermis from "../../pages/Profile/Page/SecurPermis";
import AuthLoader from "../utils/authLoader";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Routes = () => {
    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Auth" component={AuthLoader} />
                <Stack.Screen name="Tab" component={TabNavigator} />
                <Stack.Screen name="AccountD" component={AccountD} />
                {/* <Stack.Screen name="IdentityV" component={IdentyV} /> */}
                <Stack.Screen name="LinkBA" component={LinkBA} />
                <Stack.Screen name="Nominee" component={Nominee} />
                <Stack.Screen name="SecurityPerm" component={SecurPermis} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default Routes;