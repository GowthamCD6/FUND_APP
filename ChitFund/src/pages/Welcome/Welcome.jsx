import {Text, TouchableOpacity, View, ScrollView} from 'react-native';
import LottieView from 'lottie-react-native';
import styles from '../Welcome/Welcomesty.jsx';
import React from 'react';
// import { useNavigation } from '@react-navigation/native';

const Welcome = () => {
  // const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ஸ்ரீ பெரியநாயகி அம்மன் CHITFUNDS</Text>

      <LottieView
        // source={require('../../animation/Welcome-page.json')}
        source={require('../../animation/Revenue.json')}
        autoPlay
        loop={false}
        style={{width: 290, height: 300,  backgroundColor: 'transparent',}}
          resizeMode="contain" 
      />

      <Text style={styles.mainText}>Hello !</Text>

      <Text style={styles.text2}>
        Welcome back! Please log {'\n'}in to continue
      </Text>

      <TouchableOpacity
        style={styles.pressablebtn}
        onPress={() => navigation.navigate('Login')}>
        <View style={styles.btn}>
          <Text style={styles.btntext}>LOGIN</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Welcome;
