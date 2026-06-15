import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "../Tab/UTab/UserTab";
import AccountD from "../../pages/User/Pages/Profile/Page/UserAccountDetails/AccountDetails";
import LinkBA from "../../pages/User/Pages/Profile/Page/LinkBankAccount/LinkBankAccount";
import Nominee from "../../pages/User/Pages/Profile/Page/UserNominee/Nominee";
import IdentityV from "../../pages/User/Pages/Profile/Page/Verification/IdentityVerification";
import SecurPermis from "../../pages/User/Pages/Profile/Page/SecurityLock/SecurityPermision";
import AdminSecurPermis from "../../pages/Admin/pages/Settings/pages/SecurityLock/SecurityPermision";
import AdminPasswordManagement from "../../pages/Admin/pages/Settings/pages/PasswordManagement/PasswordManagement";
import AdminBlockUserScreen from "../../pages/Admin/pages/Settings/pages/BlockUser/BlockUser";
import AdminUserLocation from "../../pages/Admin/pages/Settings/pages/UserLocation/UserL";
import AuthLoader from "../../utils/authLoader";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Welcome from "../../pages/Fronter/Welcome/Welcome";
import Login from "../../pages/Fronter/Login/Login";
import MemberDetails from "../../pages/Admin/pages/Reports/pages/MemberDetails/MemberDetails";
import Auction from "../../pages/Admin/pages/Settings/pages/Auction/Auction";
import AdminEditProfile from "../../pages/Admin/pages/Settings/pages/AccountDetails/EditProfile";
import AdminDataExport from "../../pages/Admin/pages/Settings/pages/DataExport/DataExport";
import NewGroup from "../../pages/Admin/pages/Chat/NewGroup/NewGroup";
import NewGroupDetails from "../../pages/Admin/pages/Chat/NewGroup/NewGroupDetails";
import { StatusBar } from "react-native";
import TabRouter from "../Tab/TabRouter";
import UserTabs from "../Tab/UTab/UserTab";
import AdminTab from "../Tab/ATab/AdminTab";

import UserPrivacyPolicy from "../../pages/User/Pages/Profile/Page/PrivacyPolicy/PrivacyPolicy";
import UserHelpSupport from "../../pages/User/Pages/Profile/Page/HelpAndSupport/Help&Support";
import UserMyLocation from "../../pages/User/Pages/Profile/Page/MyLocation/MyLocation";
import UserAdminLocation from "../../pages/User/Pages/Profile/Page/AdminLocation/AdminLocation";
import LanguageSettings from "../../pages/User/Pages/Profile/Page/LanguageSettings/LanguageSettings";

import { navigationRef } from "../../utils/navigation";

const Routes = () => {
    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer ref={navigationRef}>
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
                <Stack.Screen name="AdminSecurityPerm" component={AdminSecurPermis} />
                <Stack.Screen name="AdminPasswordManagement" component={AdminPasswordManagement} />
                <Stack.Screen name="AdminBlockUser" component={AdminBlockUserScreen} />
                <Stack.Screen name="AdminUserLocation" component={AdminUserLocation} />
                <Stack.Screen name="NewGroup" component={NewGroup} />
                <Stack.Screen name="NewGroupDetails" component={NewGroupDetails} />
                <Stack.Screen name="MembersDetails" component={MemberDetails} />
                <Stack.Screen name="AuctionSettings" component={Auction} />
                <Stack.Screen name="AdminEditProfile" component={AdminEditProfile} />
                <Stack.Screen name="AdminDataExport" component={AdminDataExport} />
                <Stack.Screen name="UserPrivacyPolicy" component={UserPrivacyPolicy} />
                <Stack.Screen name="UserHelpSupport" component={UserHelpSupport} />
                <Stack.Screen name="UserMyLocation" component={UserMyLocation} />
                <Stack.Screen name="UserAdminLocation" component={UserAdminLocation} />
                <Stack.Screen name="LanguageSettings" component={LanguageSettings} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default Routes;