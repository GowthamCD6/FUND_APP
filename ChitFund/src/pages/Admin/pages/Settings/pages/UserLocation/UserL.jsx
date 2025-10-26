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
import Clipboard from '@react-native-clipboard/clipboard'; // Import Clipboard

// 🌟 Mock User Data (Replace with your actual database fetch)
const USERS_DATA = [
  {id: '1', name: 'Gowtham', address: '1/319, West street, k.chettipalayam,Dharapuram road, Tiruppur, PO: T.c.market, DIST: Tiruppur,Tamil Nadu - 641604'},
  {id: '2', name: 'Pranesh Karthi', address: '1/206, KARUPUSAMY KOVIL THOTTAM, KULAVIKARADU, P VELLALAPALAYAM, GOBICHETTIPALAYAM, ERODE, TAMIL NADU'},
  {id: '3', name: 'Rohith', address: '53, NAMMA GOUNDAN PALAYAM, VAZAHAITHOTTAM, SIVAGIRI - 638109, ERODE, TAMIL NADU'},
  {id: '4', name: 'Sundar Raj', address: '56, Big Street, Trichy Main, Tiruchirappalli, Tamil Nadu 620001'},
  {id: '5', name: 'Lakshmi Narayanan', address: '234, East Car Street, Temple Area, Thanjavur, Tamil Nadu 613001'},
];

const UserLocationScreen = ({onClose}) => {
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

  // Function to clean and format the address for better mapping
  const cleanAndFormatAddress = (address) => {
    // Replace common address separators with commas for consistency
    let cleaned = address.replace(/[,;]/g, ', ');
    // Remove duplicate commas
    cleaned = cleaned.replace(/,\s*,/g, ',');
    // Replace multiple spaces with single space
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
  };

  // 🌍 Enhanced navigation function to directly start navigation
  const openExternalNavigation = async (destinationAddress) => {
    try {
      console.log('Attempting to start navigation to:', destinationAddress);
      
      const cleanAddress = cleanAndFormatAddress(destinationAddress);
      // Ensure the address is URL-encoded
      const encodedAddress = encodeURIComponent(cleanAddress);
      
      // Prioritized URL schemes for starting navigation
      const urls = {
        ios: [
          // 1. Google Maps App (preferred for direct navigation)
          `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`,
          // 2. Apple Maps App (direct navigation)
          `maps://?daddr=${encodedAddress}&dirflg=d`,
          // 3. Fallback to Google Maps web with destination (reliable)
          `http://maps.google.com/maps?daddr=${encodedAddress}&travelmode=driving`,
          // 4. Fallback to Apple Maps web with destination
          `https://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`,
          // 5. General search (least preferred for navigation, but a fallback)
          `comgooglemaps://?q=${encodedAddress}`,
          `maps://?q=${encodedAddress}`,
          `https://maps.apple.com/?q=${encodedAddress}`,
        ],
        android: [
          // 1. Google Maps App (Direct driving navigation)
          `google.navigation:q=${encodedAddress}&mode=d`, 
          // 2. Google Maps App (directions to address)
          `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`, 
          // 3. Fallback to Google Maps web with destination (reliable)
          `http://maps.google.com/maps?daddr=${encodedAddress}&travelmode=driving`,
          // 4. General search via geo URI (opens any map app)
          `geo:0,0?q=${encodedAddress}`
        ]
      };

      const platformUrls = Platform.OS === 'ios' ? urls.ios : urls.android;
      
      let navigationOpened = false;

      // Try each URL scheme until one works
      for (const url of platformUrls) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            navigationOpened = true;
            console.log('Navigation opened successfully with URL:', url);
            break; // Stop after successfully opening one
          } 
        } catch (error) {
          console.log('Failed to open URL:', url, error);
          // Don't break, try the next URL in the list
        }
      }

      if (!navigationOpened) {
        // If all direct navigation and search attempts fail, inform the user.
        throw new Error('All navigation methods failed');
      }
      
    } catch (error) {
      console.error('Navigation error:', error);
      
      Alert.alert(
        'Navigation Issue', 
        `Could not start navigation to the address. This might be because:
        
• The address format is not recognized or too vague
• A suitable maps app is not installed or enabled

You can try:
1. Opening your preferred maps app manually
2. Searching for nearby landmarks or a simplified version of the address
3. Using the "Copy Address" option to paste it manually.`,
        [
          {
            text: 'Open Maps App (Generic)',
            onPress: () => {
              const mapsUrl = Platform.OS === 'ios' 
                ? 'maps://' // Opens Apple Maps
                : 'geo:0,0?q='; // Opens any map app on Android
              Linking.openURL(mapsUrl).catch(() => {
                // Fallback to Google Maps web search
                Linking.openURL(`http://maps.google.com/maps?q=${encodeURIComponent(destinationAddress)}`); 
              });
            }
          },
          { 
            text: 'Copy Address', 
            onPress: () => {
              Clipboard.setString(destinationAddress);
              Alert.alert('Address Copied', 'You can now paste this address in your maps app manually.');
            }
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  // Function to handle alternative navigation methods
  const handleAlternativeNavigation = () => {
    if (!selectedUser) return;

    Alert.alert(
      'Alternative Navigation Options',
      'Choose how you want to navigate:',
      [
        {
          text: 'Open in Google Maps (Web)',
          onPress: () => {
            const encodedAddress = encodeURIComponent(cleanAndFormatAddress(selectedUser.address));
            // CORRECTED: Use standard Google Maps web link
            const url = `http://maps.google.com/maps?daddr=${encodedAddress}&travelmode=driving`; 
            Linking.openURL(url);
          }
        },
        {
          text: 'Open in Apple Maps (Web)', 
          onPress: () => {
            const encodedAddress = encodeURIComponent(cleanAndFormatAddress(selectedUser.address));
            const url = `https://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`;
            Linking.openURL(url);
          }
        },
        {
          text: 'Manual Entry (Copy Address)',
          onPress: () => {
            Clipboard.setString(selectedUser.address);
            Alert.alert(
              'Address Copied',
              `Please manually enter this address in your maps app:
              
${selectedUser.address}`,
              [{ text: 'OK' }]
            );
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
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

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#000" />
                <Text style={styles.inputLabel}>Navigation Tips</Text>
              </View>
              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  • "Start Navigation" attempts to get directions directly.{'\n'}
                  • If direct navigation fails, "Alternative Methods" offers more options.{'\n'}
                  • A stable internet connection is recommended.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.navigationButton, styles.primaryButton]}
              onPress={() => {
                if (selectedUser) {
                  // Calls the main navigation function
                  openExternalNavigation(selectedUser.address);
                }
              }}
            >
              <MaterialCommunityIcons name="navigation" size={22} color="#FFF" />
              <Text style={styles.navigationButtonText}>Start Navigation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navigationButton, styles.secondaryButton]}
              onPress={handleAlternativeNavigation}
            >
              <MaterialCommunityIcons name="map-marker-multiple" size={20} color="#3498DB" />
              <Text style={styles.secondaryButtonText}>Alternative Methods</Text>
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
    // Add your desired font family
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold', 
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
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
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
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  userAddress: {
    fontSize: 14,
    color: '#6B7280',
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
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
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  modalHeaderSeparator: {height: 1, backgroundColor: '#E5E7EB'},
  modalContent: {paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10},
  modalActions: {padding: 20, paddingTop: 10},
  inputGroup: {marginBottom: 20},
  labelContainer: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6},
  inputLabel: {
    fontSize: 15,
    color: '#000',
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Medium' : 'Poppins-Medium',
  },
  viewDataContainer: {backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16},
  viewDataText: {
    fontSize: 16,
    color: '#1F2937',
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  helpContainer: {backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16},
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: {width: 0, height: 4},
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
  secondaryButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    // fontFamily: Platform.OS === 'android' ? 'Gilroy-SemiBold' : 'Poppins-SemiBold',
  },
});

export default UserLocationScreen;