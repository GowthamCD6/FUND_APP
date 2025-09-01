import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Join = ({ onBack }) => {
  const [groupCode, setGroupCode] = useState('');

  const handleJoinGroup = () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }
    // Add your group joining logic here
    Alert.alert('Success', `Joining group with code: ${groupCode}`);
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Group</Text>
      </View>
      <View style={styles.separator} />
      {/* Join Group Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="account-group" size={64} color="#6B46C1" />
        </View>
        
        <Text style={styles.title}>Join a Group</Text>
        <Text style={styles.description}>
          Enter the group code provided by your group administrator to join the fund group.
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Group Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group code"
            placeholderTextColor="#9CA3AF"
            value={groupCode}
            onChangeText={setGroupCode}
            autoCapitalize="characters"
            maxLength={8}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, !groupCode.trim() && styles.joinButtonDisabled]} 
          onPress={handleJoinGroup}
          disabled={!groupCode.trim()}
        >
          <Text style={styles.joinButtonText}>Join Group</Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          Don't have a group code? Contact your group administrator or create a new group.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#d7dce4ff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    marginTop: -10,
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoText: {
    fontSize: 20,
    color: '#6B46C1',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'Poppins-Bold',
  },
  subText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Gilroy-Regular' : 'Poppins-Regular',
  },
});

export default Join;
