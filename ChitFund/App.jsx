
import React from "react";
import Login from "./src/pages/Login/Login";
import Welcome from "./src/pages/Welcome/Welcome";
import Tab from "./src/components/Tab/Tab.jsx"
import { SafeAreaProvider } from "react-native-safe-area-context";
import Routes from "./src/components/Routes/Routes.jsx";
import { View } from "react-native";

const App = () => {
  return (
    // <SafeAreaProvider>
    //   <View style={{ flex: 1 }}>
    //     <Routes/>
    //   </View>
    // </SafeAreaProvider>
    <Tab/>
  );
};

export default App;