import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Router from "./src/components/Routes/Routes";
import "react-native-get-random-values";
import { AuthProvider } from "./src/utils/AuthContext";

const AppContent = () => {

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