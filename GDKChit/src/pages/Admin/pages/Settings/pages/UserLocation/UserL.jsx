import React, {useState, useMemo} from 'react';
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
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import Header from '../../../../../../components/HeaderComponent/Header';
import Clipboard from '@react-native-clipboard/clipboard'; // Import Clipboard

// 🌟 Mock User Data (Replace with your actual database fetch)
// You can add latitude and longitude if you have exact coordinates from Google Maps
const USERS_DATA = [
  {
    id: '1', 
    name: 'Gowtham', 
    phone: '+91 98765 43210',
    address: '1/319, West street, k.chettipalayam, Dharapuram road, Tiruppur, Tiruppur, Tamil Nadu - 641604',
  },
  {
    id: '2', 
    name: 'Pranesh Karthi', 
    phone: '+91 98765 43211',
    address: '1/206, KARUPUSAMY KOVIL THOTTAM, KULAVIKARADU, P VELLALAPALAYAM, GOBICHETTIPALAYAM, ERODE, TAMIL NADU',
  },
  {
    id: '3', 
    name: 'Rohith', 
    phone: '+91 98765 43212',
    address: '53, NAMMA GOUNDAN PALAYAM, VAZAHAITHOTTAM, SIVAGIRI - 638109, ERODE, TAMIL NADU',
  },
  {
    id: '4', 
    name: 'Sundar Raj', 
    phone: '+91 98765 43213',
    address: '56, Big Street, Trichy Main, Tiruchirappalli, Tamil Nadu 620001',
  },
  {
    id: '5', 
    name: 'Lakshmi Narayanan', 
    phone: '+91 98765 43214',
    address: '234, East Car Street, Temple Area, Thanjavur, Tamil Nadu 613001',
  },
];

const UserL = ({onClose}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Memoized list for efficient search filtering
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return USERS_DATA;
    const q = searchQuery.toLowerCase();
    return USERS_DATA.filter(
      u => u.name.toLowerCase().includes(q) || u.address.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handleUserSelect = user => {
    setSelectedUser(user);
    setShowLocationModal(true);
  };

  const handleBackPress = () => {
    if (onClose) onClose();
  };

  // 🌍 Smart navigation - uses coordinates if available, otherwise searches in Google Maps
  const startNavigation = async (user) => {
    try {
      setShowLocationModal(false); // Close modal
      
      console.log('Starting navigation to:', user.name);
      console.log('Address:', user.address);
      
      let navigationUrl = '';
      
      // Check if user has exact coordinates
      if (user.latitude && user.longitude) {
        // Use exact coordinates for precise navigation
        const destination = `${user.latitude},${user.longitude}`;
        console.log('Using exact coordinates:', destination);
        
        if (Platform.OS === 'android') {
          navigationUrl = `google.navigation:q=${destination}&mode=d`;
          const canOpen = await Linking.canOpenURL(navigationUrl);
          if (canOpen) {
            await Linking.openURL(navigationUrl);
            return;
          }
          navigationUrl = `geo:${destination}?q=${destination}`;
          await Linking.openURL(navigationUrl);
        } else {
          navigationUrl = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
          const canOpen = await Linking.canOpenURL(navigationUrl);
          if (canOpen) {
            await Linking.openURL(navigationUrl);
            return;
          }
          navigationUrl = `maps://?daddr=${destination}&dirflg=d`;
          await Linking.openURL(navigationUrl);
        }
        
      } else {
        // No coordinates - Open Google Maps search with full address
        // This allows user to see search results and select the correct location
        const encodedAddress = encodeURIComponent(user.address);
        
        if (Platform.OS === 'android') {
          // Open Google Maps search (not direct navigation)
          // User can then tap the location and start navigation manually
          navigationUrl = `geo:0,0?q=${encodedAddress}`;
          
          const canOpen = await Linking.canOpenURL(navigationUrl);
          if (canOpen) {
            await Linking.openURL(navigationUrl);
            
            // Show helpful message
            setTimeout(() => {
              Alert.alert(
                'Location Search',
                'Google Maps is showing search results. Please:\n\n1. Find the correct location from results\n2. Tap on it to see details\n3. Tap "Directions" to start navigation\n\nIf the exact address is not found, you can tap on the map to drop a pin at the correct location.',
                [{text: 'Got it'}]
              );
            }, 1000);
            return;
          }
          
          // Fallback to web Google Maps
          navigationUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
          await Linking.openURL(navigationUrl);
          
        } else {
          // iOS - Open in search mode
          navigationUrl = `comgooglemaps://?q=${encodedAddress}`;
          const canOpen = await Linking.canOpenURL(navigationUrl);
          
          if (canOpen) {
            await Linking.openURL(navigationUrl);
            
            setTimeout(() => {
              Alert.alert(
                'Location Search',
                'Google Maps is showing search results. Please find the correct location and tap "Directions" to navigate.',
                [{text: 'Got it'}]
              );
            }, 1000);
            return;
          }
          
          // Fallback to Apple Maps search
          navigationUrl = `maps://?q=${encodedAddress}`;
          await Linking.openURL(navigationUrl);
        }
      }
      
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Could not open maps app. Please make sure you have Google Maps or Apple Maps installed on your device.',
        [{text: 'OK'}]
      );
    }
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={22} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const UserCard = ({user}) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleUserSelect(user)}>
      <View style={styles.userInfo}>
        <View style={styles.userIconContainer}>
          <MaterialCommunityIcons name="map-marker-radius" size={24} color="#3B82F6" />
        </View>
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userAddress} numberOfLines={1}>{user.address}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#6B7280" />
    </TouchableOpacity>
  );

  const renderUserList = () => (
    <View style={styles.container}>
      <Header 
        title="User Locations"
        onBack={handleBackPress}
      />
      <View style={styles.separator} />
      {renderSearchBar()}

      <View style={styles.content}>
        {/* Navigation Animation */}
        {filteredUsers.length > 0 && (
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

        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => <UserCard user={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          }
        />
      </View>
    </View>
  );

  const renderLocationModal = () => (
    <Modal 
      visible={showLocationModal} 
      transparent 
      animationType="fade" 
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View style={styles.centeredModalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="map-marker-radius" size={32} color="#0066FF" />
            </View>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Navigate to User</Text>
            <Text style={styles.modalUserName}>{selectedUser?.name}</Text>
            <View style={styles.addressContainer}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
              <Text style={styles.modalAddress} numberOfLines={3}>
                {selectedUser?.address}
              </Text>
            </View>
            
            {selectedUser?.latitude && selectedUser?.longitude ? (
              <View style={styles.coordinatesBadge}>
                <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#10B981" />
                <Text style={styles.coordinatesText}>Exact GPS Available</Text>
              </View>
            ) : (
              <View style={styles.warningBadge}>
                <MaterialCommunityIcons name="information" size={14} color="#F59E0B" />
                <Text style={styles.warningText}>Will open map search</Text>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.startNavigationButton}
              onPress={() => selectedUser && startNavigation(selectedUser)}
            >
              <MaterialCommunityIcons name="navigation" size={24} color="#FFF" />
              <Text style={styles.startNavigationText}>
                {selectedUser?.latitude && selectedUser?.longitude ? 'Start Navigation' : 'Search Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {renderUserList()}
      {renderLocationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {flex: 1, backgroundColor: '#FFF'},
  container: {flex: 1, backgroundColor: '#FFF'},
  separator: {height: 1, backgroundColor: '#E5E7EB'},
  animationContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  navigationLottie: {
    width: 300,
    height: 200,
    marginTop: -40,
    marginBottom: -40,
  },
  searchContainer: {padding: 16, backgroundColor: '#FFF'},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 58,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  content: {flex: 1, paddingHorizontal: 16, paddingTop: 8},
  listContent: {paddingBottom: 100},
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {flexDirection: 'row', alignItems: 'center', flex: 1},
  userIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#DBEAFE',
  },
  userTextContainer: {flex: 1},
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 16,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E6F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066FF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalAddress: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 20,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  coordinatesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 12,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 6,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  modalActions: {
    padding: 20,
    paddingTop: 0,
  },
  startNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startNavigationText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
});

export default UserL;