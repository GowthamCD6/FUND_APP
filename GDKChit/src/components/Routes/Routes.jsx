import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "../Tab/UTab/UserTab";
import AccountD from "../../pages/User/Pages/Profile/Page/UserAccountDetails/AccountDetails";
import LinkBA from "../../pages/User/Pages/Profile/Page/LinkBankAccount/LinkBankAccount";
import Nominee from "../../pages/User/Pages/Profile/Page/UserNominee/Nominee";
import IdentityV from "../../pages/User/Pages/Profile/Page/Verification/IdentityVerification";
import SecurPermis from "../../pages/User/Pages/Profile/Page/SecurityLock/SecurityPermision";
import AuthLoader from "../../utils/authLoader";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Welcome from "../../pages/Fronter/Welcome/Welcome";
import Login from "../../pages/Fronter/Login/Login";
import MemberDetails from "../../pages/Admin/pages/Reports/pages/MemberDetails/MemberDetails";
import Auction from "../../pages/Admin/pages/Settings/pages/Auction/Auction";
import { StatusBar } from "react-native";
import TabRouter from "../Tab/TabRouter";
import UserTabs from "../Tab/UTab/UserTab";
import AdminTab from "../Tab/ATab/AdminTab";

const Routes = () => {
    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffffff" />
            <Stack.Navigator initialRouteName="AuthLoader" screenOptions={{ headerShown: false }}>

                <Stack.Screen name="Welcome" component={Welcome} />

                {/* Auth Tabs */}
                <Stack.Screen name="AuthLoader" component={AuthLoader} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="TabRouter" component={TabRouter} />

                {/* User Tabs */}
                <Stack.Screen name="UserTabs" component={UserTabs} />
                <Stack.Screen name="LinkBA" component={LinkBA} />

                {/* Admin Tabs */}
                <Stack.Screen name="AdminTabs" component={AdminTab} />

                <Stack.Screen name="AccountD" component={AccountD} />
                <Stack.Screen name="Nominee" component={Nominee} />
                <Stack.Screen name="IdentityV" component={IdentityV} />
                <Stack.Screen name="SecurityPerm" component={SecurPermis} />
                <Stack.Screen name="MembersDetails" component={MemberDetails} />
                <Stack.Screen name="AuctionSettings" component={Auction} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default Routes;