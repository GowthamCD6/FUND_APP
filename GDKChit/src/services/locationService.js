import { PermissionsAndroid, Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";

export const getUserCurrentLocation = async (options = {}) => {
  try {
    // 1. Check and request Location Permission (Android)
    if (Platform.OS === "android") {
      const hasPermission = await checkLocationPermission();
      
      if (!hasPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          throw new Error("Location permission denied");
        }
      }
    }

    // 2. Get Location with improved timeout handling
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30 seconds
      maximumAge: 60000, // Accept cached location up to 1 minute old
      showLocationDialog: true, // Android: prompt to enable location services
      forceRequestLocation: true, // Android: force location request even if location services are off
    };

    const locationOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      console.log('Requesting location with options:', locationOptions);

      Geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          };
          console.log("✅ Location retrieved successfully:", coords);
          resolve(coords);
        },
        (error) => {
          console.error("❌ Geolocation error:", error);
          
          // Handle specific error codes with helpful messages
          let errorMessage = "Unknown location error";
          switch (error.code) {
            case 1:
              errorMessage = "Location permission denied";
              break;
            case 2:
              errorMessage = "Location position unavailable. Please ensure GPS is enabled and you have a clear signal.";
              break;
            case 3:
              errorMessage = "Location request timed out. This may happen indoors or in areas with poor GPS signal. Try moving to a location with better reception.";
              break;
            case 4:
              errorMessage = "Location service is not active";
              break;
            default:
              errorMessage = error.message || "Failed to get location";
          }
          
          const enhancedError = new Error(errorMessage);
          enhancedError.code = error.code;
          enhancedError.originalError = error;
          
          reject(enhancedError);
        },
        locationOptions
      );
    });
  } catch (error) {
    console.error("Error getting location:", error);
    throw error;
  }
};

/**
 * Get user location with fallback strategies for better reliability
 * @returns {Promise<Object>} Location coordinates
 */
export const getUserCurrentLocationWithFallback = async () => {
  try {
    console.log("🎯 Attempting high-accuracy location...");
    // First attempt: High accuracy with longer timeout
    return await getUserCurrentLocation({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 30000,
    });
  } catch (highAccuracyError) {
    console.log("⚠️ High-accuracy failed, trying balanced accuracy...");
    
    try {
      // Second attempt: Balanced accuracy with shorter timeout
      return await getUserCurrentLocation({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000,
      });
    } catch (balancedError) {
      console.log("⚠️ Balanced accuracy failed, trying low accuracy...");
      
      try {
        // Third attempt: Low accuracy, fast response
        return await getUserCurrentLocation({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Accept location up to 5 minutes old
        });
      } catch (lowAccuracyError) {
        console.log("❌ All location attempts failed");
        
        // If all attempts fail, throw the most relevant error
        if (highAccuracyError.code === 1) {
          // Permission denied is most critical
          throw highAccuracyError;
        } else if (balancedError.code === 2) {
          // Position unavailable is hardware/GPS related
          throw balancedError;
        } else {
          // Otherwise throw timeout error with helpful message
          throw new Error(
            "Unable to get your location after multiple attempts. Please ensure:\n" +
            "• Location services are enabled\n" +
            "• You have good GPS signal (try going outside)\n" +
            "• The app has location permission\n" +
            "• Try again in a moment"
          );
        }
      }
    }
  }
};

export const checkLocationPermission = async () => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }
  // For iOS, permissions are handled automatically via Info.plist
  return true;
};

export const requestLocationPermission = async () => {
  if (Platform.OS === "android") {
    try {
      // First check if permission is already granted
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      if (alreadyGranted) {
        return true;
      }

      // Request permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission Required",
          message: "This app needs access to your location to provide location services and allow admins to navigate to your address.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Deny",
          buttonPositive: "Allow",
        }
      );
      
      console.log("Permission result:", granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error("Permission request error:", error);
      return false;
    }
  }
  // For iOS, permissions are handled automatically via Info.plist
  return true;
};

export const formatCoordinates = (latitude, longitude, precision = 6) => {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
};

export const getDistanceBetween = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

export const generateGoogleMapsUrl = (latitude, longitude, label = "Location") => {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
};

export const generateMapDeepLink = (latitude, longitude, Platform) => {
  if (Platform.OS === "ios") {
    return `maps:${latitude},${longitude}`;
  } else {
    return `geo:${latitude},${longitude}`;
  }
};

// Store location in AsyncStorage for offline access
export const storeLocationLocally = async (locationData) => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(locationData));
  } catch (error) {
    console.error('Error storing location:', error);
  }
};

// Get stored location from AsyncStorage
export const getStoredLocation = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem('lastKnownLocation');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored location:', error);
    return null;
  }
};

/**
 * Get address from coordinates using reverse geocoding
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<string>} Formatted address
 */
export const getAddressFromCoordinates = async (latitude, longitude, apiKey) => {
  try {
    if (!apiKey) {
      // Fallback to coordinate format if no API key
      return `Location: ${formatCoordinates(latitude, longitude)}`;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      // Fallback to coordinate format
      return `Location: ${formatCoordinates(latitude, longitude)}`;
    }
  } catch (error) {
    console.log('Reverse geocoding error:', error);
    // Fallback to coordinate format
    return `Location: ${formatCoordinates(latitude, longitude)}`;
  }
};

/**
 * Save location data to backend database
 * @param {Object} locationData - Location data to save
 * @param {string} apiUrl - Backend API URL
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} API response
 */
export const saveLocationToBackend = async (locationData, apiUrl, authToken) => {
  try {
    const response = await fetch(`${apiUrl}/api/user/save-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(locationData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save location');
    }

    return result;
  } catch (error) {
    console.log('Backend save error:', error);
    throw error;
  }
};

/**
 * Create comprehensive location data object for saving
 * @param {Object} location - Location coordinates
 * @param {string} address - Full address
 * @param {string} userId - User ID
 * @returns {Object} Complete location data
 */
export const createLocationDataObject = (location, address, userId) => {
  return {
    userId,
    latitude: location.latitude,
    longitude: location.longitude,
    address,
    accuracy: location.accuracy,
    timestamp: new Date().toISOString(),
    googleMapsUrl: `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`,
    googleMapsNavigateUrl: `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
    coordinates: formatCoordinates(location.latitude, location.longitude),
    metadata: {
      capturedAt: new Date().toISOString(),
      platform: Platform.OS,
      appVersion: '1.0.0', // You can get this from your app config
    }
  };
};

/**
 * Store user location with address in AsyncStorage with database sync flag
 * @param {Object} locationData - Complete location data with address
 * @returns {Promise<boolean>} Success status
 */
export const storeLocationWithAddress = async (locationData) => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const dataToStore = {
      ...locationData,
      storedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem('userLocationWithAddress', JSON.stringify(dataToStore));
    return true;
  } catch (error) {
    console.error('Error storing location with address:', error);
    return false;
  }
};

/**
 * Get stored user location with address from AsyncStorage
 * @returns {Promise<Object|null>} Stored location data or null
 */
export const getStoredLocationWithAddress = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem('userLocationWithAddress');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored location with address:', error);
    return null;
  }
};