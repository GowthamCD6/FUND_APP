import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
  BackHandler,
  ScrollView,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import ShareLocationInfo from './Share_info_modal/ShareLocationInfo';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';
import {
  getUserCurrentLocationWithFallback,
  checkLocationPermission,
  requestLocationPermission,
  formatCoordinates,
  generateMapDeepLink,
  storeLocationLocally,
  getStoredLocation,
  getAddressFromCoordinates,
  createLocationDataObject,
  storeLocationWithAddress,
  getStoredLocationWithAddress
} from '../../../../../../services/locationService';
import { LOCATION_CONFIG, isGeocodingAvailable } from '../../../../../../config/locationConfig';
import { useAuth } from '../../../../../../utils/AuthContext';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const MyLocation = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const { t, language } = useLanguage();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [savedToDatabase, setSavedToDatabase] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasSharedAddress, setHasSharedAddress] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showShareLocationInfo, setShowShareLocationInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkLocationPermissionStatus();
    setRefreshing(false);
  };

  console.log('MyLocation component rendered');

  useEffect(() => {
    console.log('MyLocation component mounted');
    initializeComponent();
    
    // Handle Android hardware back button
    const backAction = () => {
      console.log('Hardware back button pressed');
      if (showShareLocationInfo) {
        setShowShareLocationInfo(false);
        return true;
      }
      navigation.goBack();
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      console.log('MyLocation component unmounting');
      backHandler.remove();
    };
  }, [showShareLocationInfo, navigation]);

  useEffect(() => {
    if (authUser?.id || authUser?.userId) {
      checkLocationPermissionStatus();
    }
  }, [authUser?.id, authUser?.userId]);

  const initializeComponent = async () => {
    try {
      console.log('Initializing MyLocation component...');
      await checkLocationPermissionStatus();
      setPermissionChecked(true);
      setInitialLoad(false);
    } catch (error) {
      console.log('Initialization error:', error);
      setPermissionChecked(true);
      setInitialLoad(false);
    }
  };

  const checkLocationPermissionStatus = async () => {
    try {
      console.log('Checking location permission status...');
      const granted = await checkLocationPermission();
      console.log('Permission granted:', granted);
      setLocationEnabled(granted);

      if (authUser?.id || authUser?.userId) {
        try {
          console.log('Loading location from backend...');
          const backendResponse = await ApiService.getMyLocation();

          if (backendResponse?.success && backendResponse?.data?.location) {
            const backendLocation = backendResponse.data.location;
            const resolvedLatitude = Number(backendLocation.latitude);
            const resolvedLongitude = Number(backendLocation.longitude);

            const hydratedLocation = {
              latitude: resolvedLatitude,
              longitude: resolvedLongitude,
              accuracy: backendLocation.accuracy ?? null,
              timestamp: backendLocation.capturedAt || backendLocation.updatedAt || Date.now(),
            };

            setCurrentLocation(hydratedLocation);
            setAddress(backendLocation.address || formatCoordinates(resolvedLatitude, resolvedLongitude));
            setFullAddress(backendLocation.address || formatCoordinates(resolvedLatitude, resolvedLongitude));
            setSavedToDatabase(Boolean(backendLocation.savedToDatabase));
            setHasSharedAddress(true);
            setLastUpdated(
              backendLocation.updatedAt
                ? new Date(backendLocation.updatedAt)
                : backendLocation.capturedAt
                  ? new Date(backendLocation.capturedAt)
                  : new Date(),
            );
            return;
          }
        } catch (backendError) {
          console.log('Backend location load failed, falling back to local storage:', backendError);
        }
      }
      
      // Try to load saved location with address first
      console.log('Loading stored location data...');
      const savedLocationData = await getStoredLocationWithAddress();
      if (savedLocationData) {
        console.log('Found saved location data:', savedLocationData);
        setCurrentLocation(savedLocationData);
        setFullAddress(savedLocationData.address);
        setAddress(savedLocationData.address);
        setSavedToDatabase(savedLocationData.savedToDatabase || false);
        setHasSharedAddress(true);
      } else {
        // Fallback to basic stored location
        console.log('No saved location data, checking basic storage...');
        const storedLocation = await getStoredLocation();
        if (storedLocation) {
          console.log('Found basic stored location:', storedLocation);
          setCurrentLocation(storedLocation);
          setAddress(formatCoordinates(storedLocation.latitude, storedLocation.longitude));
          setHasSharedAddress(true);
        } else {
          console.log('No stored location data found');
          setHasSharedAddress(false);
        }
      }
    } catch (error) {
      console.log('Permission check error:', error);
      setLocationEnabled(false);
      setHasSharedAddress(false);
    }
  };

  // Main function to share house address - captures location when pressed
  const shareHouseAddress = async () => {
    try {
      setLoading(true);
      
      // Step 1: Check and request permission if needed
      console.log('Requesting location permission...');
      const hasPermission = await checkLocationPermission();
      
      if (!hasPermission) {
        console.log('No permission, requesting...');
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'To share your house address, we need access to your location. Please grant permission when prompted.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => shareHouseAddress() },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Get current location with fallback strategies
      console.log('Getting current location for address sharing...');
      const location = await getUserCurrentLocationWithFallback();
      
      const newLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp || Date.now(),
      };
      
      // Step 3: Update UI with location
      setCurrentLocation(newLocation);
      setLastUpdated(new Date());
      setLocationEnabled(true);
      
      // Step 4: Store location locally
      console.log('Storing location locally...');
      await storeLocationLocally(newLocation);
      
      // Step 5: Get address from coordinates
      console.log('Getting address from coordinates...');
      await getAddressFromCoordinatesLocal(newLocation.latitude, newLocation.longitude);
      
      // Step 6: Auto-save to database for admin navigation
      console.log('Auto-saving to database...');
      setTimeout(async () => {
        await saveLocationToDatabase();
        setHasSharedAddress(true);
        setLoading(false);
        
        Alert.alert(
          '🏠 House Address Shared!',
          'Your house address has been captured and saved successfully. Admins can now navigate to your location.',
          [{ text: 'Great!' }]
        );
      }, 2000);
      
    } catch (error) {
      console.log('Share address error:', error);
      setLoading(false);
      
      if (error.message === 'Location permission denied' || error.code === 1) {
        Alert.alert(
          'Permission Denied', 
          'Location permission was denied. Please enable location permission in device settings to share your address.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (error.code === 2) {
        Alert.alert('Location Unavailable', 'Unable to get your current location. Please make sure location services are enabled and try again.');
      } else if (error.code === 3) {
        Alert.alert(
          'Location Timeout', 
          'Location request timed out. This often happens indoors or in areas with poor GPS signal.\n\nTips:\n• Try going outside for better GPS signal\n• Make sure location services are enabled\n• Wait a moment and try again',
          [{ text: 'OK' }]
        );
      } else {
        console.log('Unhandled address sharing error:', error);
        Alert.alert('Error', `Failed to get your location: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  const requestLocationPermissionHandler = async () => {
    try {
      console.log('Requesting location permission...');
      
      if (Platform.OS === 'android') {
        // First check if permission is already granted
        const alreadyGranted = await checkLocationPermission();
        console.log('Already granted check result:', alreadyGranted);
        
        if (alreadyGranted) {
          setLocationEnabled(true);
          getCurrentLocation();
          return;
        }
        
        // Request permission
        console.log('Requesting permission from user...');
        const granted = await requestLocationPermission();
        console.log('Permission request result:', granted);
        
        if (granted) {
          setLocationEnabled(true);
          getCurrentLocation();
        } else {
          setLocationEnabled(false);
          Alert.alert(
            'Permission Required',
            'Location permission is required to capture your GPS location and address. Please grant permission when prompted or enable it manually in device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Try Again', 
                onPress: () => requestLocationPermissionHandler() 
              },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings() 
              }
            ]
          );
        }
      } else {
        // iOS handles permissions automatically through Info.plist
        console.log('iOS detected, setting location enabled...');
        setLocationEnabled(true);
        getCurrentLocation();
      }
    } catch (error) {
      console.log('Permission request error:', error);
      Alert.alert(
        'Permission Error',
        'There was an error requesting location permission. Please enable location permission manually in device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const getCurrentLocation = async () => {
    console.log('Getting current location...');
    setLoading(true);
    
    try {
      console.log('Calling getUserCurrentLocationWithFallback service...');
      const location = await getUserCurrentLocationWithFallback();
      console.log('Location service returned:', location);
      
      const newLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp || Date.now(),
      };
      
      console.log('Setting new location state:', newLocation);
      setCurrentLocation(newLocation);
      setLastUpdated(new Date());
      setLocationEnabled(true);
      setLoading(false);
      
      // Store location locally for offline access
      console.log('Storing location locally...');
      await storeLocationLocally(newLocation);
      
      // Get address from coordinates
      console.log('Getting address from coordinates...');
      getAddressFromCoordinatesLocal(newLocation.latitude, newLocation.longitude);
    } catch (error) {
      console.log('Location error:', error);
      setLoading(false);
      
      if (error.message === 'Location permission denied' || error.code === 1) {
        Alert.alert(
          'Permission Denied', 
          'Location permission was denied. Please enable location permission in device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (error.code === 2) {
        Alert.alert('Position Unavailable', 'Unable to get your current location. Please make sure location services are enabled and try again.');
      } else if (error.code === 3) {
        Alert.alert(
          'Location Timeout', 
          'Location request timed out. This often happens indoors or in areas with poor GPS signal.\n\nTips:\n• Try going outside for better GPS signal\n• Make sure location services are enabled\n• Wait a moment and try again',
          [{ text: 'OK' }]
        );
      } else {
        console.log('Unhandled location error:', error);
        Alert.alert('Error', `Failed to get your location: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  const getAddressFromCoordinatesLocal = async (latitude, longitude) => {
    try {
      console.log('Getting address from coordinates:', latitude, longitude);
      // Check if geocoding is available
      if (isGeocodingAvailable()) {
        console.log('Geocoding is available, using Google Maps API...');
        const address = await getAddressFromCoordinates(
          latitude, 
          longitude, 
          LOCATION_CONFIG.GOOGLE_MAPS_API_KEY
        );
        console.log('Received address:', address);
        setFullAddress(address);
        setAddress(address);
      } else {
        // Use coordinate format as fallback
        console.log('Geocoding not available, using coordinates as fallback');
        const coordAddress = `${formatCoordinates(latitude, longitude)}`;
        setFullAddress(coordAddress);
        setAddress(coordAddress);
      }
    } catch (error) {
      console.log('Address fetch error:', error);
      const coordAddress = `${formatCoordinates(latitude, longitude)}`;
      setAddress(coordAddress);
      setFullAddress(coordAddress);
    }
  };

  const handleLocationToggle = (value) => {
    if (value) {
      // User wants to enable location
      if (!locationEnabled) {
        // Request permission first
        requestLocationPermissionHandler();
      } else {
        // Permission already granted, just get location
        getCurrentLocation();
      }
    } else {
      // User wants to disable location
      setLocationEnabled(false);
      setCurrentLocation(null);
      setLastUpdated(null);
      setAddress('');
      setFullAddress('');
      setSavedToDatabase(false);
    }
  };

  const shareLocation = () => {
    if (!currentLocation) return;
    
    const { latitude, longitude } = currentLocation;
    const message = `My current location: ${formatCoordinates(latitude, longitude)}\n\nView on Maps: https://maps.google.com/maps?q=${latitude},${longitude}`;
    
    Share.share({
      message,
      title: 'My Location',
    });
  };

  const openInMaps = () => {
    if (!currentLocation) return;
    
    const { latitude, longitude } = currentLocation;
    const url = generateMapDeepLink(latitude, longitude, Platform);
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application.');
    });
  };

  const formatDate = (date) => {
    return date ? date.toLocaleTimeString() : 'Never';
  };

  // Function to save location to database for admin navigation
  const saveLocationToDatabase = async () => {
    if (!currentLocation || !fullAddress) {
      Alert.alert('Error', 'Please capture your location first before saving.');
      return;
    }

    const userId = authUser?.id || authUser?.userId;

    if (!userId) {
      Alert.alert('Login Required', 'Please sign in again to save your location.');
      return;
    }

    setSavingLocation(true);
    
    try {
      // Create comprehensive location data
      const locationData = createLocationDataObject(
        currentLocation,
        fullAddress,
        userId
      );

      const result = await ApiService.saveMyLocation({
        ...locationData,
        savedToDatabase: true,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to save location');
      }

      const savedLocation = result?.data?.location || locationData;

      setSavedToDatabase(true);

      await storeLocationWithAddress({
        ...savedLocation,
        savedToDatabase: true,
        savedAt: new Date().toISOString(),
      });

      Alert.alert(
        'Location Saved Successfully!',
        'Your location has been saved to the database. Admins can now navigate to your address using Google Maps.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('Save location error:', error);
      await storeLocationWithAddress({
        ...createLocationDataObject(currentLocation, fullAddress, userId),
        savedToDatabase: false,
        pendingSync: true,
        savedAt: new Date().toISOString(),
      });
      Alert.alert(
        'Save Failed',
        error.message || 'Failed to save location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSavingLocation(false);
    }
  };

  // Function to update location (capture new location and save to database)
  const captureAndSaveLocation = async () => {
    try {
      // First get current location
      await getCurrentLocation();
      
      // Wait a moment for address to be fetched
      setTimeout(() => {
        // Auto-save to database after location is captured
        saveLocationToDatabase();
      }, 2000);
    } catch (error) {
      console.log('Capture and save error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="My Location"
        onBack={() => {
          console.log('Back button pressed in MyLocation');
          navigation.goBack();
        }}
        showBackButton={true}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        <View style={styles.formContainer}>
          {/* Lottie Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../../../../../animation/Share_Location.json')}
              autoPlay={true}
              loop={true}
              speed={0.7}
              resizeMode="contain"
              style={styles.lottieAnimation}
            />
          </View>

          {/* Share Address Card */}
          {!hasSharedAddress && !loading && (
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                <Text style={[styles.inputLabel, language === 'ta' && { fontSize: 14 }]}>{t('Share Your House Address')}</Text>
              </View>
              <View style={styles.shareAddressCard}>
                <Text style={[styles.shareAddressCardTitle, language === 'ta' && { fontSize: 12 }]}>{t('Help us locate your house for better service delivery')}</Text>
                <TouchableOpacity 
                  style={styles.shareAddressButton}
                  onPress={shareHouseAddress}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="map-marker-plus" size={20} color="#ffffff" />
                  <Text style={[styles.shareAddressButtonText, language === 'ta' && { fontSize: 13 }]}>
                    {loading ? t('Getting Location...') : t('Share My Address')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* How This Function Works Button */}
          {!hasSharedAddress && !loading && (
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => setShowShareLocationInfo(true)}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#3B82F6" />
              <Text style={[styles.helpButtonText, language === 'ta' && { fontSize: 12 }]}>{t('How this function works')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={[styles.loadingTitle, language === 'ta' && { fontSize: 16 }]}>{t('Getting Your Location...')}</Text>
            <Text style={styles.loadingSubtitle}>
              {loading ? 'Trying multiple GPS strategies for best results...\nThis may take up to 30 seconds.' : 'Please make sure GPS is enabled and you\'re in a location with good signal'}
            </Text>
          </View>
        )}

        {/* Success State - Address Shared */}
        {hasSharedAddress && currentLocation && (
          <View style={styles.successContent}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={24} 
                color="#4CAF50" 
              />
              <Text style={[styles.cardTitle, language === 'ta' && { fontSize: 16 }]}>{t('Address Shared Successfully!')}</Text>
            </View>
            
            <View style={styles.successSection}>
              <View style={styles.addressDisplay}>
                {fullAddress ? (
                  <View style={styles.addressRow}>
                    <MaterialCommunityIcons 
                      name="map-marker" 
                      size={18} 
                      color="#4CAF50" 
                    />
                    <Text style={styles.fullAddressText}>{fullAddress}</Text>
                  </View>
                ) : (
                  <View style={styles.coordinatesRow}>
                    <MaterialCommunityIcons 
                      name="crosshairs-gps" 
                      size={16} 
                      color="#666" 
                    />
                    <Text style={styles.coordinatesText}>
                      {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={16} 
                    color="#666" 
                  />
                  <Text style={styles.timeText}>
                    Shared: {formatDate(lastUpdated)}
                  </Text>
                </View>
                
                {savedToDatabase && (
                  <View style={styles.databaseStatus}>
                    <MaterialCommunityIcons name="database-check" size={16} color="#4CAF50" />
                    <Text style={styles.databaseStatusText}>{t('Saved to database')}</Text>
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={styles.updateAddressButton}
                  onPress={shareHouseAddress}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color="#4CAF50" />
                  <Text style={[styles.updateAddressButtonText, language === 'ta' && { fontSize: 13 }]}>{t('Update Address')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shareLocationButton}
                  onPress={shareLocation}
                >
                  <MaterialCommunityIcons name="share" size={18} color="#2196F3" />
                  <Text style={[styles.shareLocationButtonText, language === 'ta' && { fontSize: 13 }]}>{t('Share')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.openMapsButton}
                  onPress={openInMaps}
                >
                  <MaterialCommunityIcons name="map" size={18} color="#FF9800" />
                  <Text style={[styles.openMapsButtonText, language === 'ta' && { fontSize: 13 }]}>{t('Maps')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Information Card */}
        <View style={styles.infoContent}>
          <MaterialCommunityIcons 
            name="information-outline" 
            size={20} 
            color="#2196F3" 
          />
          <Text style={styles.infoText}>
            {hasSharedAddress 
              ? t('Your house address has been shared successfully. Admins can now navigate to your location when needed.')
              : t('Share your house address to help our team locate your house for better service delivery. Your location data is kept secure and private.')
            }
          </Text>
        </View>
      </ScrollView>

      {/* Share Location Info Modal */}
      <ShareLocationInfo 
        visible={showShareLocationInfo}
        onClose={() => setShowShareLocationInfo(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white background
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  lottieAnimation: {
    width: 370,
    height: 280,
    marginTop: -40,
    marginBottom: -60,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  shareAddressCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
  },
  shareAddressCardTitle: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  shareAddressButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  shareAddressButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  helpButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 10,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 12,
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  // Loading Content Styles (no card)
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 30,
    width: '100%',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  // Success Content Styles
  successContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  successSection: {
    marginTop: 8,
  },
  addressDisplay: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  fullAddressText: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  databaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  databaseStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  updateAddressButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateAddressButtonText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  shareLocationButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareLocationButtonText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  openMapsButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapsButtonText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  // Info Content Styles (no card)
  infoContent: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  infoButton: {
    padding: 4,
    marginLeft: 'auto',
  },

});

export default MyLocation;