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
  ScrollView,
  Image,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../../services/ApiService';
import Header from '../../../../../components/HeaderComponent/Header';
import styles from './NewGroupStyles';

const NewGroupDetails = ({ route, navigation }) => {
  const { selectedUsers = [] } = route.params || {};
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  // UI Interactive States
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [disappearingTime, setDisappearingTime] = useState('Off');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState({
    editSettings: false,
    sendMessages: true,
    addParticipants: true,
  });

  const emojisList = ['😊', '😂', '👍', '❤️', '🔥', '🎉', '✨', '😎', '💬', '👥'];

  // Fetch users to display selected member details
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await ApiService.makeRequest('/admin/users/getAllUsers');
        const data = await res.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching users for details view:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users that are in the selected list
  const selectedUsersData = selectedUsers
    .map(id => users.find(u => u.id === id))
    .filter(Boolean);

  // Handle mock picture upload
  const handleCameraPress = () => {
    Alert.alert(
      'Group Icon',
      'Choose an option to upload group icon',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            // Mock taking a photo
            setGroupAvatar('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80');
            Alert.alert('Success', 'Photo uploaded from Camera!');
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            // Mock choosing a photo
            setGroupAvatar('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80');
            Alert.alert('Success', 'Photo selected from Gallery!');
          }
        },
        groupAvatar ? {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => {
            setGroupAvatar(null);
          }
        } : null,
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ].filter(Boolean)
    );
  };

  // Toggle emoji selection
  const handleEmojiSelect = (emoji) => {
    setGroupName(prev => prev + emoji);
  };

  // Handle disappearing messages selector
  const handleDisappearingPress = () => {
    Alert.alert(
      'Disappearing messages',
      'Make messages disappear in this chat',
      [
        {
          text: '24 hours',
          onPress: () => setDisappearingTime('24 hours')
        },
        {
          text: '7 days',
          onPress: () => setDisappearingTime('7 days')
        },
        {
          text: '90 days',
          onPress: () => setDisappearingTime('90 days')
        },
        {
          text: 'Off',
          onPress: () => setDisappearingTime('Off')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Submit new group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group subject');
      return;
    }

    setCreating(true);
    try {
      const response = await ApiService.makeRequest('/chats/groups/create', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDesc.trim(),
          userIds: selectedUsers,
          avatar: groupAvatar, // send the mock avatar URL
        }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Group created successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Pop back to the Chat list (two screens back)
              navigation.pop(2);
            } 
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to create group');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <Header title="New group" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Top Input row */}
        <View style={styles.detailsTopCard}>
          {/* Camera Button */}
          <TouchableOpacity 
            style={styles.cameraCircleButton} 
            activeOpacity={0.7}
            onPress={handleCameraPress}
          >
            {groupAvatar ? (
              <Image source={{ uri: groupAvatar }} style={styles.cameraAvatarImage} />
            ) : (
              <MaterialCommunityIcons name="camera-plus-outline" size={24} color="#7C8B9E" />
            )}
          </TouchableOpacity>

          {/* Group Name input */}
          <View style={styles.groupInputContainer}>
            <TextInput
              style={styles.groupDetailsInput}
              placeholder="Group name (optional)"
              placeholderTextColor="#9CA3AF"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={25}
            />
          </View>

          {/* Smiley emoji icon button */}
          <TouchableOpacity 
            style={styles.smileyButton} 
            activeOpacity={0.6}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <MaterialCommunityIcons 
              name="emoticon-happy-outline" 
              size={26} 
              color={showEmojiPicker ? "#00A884" : "#7C8B9E"} 
            />
          </TouchableOpacity>
        </View>

        {/* Emoji Selector Tray */}
        {showEmojiPicker && (
          <View style={styles.emojiTray}>
            {emojisList.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiButtonContainer}
                onPress={() => handleEmojiSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Settings options */}
        <View style={styles.settingsMenuContainer}>
          {/* Disappearing Messages */}
          <TouchableOpacity 
            style={styles.settingsRow} 
            activeOpacity={0.6}
            onPress={handleDisappearingPress}
          >
            <View style={styles.settingsRowLeft}>
              <Text style={styles.settingsRowTitle}>Disappearing messages</Text>
              <Text style={styles.settingsRowSubtitle}>{disappearingTime}</Text>
            </View>
            <MaterialCommunityIcons name="timer-outline" size={24} color="#7C8B9E" />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          {/* Group Permissions */}
          <TouchableOpacity 
            style={styles.settingsRow} 
            activeOpacity={0.6}
            onPress={() => setShowPermissionsModal(true)}
          >
            <View style={styles.settingsRowLeft}>
              <Text style={styles.settingsRowTitle}>Group permissions</Text>
            </View>
            <MaterialCommunityIcons name="cog-outline" size={24} color="#7C8B9E" />
          </TouchableOpacity>
        </View>

        {/* Selected Members Section */}
        <Text style={styles.membersHeaderLabel}>Members: {selectedUsers.length}</Text>
        
        {loadingUsers ? (
          <ActivityIndicator size="small" color="#6B46C1" style={{ marginTop: 20 }} />
        ) : (
          <View style={[styles.membersGridContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {selectedUsersData.map(item => (
              <View key={item.id} style={styles.memberGridItem}>
                <View style={styles.memberGridAvatar}>
                  {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                    <Image source={{ uri: item.avatar }} style={styles.memberGridImage} />
                  ) : (
                    <Text style={styles.memberGridAvatarText}>
                      {(item.name || 'U').substring(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.memberGridName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (Green Tick FAB) */}
      <TouchableOpacity
        style={styles.detailsFabButton}
        onPress={handleCreateGroup}
        disabled={creating}
        activeOpacity={0.8}
      >
        {creating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name="check" size={28} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Group Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPermissionsModal(false)}
        >
          <View style={styles.modalContent}>
            {/* Handle Bar */}
            <View style={styles.modalHandleBar} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group permissions</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPermissionsModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Switch Rows */}
            <View style={styles.modalItemRow}>
              <Text style={styles.modalItemLabel}>Edit group settings</Text>
              <Switch
                value={permissions.editSettings}
                onValueChange={(val) => setPermissions(prev => ({ ...prev, editSettings: val }))}
                trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
                thumbColor={permissions.editSettings ? "#00A884" : "#F3F4F6"}
              />
            </View>

            <View style={styles.modalItemRow}>
              <Text style={styles.modalItemLabel}>Send messages</Text>
              <Switch
                value={permissions.sendMessages}
                onValueChange={(val) => setPermissions(prev => ({ ...prev, sendMessages: val }))}
                trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
                thumbColor={permissions.sendMessages ? "#00A884" : "#F3F4F6"}
              />
            </View>

            <View style={styles.modalItemRow}>
              <Text style={styles.modalItemLabel}>Add other participants</Text>
              <Switch
                value={permissions.addParticipants}
                onValueChange={(val) => setPermissions(prev => ({ ...prev, addParticipants: val }))}
                trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
                thumbColor={permissions.addParticipants ? "#00A884" : "#F3F4F6"}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default NewGroupDetails;
