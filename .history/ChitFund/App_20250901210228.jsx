
import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import Login from "./src/pages/Login/Login";
import Welcome from "./src/pages/Welcome/Welcome";
import Tab from "./src/components/Tab/Tab.jsx";

const App = () => {
  return (
    <NavigationContainer>
      <Tab />
    </NavigationContainer>
  );
};

export default App;