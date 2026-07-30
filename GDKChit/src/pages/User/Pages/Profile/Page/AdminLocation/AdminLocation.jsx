import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Linking,
  Modal,
  BackHandler,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import Header from '../../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../../services/ApiService';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const AdminLocation = ({ navigation }) => {
  const { t, language } = useLanguage();
  const [adminLocations, setAdminLocations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLocation, setNewAdminLocation] = useState('');
  const [newAdminLatitude, setNewAdminLatitude] = useState('');
  const [newAdminLongitude, setNewAdminLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (showNavigationModal) {
        setShowNavigationModal(false);
        return true;
      }
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, showNavigationModal]);

  const loadAdminLocations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await ApiService.makeRequest('/user/admins/locations', {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setAdminLocations(result.data);
      } else if (isInitial) {
        Alert.alert('Error', result.message || 'Failed to load admin locations');
      }
    } catch (error) {
      console.log('Error loading admin locations:', error);
      if (isInitial) {
        Alert.alert('Error', 'Failed to load admin locations');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminLocations(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOnMount = async () => {
      await loadAdminLocations(true);
    };

    fetchOnMount();

    const intervalId = setInterval(() => {
      if (isMounted) {
        loadAdminLocations(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminName.trim() || !newAdminLocation.trim() || !newAdminLatitude.trim() || !newAdminLongitude.trim()) {
      Alert.alert('Validation Error', 'Please enter admin name, location, latitude, and longitude');
      return;
    }

    try {
      setLoading(true);
      const newAdmin = {
        id: adminLocations.length + 1,
        name: newAdminName,
        location: newAdminLocation,
        address: newAdminLocation,
        latitude: parseFloat(newAdminLatitude),
        longitude: parseFloat(newAdminLongitude),
        lastUpdated: new Date().toISOString(),
        phone: 'N/A',
      };

      setAdminLocations([...adminLocations, newAdmin]);
      setNewAdminName('');
      setNewAdminLocation('');
      setNewAdminLatitude('');
      setNewAdminLongitude('');
      setIsEditing(false);

      Alert.alert('Success', 'Admin location added successfully');
    } catch (error) {
      console.log('Error adding admin:', error);
      Alert.alert('Error', 'Failed to add admin location');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = (adminId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this admin location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            setAdminLocations(adminLocations.filter(admin => admin.id !== adminId));
            Alert.alert('Success', 'Admin location deleted successfully');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setNewAdminName(admin.name);
    setNewAdminLocation(admin.location);
    setNewAdminLatitude(admin.latitude.toString());
    setNewAdminLongitude(admin.longitude.toString());
    setIsEditing(true);
  };

  const handleUpdateAdmin = async () => {
    if (!newAdminName.trim() || !newAdminLocation.trim() || !newAdminLatitude.trim() || !newAdminLongitude.trim()) {
      Alert.alert('Validation Error', 'Please enter admin name, location, latitude, and longitude');
      return;
    }

    try {
      setLoading(true);
      setAdminLocations(
        adminLocations.map(admin =>
          admin.id === selectedAdmin.id
            ? {
              ...admin,
              name: newAdminName,
              location: newAdminLocation,
              address: newAdminLocation,
              latitude: parseFloat(newAdminLatitude),
              longitude: parseFloat(newAdminLongitude),
              lastUpdated: new Date().toISOString(),
            }
            : admin
        )
      );
      setNewAdminName('');
      setNewAdminLocation('');
      setNewAdminLatitude('');
      setNewAdminLongitude('');
      setIsEditing(false);
      setSelectedAdmin(null);
      Alert.alert('Success', 'Admin location updated successfully');
    } catch (error) {
      console.log('Error updating admin:', error);
      Alert.alert('Error', 'Failed to update admin location');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewAdminName('');
    setNewAdminLocation('');
    setNewAdminLatitude('');
    setNewAdminLongitude('');
    setSelectedAdmin(null);
  };

  const openAdminLocationInMaps = (latitude, longitude, adminName) => {
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Invalid coordinates for this admin location');
      return;
    }

    const url = Platform.select({
      ios: `maps://app?q=${adminName}&saddr=&daddr=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${adminName})`,
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application. Please make sure you have Google Maps installed.');
    });
  };

  const handleNavigateToAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowNavigationModal(true);
  };

  const handleConfirmNavigation = () => {
    if (selectedAdmin) {
      openAdminLocationInMaps(selectedAdmin.latitude, selectedAdmin.longitude, selectedAdmin.name);
      setShowNavigationModal(false);
      setSelectedAdmin(null);
    }
  };

  const handleCloseNavigationModal = () => {
    setShowNavigationModal(false);
    setSelectedAdmin(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Admin Locations"
        onBack={() => navigation.goBack()}
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
            colors={['#6B46C1']}
            tintColor="#6B46C1"
          />
        }
      >
        <View style={styles.formContainer}>
          {/* Navigation Animation */}
          {adminLocations.length > 0 && (
            <View style={styles.animationContainer}>
              <LottieView
                source={require('../../../../../../animation/Navigate_House_Address.json')}
                autoPlay={true}
                loop={true}
                speed={0.7}
                resizeMode="contain"
                style={styles.navigationLottie}
              />
            </View>
          )}

          {/* Admin Locations List */}
          {adminLocations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={48}
                color="#CCCCCC"
              />
              <Text style={[styles.emptyStateText, language === 'ta' && { fontSize: 16 }]}>
                {t('No admin locations added yet')}
              </Text>
              <Text style={[styles.emptyStateSubtext, language === 'ta' && { fontSize: 13 }]}>
                {t('Add an admin location to get started')}
              </Text>
            </View>
          ) : (
            adminLocations.map((admin) => (
              <View key={admin.id} style={styles.adminCard}>
                <View style={styles.adminCardHeader}>
                  <View style={styles.adminCardTitle}>
                    <MaterialCommunityIcons
                      name="account-circle"
                      size={32}
                      color="#6B46C1"
                    />
                    <View style={styles.adminInfo}>
                      <Text style={styles.adminName}>{admin.name}</Text>
                      <Text style={styles.adminPhone}>{admin.phone}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.adminCardContent}>
                  <View style={styles.adminLocationRow}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={18}
                      color="#6B46C1"
                    />
                    <Text style={styles.adminLocation}>{admin.location}</Text>
                  </View>

                  <View style={styles.adminAddressRow}>
                    <MaterialCommunityIcons
                      name="home-outline"
                      size={16}
                      color="#999999"
                    />
                    <Text style={styles.adminAddress}>{admin.address}</Text>
                  </View>

                  <View style={styles.adminCoordinatesRow}>
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={16}
                      color="#999999"
                    />
                    <Text style={styles.adminCoordinates}>
                      {admin.latitude}° N, {admin.longitude}° E
                    </Text>
                  </View>
                </View>

                <View style={styles.adminCardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.navigateButton]}
                    onPress={() => handleNavigateToAdmin(admin)}
                  >
                    <MaterialCommunityIcons
                      name="navigation"
                      size={16}
                      color="#2196F3"
                    />
                    <Text style={[styles.actionButtonText, language === 'ta' && { fontSize: 13 }]}>{t('Navigate')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Navigation Modal */}
      <Modal
        visible={showNavigationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseNavigationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.centeredModalContainer}>
            {selectedAdmin && (
              <View style={styles.cleanModalCard}>
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButtonTop}
                  onPress={handleCloseNavigationModal}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#999999" />
                </TouchableOpacity>

                {/* Admin Info */}
                <View style={styles.adminInfoSection}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {selectedAdmin.name.charAt(0)}
                    </Text>
                  </View>

                  <Text style={styles.modalAdminNameText}>{selectedAdmin.name}</Text>
                  <Text style={styles.modalAdminPhoneText}>{selectedAdmin.phone}</Text>
                  <Text style={styles.modalAdminAddressText}>{selectedAdmin.address}</Text>
                </View>

                {/* Divider */}
                <View style={styles.modalDivider} />

                {/* Action Buttons */}
                <View style={styles.cleanButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cleanCancelButton}
                    onPress={handleCloseNavigationModal}
                  >
                    <Text style={[styles.modalCancelText, language === 'ta' && { fontSize: 14 }]}>{t('Cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cleanConfirmButton}
                    onPress={handleConfirmNavigation}
                  >
                    <MaterialCommunityIcons
                      name="navigation"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.cleanConfirmButtonText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  formContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  navigationLottie: {
    width: 350,
    height: 250,
    marginTop: -35,
    marginBottom: -35,
  },
  section: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  textAreaInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: 0,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButton: {
    backgroundColor: '#6B46C1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  cancelButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    elevation: 0,
    shadowColor: 'transparent',
  },
  adminCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  adminPhone: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  moreButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  adminCardContent: {
    marginBottom: 16,
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  adminLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  adminLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B46C1',
    flex: 1,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  adminAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  adminAddress: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
    lineHeight: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  adminCoordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminCoordinates: {
    fontSize: 12,
    color: '#999999',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  adminDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminDate: {
    fontSize: 12,
    color: '#999999',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  adminCardActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  navigateButton: {
    flex: 0.6,
    backgroundColor: '#2196F3',
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 10,
    elevation: 0,
    shadowColor: 'transparent',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  editButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F6',
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  deleteButton: {
    borderColor: '#F44336',
    backgroundColor: '#FFF3E0',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
    marginTop: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#CCCCCC',
    marginTop: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginHorizontal: 0,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    elevation: 0,
    shadowColor: 'transparent',
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    flex: 1,
    lineHeight: 18,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredModalContainer: {
    width: '85%',
    alignItems: 'center',
  },
  cleanModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  adminInfoSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalAdminNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalAdminPhoneText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  modalAdminAddressText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  cleanButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cleanCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  cleanConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cleanConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
});

export default AdminLocation;
