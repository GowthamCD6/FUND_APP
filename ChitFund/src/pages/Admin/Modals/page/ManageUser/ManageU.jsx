import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ManageU = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample users data (replace with your actual data source)
  const [users] = useState([
    { id: '1', name: 'முருகன் குமார்', phone: '9876543210', type: 'user' },
    { id: '2', name: 'லட்சுமி செல்வி', phone: '9876543211', type: 'admin' },
    { id: '3', name: 'ராஜேஷ் பாபு', phone: '9876543212', type: 'user' },
  ]);

  const filteredUsers = searchQuery
    ? users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      )
    : users;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Manage Users</Text>
            <Text style={styles.headerSubtitle}>View and manage system users</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Users List */}
      <ScrollView style={styles.content}>
        {filteredUsers.map(user => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => {/* Handle user selection */}}
          >
            <View style={styles.userInfo}>
              <View style={[
                styles.userIcon,
                { backgroundColor: user.type === 'admin' ? '#EDE9FE' : '#E0F2FE' }
              ]}>
                <MaterialCommunityIcons
                  name={user.type === 'admin' ? 'shield-account' : 'account'}
                  size={20}
                  color={user.type === 'admin' ? '#6B46C1' : '#0EA5E9'}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <View style={[
                styles.userType,
                { backgroundColor: user.type === 'admin' ? '#F3F0FF' : '#F0F9FF' }
              ]}>
                <Text style={[
                  styles.userTypeText,
                  { color: user.type === 'admin' ? '#6B46C1' : '#0EA5E9' }
                ]}>
                  {user.type === 'admin' ? 'Admin' : 'User'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userType: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ManageU;
