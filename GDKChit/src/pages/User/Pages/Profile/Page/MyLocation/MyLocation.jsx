import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';

const MyLocation = ({ onBack }) => {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocationEnabled(granted);
        if (granted) {
          getCurrentLocation();
        }
      } catch (error) {
        console.log('Permission check error:', error);
      }
    } else {
      getCurrentLocation();
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to provide location services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationEnabled(true);
          getCurrentLocation();
        } else {
          setLocationEnabled(false);
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use this feature. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      } catch (error) {
        console.log('Permission request error:', error);
      }
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    
    Geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(newLocation);
        setLastUpdated(new Date());
        setLocationEnabled(true);
        setLoading(false);
        
        // Get address from coordinates
        getAddressFromCoordinates(newLocation.latitude, newLocation.longitude);
      },
      (error) => {
        console.log('Location error:', error);
        setLoading(false);
        
        switch (error.code) {
          case 1:
            Alert.alert('Permission Denied', 'Please enable location permission in settings.');
            break;
          case 2:
            Alert.alert('Position Unavailable', 'Unable to get your current location.');
            break;
          case 3:
            Alert.alert('Timeout', 'Location request timed out. Please try again.');
            break;
          default:
            Alert.alert('Error', 'Failed to get your location. Please try again.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      // For demo purposes, we'll use a simple format
      // In production, you could use Google Geocoding API or other services
      setAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  };

  const handleLocationToggle = (value) => {
    if (value) {
      if (!locationEnabled) {
        requestLocationPermission();
      } else {
        getCurrentLocation();
      }
    } else {
      setLocationEnabled(false);
      setCurrentLocation(null);
      setLastUpdated(null);
      setAddress('');
    }
  };

  const openInMaps = () => {
    if (!currentLocation) return;
    
    const { latitude, longitude } = currentLocation;
    const url = Platform.select({
      ios: `maps:${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}`,
    });
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application.');
    });
  };

  const shareLocation = () => {
    if (!currentLocation) return;
    
    const { latitude, longitude } = currentLocation;
    const message = `My current location: ${address || `${latitude}, ${longitude}`}\nhttps://maps.google.com/?q=${latitude},${longitude}`;
    
    Alert.alert(
      'Share Location',
      'Location sharing functionality would be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return lastUpdated.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Location</Text>
      </View>
      <View style={styles.separator} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Status Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.menuSection}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons 
                  name="map-marker" 
                  size={24} 
                  color="#6B46C1" 
                />
                <Text style={styles.menuItemText}>Enable Location</Text>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={handleLocationToggle}
                trackColor={{ false: '#E5E7EB', true: '#6B46C1' }}
                thumbColor={locationEnabled ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* Current Location Section */}
        {locationEnabled && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.menuSection}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6B46C1" />
                  <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
              ) : currentLocation ? (
                <>
                  <View style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                      <MaterialCommunityIcons 
                        name="map-marker-check" 
                        size={24} 
                        color="#10B981" 
                      />
                      <Text style={styles.locationTitle}>Location Found</Text>
                    </View>
                    
                    <View style={styles.locationDetails}>
                      <Text style={styles.addressText}>{address || 'Getting address...'}</Text>
                      <Text style={styles.coordinatesText}>
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </Text>
                      <Text style={styles.accuracyText}>
                        Accuracy: ±{Math.round(currentLocation.accuracy)}m
                      </Text>
                      {lastUpdated && (
                        <Text style={styles.lastUpdatedText}>
                          Updated {formatLastUpdated()}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.customDivider} />

                  <TouchableOpacity style={styles.menuItem} onPress={getCurrentLocation}>
                    <View style={styles.menuItemLeft}>
                      <MaterialCommunityIcons 
                        name="refresh" 
                        size={24} 
                        color="#6B46C1" 
                      />
                      <Text style={styles.menuItemText}>Refresh Location</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                  </TouchableOpacity>

                  <View style={styles.customDivider} />

                  <TouchableOpacity style={styles.menuItem} onPress={openInMaps}>
                    <View style={styles.menuItemLeft}>
                      <MaterialCommunityIcons 
                        name="map" 
                        size={24} 
                        color="#6B46C1" 
                      />
                      <Text style={styles.menuItemText}>Open in Maps</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                  </TouchableOpacity>

                  <View style={styles.customDivider} />

                  <TouchableOpacity style={styles.menuItem} onPress={shareLocation}>
                    <View style={styles.menuItemLeft}>
                      <MaterialCommunityIcons 
                        name="share-variant" 
                        size={24} 
                        color="#6B46C1" 
                      />
                      <Text style={styles.menuItemText}>Share Location</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noLocationContainer}>
                  <MaterialCommunityIcons 
                    name="map-marker-off" 
                    size={48} 
                    color="#9CA3AF" 
                  />
                  <Text style={styles.noLocationTitle}>Location Not Available</Text>
                  <Text style={styles.noLocationText}>
                    Unable to get your current location. Please try again.
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={getCurrentLocation}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Location Services Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Location Services</Text>
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons 
                  name="shield-check" 
                  size={24} 
                  color="#6B46C1" 
                />
                <Text style={styles.menuItemText}>Privacy Settings</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>

            <View style={styles.customDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons 
                  name="history" 
                  size={24} 
                  color="#6B46C1" 
                />
                <Text style={styles.menuItemText}>Location History</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>

            <View style={styles.customDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openSettings()}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons 
                  name="cog" 
                  size={24} 
                  color="#6B46C1" 
                />
                <Text style={styles.menuItemText}>App Settings</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialCommunityIcons 
            name="information-outline" 
            size={20} 
            color="#6B7280" 
          />
          <Text style={styles.infoText}>
            Your location data is used to provide location-based services and is kept secure according to our privacy policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginTop: -10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
    marginTop: -10,
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff',
  },
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
    fontWeight: '400',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  customDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    alignSelf: 'center',
    width: '80%',
    marginVertical: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  locationCard: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  locationDetails: {
    paddingLeft: 32,
  },
  addressText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  accuracyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noLocationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  noLocationText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  retryButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 18,
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
});

export default MyLocation;