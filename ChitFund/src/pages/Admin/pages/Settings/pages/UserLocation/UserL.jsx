import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
  Alert,
  Linking,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Users data with addresses across Tamil Nadu
const USERS_DATA = [
  {
    id: '1',
    name: 'Kamaraj Kumar',
    address: '123, Anna Salai, Guindy, Chennai, Tamil Nadu 600032',
  },
  {
    id: '2',
    name: 'Priya Pandian',
    address: '45, Cross-Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012',
  },
  {
    id: '3',
    name: 'Vijay Balan',
    address: '789, West Masi Street, Madurai Main, Madurai, Tamil Nadu 625001',
  },
  {
    id: '4',
    name: 'Sundar Raj',
    address: '56, Big Street, Trichy Main, Tiruchirappalli, Tamil Nadu 620001',
  },
  {
    id: '5',
    name: 'Lakshmi Narayanan',
    address: '234, East Car Street, Temple Area, Thanjavur, Tamil Nadu 613001',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserLocationScreen = ({onClose}) => {
  // State to track selected user
  const [selectedUser, setSelectedUser] = useState(null);
  // State for admin's current location
  const [currentLocation, setCurrentLocation] = useState(null);
  // State for loading location
  const [loadingLocation, setLoadingLocation] = useState(false);
  // State for location error
  const [locationError, setLocationError] = useState(null);

  // ==========================================================================
  // LOCATION PERMISSION AND FETCHING
  // ==========================================================================

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show navigation.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      // For iOS, we rely on the Geolocation API to handle permissions
      return true;
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);

    requestLocationPermission().then(hasPermission => {
      if (hasPermission) {
        Geolocation.getCurrentPosition(
          position => {
            const {latitude, longitude} = position.coords;
            setCurrentLocation({
              latitude,
              longitude,
              description: 'Your Current Location',
            });
            setLoadingLocation(false);
          },
          error => {
            console.error('Location error:', error);
            setLocationError('Unable to fetch current location');
            setLoadingLocation(false);
            
            // Fallback: Use a default location (Chennai coordinates)
            setCurrentLocation({
              latitude: 13.0827,
              longitude: 80.2707,
              description: 'Default Location (Chennai)',
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      } else {
        setLocationError('Location permission denied');
        setLoadingLocation(false);
        
        // Fallback to default location
        setCurrentLocation({
          latitude: 13.0827,
          longitude: 80.2707,
          description: 'Default Location (Permission Denied)',
        });
      }
    });
  };

  // Get location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // ==========================================================================
  // NAVIGATION HANDLERS
  // ==========================================================================

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const handleBackPress = () => {
    if (selectedUser) {
      handleBackToList();
    } else if (onClose) {
      onClose();
    }
  };

  const handleRetryLocation = () => {
    getCurrentLocation();
  };

  // ==========================================================================
  // EXTERNAL NAVIGATION
  // ==========================================================================

  const openExternalNavigation = (destinationAddress) => {
    if (!currentLocation) {
      Alert.alert('Location Unavailable', 'Please wait while we fetch your location.');
      return;
    }

    const encodedAddress = encodeURIComponent(destinationAddress);
    
    // Different URL schemes for iOS and Android
    const url = Platform.select({
      ios: `maps://?daddr=${encodedAddress}&dirflg=d`,
      android: `google.navigation:q=${encodedAddress}&mode=d`,
    });

    Linking.openURL(url).catch(() => {
      // Fallback: Open in browser with Google Maps
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert(
          'Navigation Error', 
          'Could not open any navigation app. Please install Google Maps or Apple Maps.'
        );
      });
    });
  };

  // ==========================================================================
  // RENDER COMPONENTS
  // ==========================================================================

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={handleBackPress}
      >
        <MaterialCommunityIcons 
          name="arrow-left" 
          size={24} 
          color="#2C3E50" 
        />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>
        {selectedUser ? 'Location Details' : 'User Locations'}
      </Text>
      
      <View style={styles.headerButton} />
    </View>
  );

  // Location Status Component
  const renderLocationStatus = () => (
    <View style={styles.locationStatus}>
      <MaterialCommunityIcons 
        name={loadingLocation ? "map-marker-radius" : "map-marker-check"} 
        size={16} 
        color={loadingLocation ? "#E67E22" : "#27AE60"} 
      />
      <Text style={[
        styles.locationStatusText,
        loadingLocation && styles.locationStatusLoading,
        locationError && styles.locationStatusError
      ]}>
        {loadingLocation 
          ? "Fetching your location..." 
          : locationError 
          ? "Using default location"
          : "Location ready for navigation"
        }
      </Text>
      {locationError && (
        <TouchableOpacity onPress={handleRetryLocation} style={styles.retryButton}>
          <MaterialCommunityIcons name="reload" size={14} color="#3498DB" />
        </TouchableOpacity>
      )}
    </View>
  );

  // User List Item Component
  const UserCard = ({user}) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserSelect(user)}
    >
      <View style={styles.userAvatar}>
        <MaterialCommunityIcons 
          name="account-circle" 
          size={40} 
          color="#3498DB" 
        />
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userAddress} numberOfLines={2}>
          {user.address}
        </Text>
      </View>
      
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color="#95A5A6" 
      />
    </TouchableOpacity>
  );

  // User List Screen
  const renderUserList = () => (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>
        Select a User to Navigate
      </Text>
      
      {renderLocationStatus()}
      
      <FlatList
        data={USERS_DATA}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => <UserCard user={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users available</Text>
        }
      />
    </View>
  );

  // User Details Screen
  const renderUserDetails = () => (
    <ScrollView 
      style={styles.detailsContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Location Status */}
      {renderLocationStatus()}

      {/* User Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        
        <InfoRow 
          icon="account" 
          label="Name" 
          value={selectedUser.name} 
        />
        
        <InfoRow 
          icon="map-marker" 
          label="Address" 
          value={selectedUser.address} 
          selectable
        />
      </View>

      {/* Navigation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation Details</Text>
        
        <LocationBox 
          icon="navigation"
          title="Starting From" 
          location={currentLocation?.description || 'Fetching location...'} 
          isCurrentLocation
        />
        
        <LocationBox 
          icon="flag"
          title="Going To" 
          location={selectedUser.address} 
        />

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navigationButton, styles.primaryButton]}
            onPress={() => openExternalNavigation(selectedUser.address)}
            disabled={!currentLocation}
          >
            <MaterialCommunityIcons name="navigation" size={22} color="#FFFFFF" />
            <Text style={styles.navigationButtonText}>Start Navigation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navigationButton, styles.secondaryButton]}
            onPress={handleRetryLocation}
          >
            <MaterialCommunityIcons name="reload" size={20} color="#3498DB" />
            <Text style={styles.secondaryButtonText}>Refresh Location</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.disclaimerText}>
          * Navigation will open in your preferred maps application
        </Text>
      </View>

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <View style={styles.helpSection}>
          <MaterialCommunityIcons name="information" size={20} color="#3498DB" />
          <Text style={styles.helpText}>
            If navigation doesn't start, make sure you have Google Maps or Apple Maps installed on your device.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Reusable Info Row Component
  const InfoRow = ({icon, label, value, selectable = false}) => (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color="#7F8C8D" 
        style={styles.infoIcon} 
      />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text 
        style={styles.infoValue} 
        selectable={selectable}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );

  // Reusable Location Box Component
  const LocationBox = ({icon, title, location, isCurrentLocation = false}) => (
    <View style={[
      styles.locationBox,
      isCurrentLocation && styles.currentLocationBox
    ]}>
      <View style={styles.locationHeader}>
        <MaterialCommunityIcons 
          name={icon} 
          size={18} 
          color={isCurrentLocation ? "#27AE60" : "#E74C3C"} 
        />
        <Text style={styles.locationTitle}>{title}</Text>
      </View>
      <Text style={styles.locationText}>{location}</Text>
    </View>
  );

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {renderHeader()}
      
      {selectedUser ? renderUserDetails() : renderUserList()}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
  },

  // Location Status Styles
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  locationStatusText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    marginLeft: 8,
  },
  locationStatusLoading: {
    color: '#E67E22',
  },
  locationStatusError: {
    color: '#E74C3C',
  },
  retryButton: {
    marginLeft: 8,
    padding: 4,
  },

  // User List Styles
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  userAddress: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 16,
    marginTop: 50,
  },

  // User Details Styles
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6C757D',
    width: 80,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Location Box Styles
  locationBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },
  currentLocationBox: {
    borderLeftColor: '#27AE60',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 18,
  },

  // Navigation Buttons
  navigationButtons: {
    marginTop: 8,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Help Section
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Disclaimer Text
  disclaimerText: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default UserLocationScreen;