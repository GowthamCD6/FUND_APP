import React, { useEffect, useState } from "react";
import { StyleSheet, Alert } from "react-native";
import { SafeAreaProvider, initialWindowMetrics, SafeAreaView } from "react-native-safe-area-context";
import Router from "./src/components/Routes/Routes";
import "react-native-get-random-values";
import { AuthProvider } from "./src/utils/AuthContext";
import { LanguageProvider } from "./src/utils/LanguageContext";
import BiometricService from "./src/services/BiometricService";
import PushNotificationService from "./src/services/PushNotificationService";
import SecurityLockScreen from "./src/pages/User/Pages/Profile/Page/SecurityLock/SecurityLockScreen";
import { AuctionProvider } from "./src/utils/AuctionContext";
import GlobalAuctionModal from "./src/components/GlobalAuctionModal/GlobalAuctionModal";
import GlobalErrorBoundary from "./src/components/GlobalErrorBoundary/GlobalErrorBoundary";

const AppContent = () => {
  const [securityState, setSecurityState] = useState({
    isLocked: false,
    isSecurityEnabled: false,
    isLoading: false
  });

  useEffect(() => {
    console.log('App.jsx: Starting security & push notification initialization...');

    // Initialize Push Notifications
    PushNotificationService.init();

    // Initialize security state
    const initSecurity = async () => {
      try {
        console.log('App.jsx: Calling BiometricService.init()');
        // Ensure BiometricService is fully initialized
        await BiometricService.init();

        // Small delay to ensure async storage is read
        await new Promise(resolve => setTimeout(resolve, 100));

        const state = BiometricService.getState();
        console.log('App.jsx: Initial security state received:', state);

        setSecurityState({
          ...state,
          isLoading: false
        });
      } catch (error) {
        console.error('App.jsx: Error during security initialization:', error);
        setSecurityState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initSecurity();

    // Listen for security state changes
    const unsubscribe = BiometricService.addListener((state) => {
      console.log('App.jsx: Security state changed:', state);
      setSecurityState(prev => ({
        ...prev,
        ...state
      }));
    });

    return unsubscribe;
  }, []);

  const handleUnlock = () => {
    console.log('App.jsx: Unlock button pressed');
    BiometricService.unlockApp();
  };

  console.log('App.jsx: Current state:', securityState);

  // Show lock screen if app is locked
  if (securityState.isLocked) {
    console.log('App.jsx: Showing SecurityLockScreen');
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SecurityLockScreen onAuthenticationSuccess={handleUnlock} />
      </SafeAreaProvider>
    );
  }

  console.log('App.jsx: Showing main Router');
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Router />
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <GlobalErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AuctionProvider>
            {/* <ThemeProvider> */}
            <AppContent />
            <GlobalAuctionModal />
            {/* </ThemeProvider> */}
          </AuctionProvider>
        </AuthProvider>
      </LanguageProvider>
    </GlobalErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;