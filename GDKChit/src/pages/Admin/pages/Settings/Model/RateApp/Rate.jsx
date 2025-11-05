import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const RateModal = ({ visible, onClose }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [visible]);

  const handleRateNow = async () => {
    if (selectedRating === 0) {
      Alert.alert('Please Rate', 'Please select a rating before proceeding');
      return;
    }

    try {
      // For Android - Google Play Store
      const playStoreUrl = 'market://details?id=com.gdkchitfund.app';
      const webPlayStoreUrl = 'https://play.google.com/store/apps/details?id=com.gdkchitfund.app';
      
      // For iOS - App Store (if needed later)
      // const appStoreUrl = 'itms-apps://itunes.apple.com/app/id123456789';
      // const webAppStoreUrl = 'https://apps.apple.com/app/id123456789';

      const canOpen = await Linking.canOpenURL(playStoreUrl);
      
      if (canOpen) {
        await Linking.openURL(playStoreUrl);
      } else {
        // Fallback to web version
        await Linking.openURL(webPlayStoreUrl);
      }
      
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Unable to open app store. Please try again later.');
    }
  };

  const handleSkipForNow = () => {
    onClose();
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setSelectedRating(i)}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          <MaterialCommunityIcons
            name={i <= selectedRating ? 'star' : 'star-outline'}
            size={40}
            color={i <= selectedRating ? '#FFD700' : '#FFFFFF80'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const starAnimatedStyle = {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 1],
        }),
      },
      {
        rotate: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
          <View style={styles.gradientContainer}>
            {/* Decorative Stars */}
            <View style={styles.decorativeStars}>
              <Animated.View style={[styles.decorativeStar, starAnimatedStyle]}>
                <MaterialCommunityIcons name="star-four-points" size={20} color="#FFD70080" />
              </Animated.View>
              <Animated.View style={[styles.decorativeStar2, starAnimatedStyle]}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD70060" />
              </Animated.View>
              <Animated.View style={[styles.decorativeStar3, starAnimatedStyle]}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#FFD70040" />
              </Animated.View>
            </View>

            {/* Main Star Icon */}
            <Animated.View style={[styles.mainStarContainer, starAnimatedStyle]}>
              <View style={styles.starBurst}>
                <MaterialCommunityIcons name="star" size={80} color="#FFD700" />
                {/* Star burst rays */}
                {[...Array(8)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.starRay,
                      {
                        transform: [
                          { rotate: `${index * 45}deg` },
                          { translateY: -60 },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Rate Us Text */}
            <Text style={styles.rateUsTitle}>Rate Us</Text>

            {/* Description */}
            <Text style={styles.description}>
              Your Review matter to us, If you enjoy our app,{'\n'}
              Please review our app
            </Text>

            {/* Star Rating */}
            <View style={styles.starRatingContainer}>
              {renderStars()}
            </View>

            {/* Rate Now Button */}
            <TouchableOpacity
              style={styles.rateNowButton}
              onPress={handleRateNow}
              activeOpacity={0.9}
            >
              <Text style={styles.rateNowText}>Rate Now</Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipForNow}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradientContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#6B46C1',
  },
  
  // Decorative Stars
  decorativeStars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeStar: {
    position: 'absolute',
    top: 30,
    left: 40,
  },
  decorativeStar2: {
    position: 'absolute',
    top: 50,
    right: 50,
  },
  decorativeStar3: {
    position: 'absolute',
    bottom: 100,
    left: 30,
  },

  // Main Star
  mainStarContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBurst: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starRay: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: '#FFD70060',
    borderRadius: 1.5,
  },

  // Text Content
  rateUsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.9,
  },

  // Star Rating
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  starButton: {
    marginHorizontal: 5,
    padding: 5,
  },

  // Buttons
  rateNowButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rateNowText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default RateModal;
