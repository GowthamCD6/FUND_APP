import React from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminTab from "./ATab/AdminTab";
import UserTabs from "./UTab/UserTab";

export default function TabRouter({ route }) {
  const role = route?.params?.role || 'user';
  
  console.log('TabNavigator received role:', role);
  
  if (String(role).toLowerCase() === 'admin') {
    return (
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor: '#ffffff',
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 
        }} 
        edges={Platform.OS === 'android' ? ['left', 'right'] : ['top', 'left', 'right']}
      >
        <AdminTab />
      </SafeAreaView>
    );
  }
  return <UserTabs />;
}