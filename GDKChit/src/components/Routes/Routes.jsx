import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
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
import SplashScreen from "../../pages/Fronter/Splash/Splash";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import Welcome from "../../pages/Fronter/Welcome/Welcome";
import Login from "../../pages/Fronter/Login/Login";
import MemberDetails from "../../pages/Admin/pages/Reports/pages/MemberDetails/MemberDetails";
import Auction from "../../pages/Admin/pages/Settings/pages/Auction/Auction";
import UserAuctionScreen from "../../pages/User/Modals/Pages/Auction/Auction";
import AdminEditProfile from "../../pages/Admin/pages/Settings/pages/AccountDetails/EditProfile";
import NewGroup from "../../pages/Admin/pages/Chat/NewGroup/NewGroup";
import NewGroupDetails from "../../pages/Admin/pages/Chat/NewGroup/NewGroupDetails";
import AdminNotification from "../../pages/Admin/pages/Notification/Notification";
import { StatusBar, View } from "react-native";
import TabRouter from "../Tab/TabRouter";
import UserTabs from "../Tab/UTab/UserTab";
import AdminTab from "../Tab/ATab/AdminTab";

import UserPrivacyPolicy from "../../pages/User/Pages/Profile/Page/PrivacyPolicy/PrivacyPolicy";
import UserHelpSupport from "../../pages/User/Pages/Profile/Page/HelpAndSupport/Help&Support";
import UserMyLocation from "../../pages/User/Pages/Profile/Page/MyLocation/MyLocation";
import UserAdminLocation from "../../pages/User/Pages/Profile/Page/AdminLocation/AdminLocation";
import LanguageSettings from "../../pages/User/Pages/Profile/Page/LanguageSettings/LanguageSettings";
import OTPRequests from "../../pages/User/Pages/Profile/Page/OTPRequests/OTPRequests";

import { navigationRef } from "../../utils/navigation";

const AdminDataExport = props => {
    const DataExportScreen = require("../../pages/Admin/pages/Settings/pages/DataExport/DataExport").default;
    return <DataExportScreen {...props} />;
};

const withSafe = (Component, bgColor = '#ffffffff') => {
    return (props) => (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['top', 'left', 'right']}>
            <Component {...props} />
        </SafeAreaView>
    );
};

const Routes = () => {
    const Stack = createNativeStackNavigator();
    const [currentRouteName, setCurrentRouteName] = useState('AuthLoader');

    const updateCurrentRoute = () => {
        const routeName = navigationRef.getCurrentRoute()?.name || 'AuthLoader';
        setCurrentRouteName(routeName);
    };

    const isHomeRoute = currentRouteName === 'Home';
    return (
        <NavigationContainer
            ref={navigationRef}
            onReady={updateCurrentRoute}
            onStateChange={updateCurrentRoute}
        >
            <StatusBar
                barStyle={isHomeRoute ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent={true}
            />
            <View style={{ flex: 1, backgroundColor: '#1A0C38' }}>
                <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 400 }}>

                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Welcome" component={withSafe(Welcome)} />

                    {/* Auth Tabs */}
                    <Stack.Screen name="AuthLoader" component={AuthLoader} />
                    <Stack.Screen name="Login" component={withSafe(Login)} />
                    <Stack.Screen name="TabRouter" component={TabRouter} />

                    {/* User Tabs */}
                    <Stack.Screen name="UserTabs" component={UserTabs} />
                    <Stack.Screen name="LinkBA" component={withSafe(LinkBA)} />

                    {/* Admin Tabs */}
                    <Stack.Screen name="AdminTabs" component={withSafe(AdminTab)} />

                    <Stack.Screen name="AccountD" component={withSafe(AccountD)} />
                    <Stack.Screen name="Nominee" component={withSafe(Nominee)} />
                    <Stack.Screen name="IdentityV" component={withSafe(IdentityV)} />
                    <Stack.Screen name="SecurityPerm" component={withSafe(SecurPermis)} />
                    <Stack.Screen name="AdminSecurityPerm" component={withSafe(AdminSecurPermis)} />
                    <Stack.Screen name="AdminPasswordManagement" component={withSafe(AdminPasswordManagement)} />
                    <Stack.Screen name="AdminBlockUser" component={withSafe(AdminBlockUserScreen)} />
                    <Stack.Screen name="AdminUserLocation" component={withSafe(AdminUserLocation)} />
                    <Stack.Screen name="AdminNotification" component={withSafe(AdminNotification)} />
                    <Stack.Screen name="NewGroup" component={withSafe(NewGroup)} />
                    <Stack.Screen name="NewGroupDetails" component={withSafe(NewGroupDetails)} />
                    <Stack.Screen name="MembersDetails" component={withSafe(MemberDetails)} />
                    <Stack.Screen name="AuctionSettings" component={withSafe(Auction)} />
                    <Stack.Screen name="AuctionScreen" component={withSafe(UserAuctionScreen)} />
                    <Stack.Screen name="AdminEditProfile" component={withSafe(AdminEditProfile)} />
                    <Stack.Screen name="AdminDataExport" component={withSafe(AdminDataExport)} />
                    <Stack.Screen name="UserPrivacyPolicy" component={withSafe(UserPrivacyPolicy)} />
                    <Stack.Screen name="UserHelpSupport" component={withSafe(UserHelpSupport)} />
                    <Stack.Screen name="UserMyLocation" component={withSafe(UserMyLocation)} />
                    <Stack.Screen name="UserAdminLocation" component={withSafe(UserAdminLocation)} />
                    <Stack.Screen name="LanguageSettings" component={withSafe(LanguageSettings)} />
                    <Stack.Screen name="OTPRequests" component={withSafe(OTPRequests)} />
                </Stack.Navigator>
            </View>
        </NavigationContainer>
    )
}

export default Routes;