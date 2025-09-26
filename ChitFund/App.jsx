
import React from "react";
import Login from "./src/pages/Fronter/Login/Login.jsx";
import Welcome from "./src/pages/Fronter/Welcome/Welcome";
import Tab from "./src/components/Tab/UTab/Tab.jsx"
import { SafeAreaProvider } from "react-native-safe-area-context";
import Routes from "./src/components/Routes/Routes.jsx";
import { View } from "react-native";

const App = () => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Routes/>
      </View>
    </SafeAreaProvider>
    // <Tab/>
  );
};

export default App;