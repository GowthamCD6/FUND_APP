import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';

/**
 * A reusable "Under Construction" screen component.
 * @param {object} props - The component's props.
 * @param {function} props.onBack - A function to be called when the back button is pressed.
 * @param {string} [props.pageName="This Page"] - The name of the page that is under construction.
 */
const UnderConstruction = ({ onBack, pageName = "This Page" }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F4F4" />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <LottieView
            source={require('../../../animation/Maintenance web.json')}
            autoPlay
            loop
            style={{ width: 460, height: 260, marginRight: 90 }}
          />
        </View>

        <Text style={styles.title}>Under Construction</Text>

        <Text style={styles.message}>
          We're working hard to bring you something amazing. {"\n"}
          {pageName} is not quite ready yet.
        </Text>

        <Text style={styles.subMessage}>
          Please check back later!
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 90,
    marginTop: -70,
  },
  iconContainer: {
    padding: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24, 
  },
  subMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UnderConstruction;