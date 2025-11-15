import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Router from "./src/components/Routes/Routes";
import "react-native-get-random-values";
import { AuthProvider } from "./src/utils/AuthContext";
import BiometricService from "./src/services/BiometricService";
import SecurityLockScreen from "./src/pages/User/Pages/Profile/Page/SecurityLock/SecurityLockScreen";

const AppContent = () => {
  const [securityState, setSecurityState] = useState({
    isLocked: false,
    isSecurityEnabled: false,
    isLoading: true
  });

  useEffect(() => {
    // Initialize security state
    const initSecurity = async () => {
      const state = BiometricService.getState();
      setSecurityState({
        ...state,
        isLoading: false
      });
    };

    initSecurity();

    // Listen for security state changes
    const unsubscribe = BiometricService.addListener((state) => {
      setSecurityState(prev => ({
        ...prev,
        ...state
      }));
    });

    return unsubscribe;
  }, []);

  const handleUnlock = () => {
    BiometricService.unlockApp();
  };

  // Show lock screen if app is locked
  if (securityState.isLocked) {
    return <SecurityLockScreen onAuthenticationSuccess={handleUnlock} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container]}>
        <Router />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const App = () => {

  return (
    <AuthProvider>
      {/* <ThemeProvider> */}
        <AppContent />
      {/* </ThemeProvider> */}
    </AuthProvider> 
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;