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

const USERS_DATA = [
  {id: '1', name: 'Gowtham', address: '1/319, West street, k.chettipalayam,Dharapuram road, Tiruppur,Tamil Nadu - 641604'},
  {id: '2', name: 'Pranesh Karthi', address: '1/206, KARUPUSAMY KOVIL THOTTAM, KULAVIKARADU, P VELLALAPALAYAM, GOBICHETTIPALAYAM, ERODE, TAMIL NADU'},
  {id: '3', name: 'Rohith', address: '53, NAMMA GOUNDAN PALAYAM, VAZAHAITHOTTAM, SIVAGIRI - 638109, ERODE, TAMIL NADU'},
  {id: '4', name: 'Sundar Raj', address: '56, Big Street, Trichy Main, Tiruchirappalli, Tamil Nadu 620001'},
  {id: '5', name: 'Lakshmi Narayanan', address: '234, East Car Street, Temple Area, Thanjavur, Tamil Nadu 613001'},
];

const UserL = ({onClose}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  // Perfect Google Maps Navigation Function
  const openGoogleMapsNavigation = async (destinationAddress) => {
    try {
      console.log('Starting Google Maps navigation to:', destinationAddress);
      
      // Clean and encode the address
      const cleanAddress = destinationAddress.trim().replace(/\s+/g, ' ');
      const encodedAddress = encodeURIComponent(cleanAddress);
      
      // URL schemes in priority order
      const navigationUrls = Platform.OS === 'ios' 
        ? [
            // iOS - Google Maps App (preferred)
            `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`,
            // iOS - Apple Maps App
            `maps://?daddr=${encodedAddress}&dirflg=d`,
            // iOS - Web Google Maps
            `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`
          ]
        : [
            // Android - Google Maps Navigation (preferred)
            `google.navigation:q=${encodedAddress}&mode=d`,
            // Android - Google Maps App
            `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`,
            // Android - Web Google Maps
            `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`
          ];

      let navigationSuccess = false;

      // Try each URL scheme
      for (const url of navigationUrls) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            navigationSuccess = true;
            console.log('Navigation started successfully with URL:', url);
            break;
          }
        } catch (error) {
          console.log('Failed with URL:', url);
          continue;
        }
      }

      if (!navigationSuccess) {
        // Final fallback - direct Google Maps web
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
        await Linking.openURL(fallbackUrl);
        console.log('Using web fallback navigation');
      }
      
    } catch (error) {
      console.error('Navigation failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not start navigation. Please make sure Google Maps is installed on your device.',
        [
          {
            text: 'Install Google Maps',
            onPress: () => {
              const storeUrl = Platform.OS === 'ios' 
                ? 'https://apps.apple.com/app/google-maps/id585027354'
                : 'https://play.google.com/store/apps/details?id=com.google.android.apps.maps';
              Linking.openURL(storeUrl);
            }
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>User Locations</Text>
      <View style={{width: 24}} />
    </View>
  );

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
      {renderHeader()}
      <View style={styles.separator} />
      {renderSearchBar()}

      <View style={styles.content}>
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
      animationType="slide" 
      onRequestClose={() => setShowLocationModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.centeredModalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Location Details</Text>
            <View style={{width: 24}} />
          </View>
          <View style={styles.modalHeaderSeparator} />

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#000" />
                <Text style={styles.inputLabel}>User Name</Text>
              </View>
              <View style={styles.viewDataContainer}>
                <Text style={styles.viewDataText}>{selectedUser?.name}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#000" />
                <Text style={styles.inputLabel}>Destination Address</Text>
              </View>
              <View style={styles.viewDataContainer}>
                <Text style={styles.viewDataText}>{selectedUser?.address}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.navigationButton, styles.primaryButton]}
              onPress={() => {
                if (selectedUser) {
                  openGoogleMapsNavigation(selectedUser.address);
                }
              }}
            >
              <MaterialCommunityIcons name="navigation" size={22} color="#FFF" />
              <Text style={styles.navigationButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFF',
  },
  backButton: {padding: 4},
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  separator: {height: 1, backgroundColor: '#E5E7EB'},
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
  },
  content: {flex: 1, paddingHorizontal: 16, paddingTop: 8},
  listContent: {paddingBottom: 20},
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
  },
  userAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -5},
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  modalHeaderSeparator: {height: 1, backgroundColor: '#E5E7EB'},
  modalContent: {paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10},
  modalActions: {padding: 20, paddingTop: 10},
  inputGroup: {marginBottom: 20},
  labelContainer: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6},
  inputLabel: {
    fontSize: 15,
    color: '#000',
  },
  viewDataContainer: {backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16},
  viewDataText: {
    fontSize: 16,
    color: '#1F2937',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  navigationButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default UserL;