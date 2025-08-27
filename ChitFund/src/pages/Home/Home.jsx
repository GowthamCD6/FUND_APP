import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import styles from './Homesty';

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ஸ்ரீ பெரியநாயகி அம்மன் CHITFUNDS</Text>
          <Text style={styles.headerSubtitle}>Welcome to Home</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.contentText}>Home Page Content</Text>
          <Text style={styles.contentDescription}>
            This is your home page. Add your content here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
