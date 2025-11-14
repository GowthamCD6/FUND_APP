/**
 * Location Services Configuration
 * 
 * To use Google Maps Geocoding API:
 * 1. Get a Google Maps API key from: https://developers.google.com/maps/documentation/geocoding/get-api-key
 * 2. Enable the Geocoding API in your Google Cloud Console
 * 3. Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual API key
 */

export const LOCATION_CONFIG = {
  // Google Maps API Configuration
  GOOGLE_MAPS_API_KEY: null, // Replace with your actual API key
  
  // Backend API Configuration
  BACKEND_URL: 'https://your-backend-api.com', // Replace with your backend URL
  
  // API Endpoints
  ENDPOINTS: {
    SAVE_LOCATION: '/api/user/save-location',
    GET_USER_LOCATIONS: '/api/user/locations',
    UPDATE_LOCATION: '/api/user/update-location',
  },
  
  // Location Settings
  LOCATION_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
  },
  
  // Geocoding Settings
  GEOCODING: {
    enabled: false, // Set to true when you have a valid API key
    fallbackToCoordinates: true,
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    LAST_LOCATION: 'lastKnownLocation',
    USER_LOCATION_WITH_ADDRESS: 'userLocationWithAddress',
    LOCATION_SETTINGS: 'locationSettings',
  }
};

// Helper function to check if geocoding is available
export const isGeocodingAvailable = () => {
  return LOCATION_CONFIG.GOOGLE_MAPS_API_KEY && LOCATION_CONFIG.GEOCODING.enabled;
};

// Helper function to get backend endpoint URL
export const getBackendEndpoint = (endpoint) => {
  return `${LOCATION_CONFIG.BACKEND_URL}${LOCATION_CONFIG.ENDPOINTS[endpoint]}`;
};