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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getUserCurrentLocation,
  getUserCurrentLocationWithFallback,
  checkLocationPermission,
  requestLocationPermission,
  formatCoordinates,
  generateMapDeepLink,
  storeLocationLocally,
  getStoredLocation,
  getAddressFromCoordinates,
  saveLocationToBackend,
  createLocationDataObject,
  storeLocationWithAddress,
  getStoredLocationWithAddress
} from '../../../../../../services/locationService';
import { LOCATION_CONFIG, isGeocodingAvailable, getBackendEndpoint } from '../../../../../../config/locationConfig';

const MyLocation = ({ onBack, animatedValue }) => {
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

  console.log('MyLocation component rendered');

  useEffect(() => {
    console.log('MyLocation component mounted');
    initializeComponent();
    
    // Handle Android hardware back button
    const backAction = () => {
      console.log('Hardware back button pressed');
      if (onBack) {
        console.log('Calling onBack from hardware button...');
        onBack();
        return true; // Prevent default back action
      }
      console.log('No onBack function available for hardware button');
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      console.log('MyLocation component unmounting');
      backHandler.remove();
    };
  }, [onBack]);

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

    setSavingLocation(true);
    
    try {
      // Create comprehensive location data
      const locationData = createLocationDataObject(
        currentLocation,
        fullAddress,
        'USER_ID_HERE' // Replace with actual user ID from context/auth
      );

      // For demo purposes, we'll simulate the API call
      // Update LOCATION_CONFIG with your actual backend URL and implement auth
      const BACKEND_URL = LOCATION_CONFIG.BACKEND_URL;
      const SAVE_ENDPOINT = getBackendEndpoint('SAVE_LOCATION');
      const AUTH_TOKEN = 'your-auth-token'; // Get from your auth context/storage
      
      try {
        // Attempt to save to backend using the configured endpoint
        const response = await fetch(SAVE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
          body: JSON.stringify(locationData),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to save location');
        }
        
        // If successful, mark as saved
        setSavedToDatabase(true);
        
        // Store locally with database sync flag
        await storeLocationWithAddress({
          ...locationData,
          savedToDatabase: true,
          savedAt: new Date().toISOString()
        });
        
        Alert.alert(
          'Location Saved Successfully!',
          'Your location has been saved to the database. Admins can now navigate to your address using Google Maps.',
          [{ text: 'OK' }]
        );
      } catch (apiError) {
        // If API fails, store locally for later sync
        console.log('API save failed, storing locally:', apiError);
        
        await storeLocationWithAddress({
          ...locationData,
          savedToDatabase: false,
          pendingSync: true,
          savedAt: new Date().toISOString()
        });
        
        Alert.alert(
          'Saved Locally',
          'Could not connect to server. Your location has been saved locally and will be synced when connection is available.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Save location error:', error);
      Alert.alert(
        'Save Failed',
        'Failed to save location. Please try again.',
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed in MyLocation');
            if (onBack) {
              console.log('Calling onBack function...');
              onBack();
            } else {
              console.log('No onBack prop provided');
              Alert.alert('Error', 'Back navigation not available');
            }
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Location</Text>
      </View>
      <View style={styles.separator} />

      <View style={styles.content}>
        {/* Main Share Address Card */}
        {!hasSharedAddress && !loading && (
          <View style={styles.shareAddressCard}>
            <View style={styles.shareAddressHeader}>
              <MaterialCommunityIcons 
                name="home-map-marker" 
                size={48} 
                color="#4CAF50" 
              />
              <Text style={styles.shareAddressTitle}>Share Your House Address</Text>
              <Text style={styles.shareAddressSubtitle}>
                Help us locate your house for better service delivery
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.shareAddressButton}
              onPress={shareHouseAddress}
              disabled={loading}
            >
              <MaterialCommunityIcons name="map-marker-plus" size={24} color="#ffffff" />
              <Text style={styles.shareAddressButtonText}>
                {loading ? 'Getting Location...' : 'Share My Address'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.privacyNote}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#666" />
              <Text style={styles.privacyText}>
                Your location will be captured using your phone's GPS and saved securely
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingTitle}>Getting Your Location...</Text>
            <Text style={styles.loadingSubtitle}>
              {loading ? 'Trying multiple GPS strategies for best results...\nThis may take up to 30 seconds.' : 'Please make sure GPS is enabled and you\'re in a location with good signal'}
            </Text>
          </View>
        )}

        {/* Success State - Address Shared */}
        {hasSharedAddress && currentLocation && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={24} 
                color="#4CAF50" 
              />
              <Text style={styles.cardTitle}>Address Shared Successfully!</Text>
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
                    <Text style={styles.databaseStatusText}>Saved to database</Text>
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
                  <Text style={styles.updateAddressButtonText}>Update Address</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shareLocationButton}
                  onPress={shareLocation}
                >
                  <MaterialCommunityIcons name="share" size={18} color="#2196F3" />
                  <Text style={styles.shareLocationButtonText}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.openMapsButton}
                  onPress={openInMaps}
                >
                  <MaterialCommunityIcons name="map" size={18} color="#FF9800" />
                  <Text style={styles.openMapsButtonText}>Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Information Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons 
            name="information-outline" 
            size={20} 
            color="#2196F3" 
          />
          <Text style={styles.infoText}>
            {hasSharedAddress 
              ? 'Your house address has been shared successfully. Admins can now navigate to your location when needed.'
              : 'Share your house address to help our team locate your house for better service delivery. Your location data is kept secure and private.'
            }
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
    marginTop: -10,
  },
  backButton: {
    padding: 4,
    marginTop: -5,
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  content: {
    flex: 1,
    padding: 20,
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  // New Share Address Card Styles
  shareAddressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    alignItems: 'center',
  },
  shareAddressHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shareAddressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  shareAddressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareAddressButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shareAddressButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
  // Loading Card Styles
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Success State Styles
  successSection: {
    marginTop: 8,
  },
  addressDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  fullAddressText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
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
  },
  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  updateAddressButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateAddressButtonText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  shareLocationButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareLocationButtonText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  openMapsButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapsButtonText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Existing styles
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontFamily: 'monospace',
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
    color: '#999',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default MyLocation;