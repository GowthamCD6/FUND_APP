import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../../services/ApiService';
import Header from '../../../../../components/HeaderComponent/Header';
import styles from './NewGroupStyles';

const NewGroup = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await ApiService.makeRequest('/admin/users/getAllUsers');
        const data = await res.json();
        if (data.success) {
          setUsers(data.data || []);
        } else {
          Alert.alert('Error', 'Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        Alert.alert('Error', 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Handle select/deselect user
  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Get details of selected users for the horizontal list
  const selectedUsersData = selectedUsers
    .map(id => users.find(u => u.id === id))
    .filter(Boolean);

  // Filter users by search query
  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Shared Header Component */}
      <Header title="Add Group Members" onBack={() => navigation.goBack()} />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or phone..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected Users Horizontal Scroll List */}
      {selectedUsersData.length > 0 && (
        <View style={styles.selectedUsersContainer}>
          <FlatList
            data={selectedUsersData}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => `selected-${item.id}`}
            renderItem={({ item }) => (
              <View style={styles.selectedUserBubble}>
                <View style={styles.selectedAvatar}>
                  <Text style={styles.selectedAvatarText}>
                    {(item.name || 'U').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.selectedName} numberOfLines={1}>
                  {(item.name || '').split(' ')[0]}
                </Text>
                <TouchableOpacity 
                  style={styles.removeBadge}
                  onPress={() => toggleUser(item.id)}
                >
                  <MaterialCommunityIcons name="close" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* Members Checkbox List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00A884" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item }) => {
            const isSelected = selectedUsers.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => toggleUser(item.id)}
              >
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(item.name || 'U').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userPhone}>{item.phone}</Text>
                </View>
                <MaterialCommunityIcons 
                  name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                  size={22} 
                  color={isSelected ? "#6B46C1" : "#9CA3AF"} 
                />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#9CA3AF' }}>No users found.</Text>
          }
        />
      )}

      {/* Floating Action Button (Tick) */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          { opacity: selectedUsers.length > 0 ? 1 : 0.6 }
        ]}
        onPress={() => {
          if (selectedUsers.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one member.');
            return;
          }
          navigation.navigate('NewGroupDetails', { selectedUsers });
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="check" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default NewGroup;
