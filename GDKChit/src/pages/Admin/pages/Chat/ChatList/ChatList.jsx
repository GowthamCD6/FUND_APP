import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera } from 'react-native-image-picker';
import styles from './ChatListStyles';
import ApiService from '../../../../../services/ApiService';
import ChatScreen from '../ChatScreen/ChatScreen';

const { width } = Dimensions.get('window');

const ChatList = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const searchAnim = useRef(new Animated.Value(0)).current;

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTab, setNewChatTab] = useState('users'); // 'users' or 'groups'
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // WhatsApp Features Modal states
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [showStarredMessagesModal, setShowStarredMessagesModal] = useState(false);

  // Community Form state
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [selectedCommunityGroups, setSelectedCommunityGroups] = useState([]);

  // Starred Messages state
  const [starredMessages, setStarredMessages] = useState([]);
  const [loadingStarred, setLoadingStarred] = useState(false);

  // Sort options
  const [sortMode, setSortMode] = useState('newest'); // 'newest', 'unread', 'name'
  const [showDropdown, setShowDropdown] = useState(false);

  // WhatsApp Pinned/Muted/Archived states
  const [pinnedChats, setPinnedChats] = useState([]);
  const [mutedChats, setMutedChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  
  // Options Modal state
  const [selectedChatOptions, setSelectedChatOptions] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const ws = useRef(null);

  // Load chats from API
  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.makeRequest('/chats');
      const data = await response.json();
      if (data.success) {
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const pinned = await AsyncStorage.getItem('chat_pinned');
        const muted = await AsyncStorage.getItem('chat_muted');
        const archived = await AsyncStorage.getItem('chat_archived');
        if (pinned) setPinnedChats(JSON.parse(pinned));
        if (muted) setMutedChats(JSON.parse(muted));
        if (archived) setArchivedChats(JSON.parse(archived));
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    loadChats();

    const unsubscribe = navigation.addListener('focus', () => {
      loadChats();
    });

    // Setup WebSocket
    const setupWebSocket = async () => {
      try {
        // Read accessToken (the key ApiService stores the JWT under)
        const token = await AsyncStorage.getItem('accessToken');
        
        // Read user info from individual AsyncStorage keys (set by AuthContext on login)
        const userName = await AsyncStorage.getItem('userName') || '';
        const userRole = await AsyncStorage.getItem('userRole') || 'Admin';
        
        if (!token) {
          console.log('No accessToken found, skipping WebSocket setup');
          return;
        }

        // We need userId from the JWT. Decode the payload (base64).
        let userId = 'unknown';
        try {
          const payloadBase64 = token.split('.')[1];
          const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          const decode = (str) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let output = '';
            str = String(str).replace(/=+$/, '');
            for (let bc = 0, bs = 0, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
              buffer = chars.indexOf(buffer);
            }
            return output;
          };
          const jsonPayload = (typeof global.atob === 'function') ? global.atob(base64) : decode(base64);
          const payload = JSON.parse(jsonPayload);
          userId = payload.userId || payload.id || 'unknown';
        } catch (e) {
          console.warn('Could not decode JWT for userId:', e);
        }

        const userType = userRole || 'Admin';
        
        // Convert http:// API_URL to ws:// and use correct /api/chat path
        let wsUrl = ApiService.baseURL ? ApiService.baseURL.replace('http', 'ws') : 'ws://localhost:5000';
        // Remove any trailing /api/admin or /api suffixes, then append /api/chat
        wsUrl = wsUrl.replace(/\/api\/admin\/?$/, '').replace(/\/api\/?$/, '');
        wsUrl = `${wsUrl}/api/chat?token=${token}&userId=${userId}&userType=${userType}`;
        
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
          console.log('Chat WebSocket Connected (Admin)');
        };
        
        const handleWsMessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message_notification' || payload.type === 'new_message') {
              loadChats();
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };
        
        ws.current.addEventListener('message', handleWsMessage);
        
        ws.current.onerror = (e) => {
          console.log('Chat WS Error:', e.message);
        };
        
        ws.current.onclose = () => {
          console.log('Chat WS Closed');
        };
      } catch(e) {
        console.error('Error setting up WS:', e);
      }
    };
    
    setupWebSocket();

    return () => {
      unsubscribe();
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Combined filter + sort logic (derived synchronously with useMemo)
  const filteredChats = useMemo(() => {
    let processed = chats.map(chat => ({
      ...chat,
      pinned: pinnedChats.includes(chat.id),
      muted: mutedChats.includes(chat.id),
      archived: archivedChats.includes(chat.id),
    }));

    // If showing archived tab, filter only archived. Otherwise filter out archived.
    if (activeFilter === 'archived') {
      processed = processed.filter(chat => chat.archived);
    } else {
      processed = processed.filter(chat => !chat.archived);
    }

    let filtered = [...processed];

    // Apply filter type
    if (activeFilter === 'unread') {
      filtered = filtered.filter(chat => chat.unread > 0);
    } else if (activeFilter === 'groups') {
      filtered = filtered.filter(chat => chat.isGroup);
    } else if (activeFilter === 'personal') {
      filtered = filtered.filter(chat => !chat.isGroup);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(chat =>
        (chat.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort (pinned first)
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortMode === 'unread') {
        return (b.unread || 0) - (a.unread || 0);
      } else if (sortMode === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else {
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      }
    });

    return filtered;
  }, [chats, searchQuery, activeFilter, sortMode, pinnedChats, mutedChats, archivedChats]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const toggleSearchActive = () => {
    setSearchActive(!searchActive);
    Animated.timing(searchAnim, {
      toValue: searchActive ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    if (searchActive) {
      handleSearch('');
    }
  };

  // Tune/Sort button (Now handled via dropdown)
  const handleSortChange = (nextMode) => {
    const labels = { newest: 'Newest First', unread: 'Most Unread', name: 'Name (A-Z)' };
    setSortMode(nextMode);
    setShowDropdown(false);
    Alert.alert('Sort Order', `Sorted by: ${labels[nextMode]}`);
  };

  const formatTime = (dateInput) => {
    if (!dateInput) return '';
    // Ensure UTC parsing — DB returns strings without 'Z'
    const str = dateInput instanceof Date ? null : String(dateInput).trim();
    const date = dateInput instanceof Date
      ? dateInput
      : new Date(str.endsWith('Z') ? str : str + 'Z');
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInMinutes / 1440);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleChatPress = (chat) => {
    setSelectedChat(chat.id);
    setOpenChat({
      chatId: chat.id,
      chatName: chat.name,
      chatAvatar: chat.avatar,
      isGroup: chat.isGroup,
      groupId: chat.groupId,
    });
  };

  const handleBackFromChat = () => {
    // Return to chat list and refresh to update unread counts
    setOpenChat(null);
    setSelectedChat(null);
    loadChats();
  };

  // ===== WhatsApp Features Logic =====

  const handleCreateCommunity = async () => {
    if (!communityName.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }
    try {
      const response = await ApiService.makeRequest('/chats/communities/create', {
        method: 'POST',
        body: JSON.stringify({
          name: communityName,
          description: communityDesc,
          groupIds: selectedCommunityGroups
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Community created successfully');
        setShowCreateCommunityModal(false);
        setCommunityName('');
        setCommunityDesc('');
        setSelectedCommunityGroups([]);
        loadChats();
      } else {
        Alert.alert('Error', data.message || 'Failed to create community');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error');
    }
  };

  const toggleCommunityGroup = (roomId) => {
    if (selectedCommunityGroups.includes(roomId)) {
      setSelectedCommunityGroups(selectedCommunityGroups.filter(id => id !== roomId));
    } else {
      setSelectedCommunityGroups([...selectedCommunityGroups, roomId]);
    }
  };

  const fetchStarredMessages = async () => {
    setLoadingStarred(true);
    try {
      const response = await ApiService.makeRequest('/chats/messages/starred');
      const data = await response.json();
      if (data.success) {
        setStarredMessages(data.starred || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStarred(false);
    }
  };

  const openStarredModal = () => {
    setShowDropdown(false);
    fetchStarredMessages();
    setShowStarredMessagesModal(true);
  };

  // ===== New Chat Modal Logic =====
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setNewChatSearchQuery('');
    setLoadingGroups(true);
    try {
      // Unified contacts endpoint returns role-appropriate users + groups
      const res = await ApiService.makeRequest('/chats/contacts');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Error fetching contacts for new chat:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSelectUser = async (user) => {
    setShowNewChatModal(false);
    try {
      // API call to create or get private room
      const res = await ApiService.makeRequest('/chats/privateRoom', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenChat({
          chatId: data.roomId,
          chatName: user.name,
          chatAvatar: '👤'
        });
      } else {
        Alert.alert('Error', 'Failed to start personal chat');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    }
  };

  const handleSelectGroup = (group) => {
    setShowNewChatModal(false);
    setOpenChat({
      chatId: group.id,
      chatName: group.group_name || group.name,
      chatAvatar: '👥',
      isGroup: true,
    });
  };

  const handlePinChat = async (chatId) => {
    let nextPinned;
    if (pinnedChats.includes(chatId)) {
      nextPinned = pinnedChats.filter(id => id !== chatId);
    } else {
      nextPinned = [...pinnedChats, chatId];
    }
    setPinnedChats(nextPinned);
    await AsyncStorage.setItem('chat_pinned', JSON.stringify(nextPinned));
    setShowOptionsModal(false);
  };

  const handleMuteChat = async (chatId) => {
    let nextMuted;
    if (mutedChats.includes(chatId)) {
      nextMuted = mutedChats.filter(id => id !== chatId);
    } else {
      nextMuted = [...mutedChats, chatId];
    }
    setMutedChats(nextMuted);
    await AsyncStorage.setItem('chat_muted', JSON.stringify(nextMuted));
    setShowOptionsModal(false);
  };

  const handleArchiveChat = async (chatId) => {
    let nextArchived;
    if (archivedChats.includes(chatId)) {
      nextArchived = archivedChats.filter(id => id !== chatId);
    } else {
      nextArchived = [...archivedChats, chatId];
      if (pinnedChats.includes(chatId)) {
        const nextPinned = pinnedChats.filter(id => id !== chatId);
        setPinnedChats(nextPinned);
        await AsyncStorage.setItem('chat_pinned', JSON.stringify(nextPinned));
      }
    }
    setArchivedChats(nextArchived);
    await AsyncStorage.setItem('chat_archived', JSON.stringify(nextArchived));
    setShowOptionsModal(false);
  };

  const handleDeleteChat = async (chatId) => {
    setShowOptionsModal(false);
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation? This will delete the room and all messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await ApiService.makeRequest('/chats/rooms/delete', {
                method: 'POST',
                body: JSON.stringify({ roomId: chatId }),
              });
              const data = await response.json();
              if (data.success) {
                const nextPinned = pinnedChats.filter(id => id !== chatId);
                const nextMuted = mutedChats.filter(id => id !== chatId);
                const nextArchived = archivedChats.filter(id => id !== chatId);
                setPinnedChats(nextPinned);
                setMutedChats(nextMuted);
                setArchivedChats(nextArchived);
                await AsyncStorage.setItem('chat_pinned', JSON.stringify(nextPinned));
                await AsyncStorage.setItem('chat_muted', JSON.stringify(nextMuted));
                await AsyncStorage.setItem('chat_archived', JSON.stringify(nextArchived));

                Alert.alert('Success', 'Conversation deleted successfully');
                loadChats();
              } else {
                Alert.alert('Error', data.message || 'Failed to delete conversation');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete conversation');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderOptionsModal = () => {
    if (!selectedChatOptions) return null;
    const isPinned = pinnedChats.includes(selectedChatOptions.id);
    const isMuted = mutedChats.includes(selectedChatOptions.id);
    const isArchived = archivedChats.includes(selectedChatOptions.id);

    return (
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} 
          activeOpacity={1} 
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingVertical: 20, paddingBottom: 35 }}>
            {/* Handle bar */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>

            {/* Chat Title */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F2937' }}>{selectedChatOptions.name}</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{selectedChatOptions.isGroup ? 'Group Chat' : 'Personal Chat'}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 }} />

            {/* Action Items */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handlePinChat(selectedChatOptions.id)}>
              <MaterialCommunityIcons name={isPinned ? "pin-off-outline" : "pin-outline"} size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                {isPinned ? 'Unpin chat' : 'Pin chat'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleMuteChat(selectedChatOptions.id)}>
              <MaterialCommunityIcons name={isMuted ? "bell-outline" : "bell-off-outline"} size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                {isMuted ? 'Unmute notifications' : 'Mute notifications'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleArchiveChat(selectedChatOptions.id)}>
              <MaterialCommunityIcons name={isArchived ? "archive-arrow-up-outline" : "archive-outline"} size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                {isArchived ? 'Unarchive chat' : 'Archive chat'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleDeleteChat(selectedChatOptions.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444', marginLeft: 14 }}>
                Delete Chat
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderChat = ({ item, index }) => {
    const isSelected = selectedChat === item.id;
    const isUnread = item.unread > 0;
    const isPinned = pinnedChats.includes(item.id);
    const isMuted = mutedChats.includes(item.id);
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View 
        style={{ 
          opacity: 1,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.chatItem,
            isSelected && styles.chatItemSelected,
            isUnread && styles.chatItemUnread,
          ]}
          onPress={() => handleChatPress(item)}
          onLongPress={() => {
            setSelectedChatOptions(item);
            setShowOptionsModal(true);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {/* Avatar Section */}
          <View style={styles.chatAvatarContainer}>
            <View style={[styles.avatarCircle, isUnread && styles.avatarCircleUnread, { overflow: 'hidden' }]}>
              {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name={item.isGroup ? "account-group" : "account"} size={30} color={isUnread ? "#FFFFFF" : "#7C3AED"} />
              )}
            </View>
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          {/* Chat Info Section */}
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {isPinned && <MaterialCommunityIcons name="pin" size={16} color="#6B46C1" style={{ marginRight: 4 }} />}
                <Text 
                  style={[
                    styles.chatName,
                    isUnread && styles.chatNameUnread,
                  ]} 
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isMuted && <MaterialCommunityIcons name="bell-off" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />}
                <Text style={[styles.timestamp, isUnread && styles.timestampUnread]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>
            <Text 
              style={[
                styles.lastMessage,
                isUnread && styles.lastMessageUnread,
              ]} 
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>

          {/* Unread Badge */}
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSkeletonList = () => (
    <View style={{ paddingVertical: 8 }}>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <View 
          key={key} 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#FFFFFF',
            marginHorizontal: 12,
            marginVertical: 4,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#F3F4F6',
          }}
        >
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB', marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 140, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB' }} />
              <View style={{ width: 45, height: 10, borderRadius: 5, backgroundColor: '#F3F4F6' }} />
            </View>
            <View style={{ width: '75%', height: 12, borderRadius: 6, backgroundColor: '#F3F4F6' }} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={{ alignItems: 'center', marginTop: -100 }}>
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <MaterialCommunityIcons name="chat-outline" size={100} color="#E9D5FF" />
        </View>
        <Text style={styles.emptyStateText}>Start Conversations</Text>
        <Text style={styles.emptyStateSubtext}>
          Connect with your group members and start meaningful conversations today
        </Text>
      </View>
    </View>
  );

  // ===== New Chat Modal Component =====
  const renderNewChatModal = () => (
    <Modal
      visible={showNewChatModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNewChatModal(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '85%',
          paddingTop: 16,
          paddingBottom: 30,
        }}>
          {/* Handle bar */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1F2937' }}>New Conversation</Text>
            <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Custom Tab Selector */}
          <View style={{ flexDirection: 'row', marginBottom: 12, marginHorizontal: 20, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 4 }}>
            <TouchableOpacity 
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: newChatTab === 'users' ? '#FFFFFF' : 'transparent' }}
              onPress={() => setNewChatTab('users')}
            >
              <Text style={{ fontWeight: '600', color: newChatTab === 'users' ? '#6B46C1' : '#9CA3AF' }}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: newChatTab === 'groups' ? '#FFFFFF' : 'transparent' }}
              onPress={() => setNewChatTab('groups')}
            >
              <Text style={{ fontWeight: '600', color: newChatTab === 'groups' ? '#6B46C1' : '#9CA3AF' }}>Groups</Text>
            </TouchableOpacity>
          </View>

          {/* New Chat Search Input Box */}
          <View style={{ marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12 }}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, color: '#1F2937', fontSize: 14 }}
              placeholder={newChatTab === 'users' ? "Search users by name or phone..." : "Search groups..."}
              placeholderTextColor="#9CA3AF"
              value={newChatSearchQuery}
              onChangeText={setNewChatSearchQuery}
            />
            {newChatSearchQuery.trim() !== '' && (
              <TouchableOpacity onPress={() => setNewChatSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {loadingGroups ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6B46C1" />
              <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading data...</Text>
            </View>
          ) : newChatTab === 'groups' ? (
            <FlatList
              data={groups.filter(g => 
                (g.group_name || g.name || '').toLowerCase().includes(newChatSearchQuery.toLowerCase())
              )}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                    padding: 14,
                    marginVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E9D5FF',
                  }}
                  onPress={() => handleSelectGroup(item)}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9D5FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>👥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                      {item.group_name || item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      {item.current_members || item.totalMembers || 0} members · {item.status || 'Active'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No groups found</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={users.filter(u => 
                (u.name || '').toLowerCase().includes(newChatSearchQuery.toLowerCase()) ||
                (u.phone || '').includes(newChatSearchQuery)
              )}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                    padding: 14,
                    marginVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E9D5FF',
                  }}
                  onPress={() => handleSelectUser(item)}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9D5FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      {item.phone}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No users found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // If a chat is open, show ChatScreen instead of chat list
  if (openChat) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleBackFromChat}
        statusBarTranslucent={true}
      >
        <ChatScreen 
          route={{ params: openChat }}
          navigation={{ 
            ...navigation,
            goBack: handleBackFromChat 
          }}
          onBack={handleBackFromChat}
          ws={ws.current}
        />
      </Modal>
    );
  }

  // ===== WhatsApp Feature Modals =====

  const renderCreateCommunityModal = () => (
    <Modal
      visible={showCreateCommunityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateCommunityModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingTop: 16, paddingBottom: 30 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1F2937' }}>New Community</Text>
            <TouchableOpacity onPress={() => setShowCreateCommunityModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <TextInput
              style={{ backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginBottom: 10, color: '#1F2937' }}
              placeholder="Community Name"
              placeholderTextColor="#9CA3AF"
              value={communityName}
              onChangeText={setCommunityName}
            />
            <TextInput
              style={{ backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, color: '#1F2937' }}
              placeholder="Community Description (Optional)"
              placeholderTextColor="#9CA3AF"
              value={communityDesc}
              onChangeText={setCommunityDesc}
            />
          </View>

          <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginHorizontal: 20, marginBottom: 8 }}>ADD GROUPS ({selectedCommunityGroups.length})</Text>

          <FlatList
            data={chats.filter(c => c.isGroup && c.type !== 'community')}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => {
              const isSelected = selectedCommunityGroups.includes(item.id);
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isSelected ? '#F3E8FF' : '#F9FAFB',
                    padding: 14,
                    marginVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isSelected ? '#6B46C1' : '#E9D5FF',
                  }}
                  onPress={() => toggleCommunityGroup(item.id)}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E9D5FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 16 }}>👥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{item.lastMessage}</Text>
                  </View>
                  <MaterialCommunityIcons 
                    name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                    size={22} 
                    color={isSelected ? "#6B46C1" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={{ backgroundColor: '#6B46C1', marginHorizontal: 20, marginTop: 15, paddingVertical: 14, borderRadius: 28, alignItems: 'center' }}
            onPress={handleCreateCommunity}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Create Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStarredMessagesModal = () => (
    <Modal
      visible={showStarredMessagesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStarredMessagesModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingTop: 16, paddingBottom: 30 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1F2937' }}>Starred Messages</Text>
            <TouchableOpacity onPress={() => setShowStarredMessagesModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loadingStarred ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6B46C1" />
            </View>
          ) : (
            <FlatList
              data={starredMessages}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: 14,
                    marginVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E9D5FF',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#6B46C1' }}>{item.senderName} ({item.roomName})</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(item.timestamp).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#1F2937' }}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No starred messages yet.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // If a chat is open, show ChatScreen instead of chat list
  if (openChat) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleBackFromChat}
        statusBarTranslucent={true}
      >
        <ChatScreen 
          route={{ params: openChat }}
          navigation={{ 
            ...navigation,
            goBack: handleBackFromChat 
          }}
          onBack={handleBackFromChat}
          ws={ws.current}
        />
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>{filteredChats.length} CONVERSATIONS</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={toggleSearchActive}
            >
              <MaterialCommunityIcons name="magnify" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {
                const options = { mediaType: 'photo', quality: 0.8, saveToPhotos: true };
                launchCamera(options, (response) => {
                  if (response.didCancel) return;
                  if (response.errorCode) {
                    Alert.alert('Camera', 'Could not open camera');
                  }
                });
              }}
            >
              <MaterialCommunityIcons name="camera-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => setShowDropdown(true)}
            >
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown Menu Overlay */}
        <Modal
          visible={showDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.dropdownOverlay} 
            activeOpacity={1} 
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); navigation.navigate('NewGroup'); }}>
                <Text style={[styles.dropdownItemText, { marginLeft: 0 }]}>New group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); setShowCreateCommunityModal(true); }}>
                <Text style={[styles.dropdownItemText, { marginLeft: 0 }]}>New community</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={openStarredModal}>
                <Text style={[styles.dropdownItemText, { marginLeft: 0 }]}>Starred</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); Alert.alert('Coming Soon', 'Read all feature will be available soon.'); }}>
                <Text style={[styles.dropdownItemText, { marginLeft: 0 }]}>Read all</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Search Bar - Always Visible */}
        <Animated.View style={[styles.animatedSearchBar, { opacity: 1 }]}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color="#6B46C1" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.trim() !== '' && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsContainer}
          contentContainerStyle={styles.filterTabsContent}
        >
          {['all', 'unread', 'groups', 'personal', ...(archivedChats.length > 0 ? ['archived'] : [])].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chats List */}
      {loading ? (
        renderSkeletonList()
      ) : filteredChats.length > 0 || archivedChats.length > 0 ? (
        <>
          <FlatList
            data={filteredChats}
            renderItem={renderChat}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={true}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              archivedChats.length > 0 && activeFilter !== 'archived' ? (
                <TouchableOpacity 
                  style={styles.archivedRow}
                  onPress={() => handleFilterChange('archived')}
                >
                  <View style={styles.archivedRowLeft}>
                    <MaterialCommunityIcons name="archive-arrow-down" size={22} color="#6B46C1" />
                    <Text style={styles.archivedRowText}>Archived</Text>
                  </View>
                  <Text style={styles.archivedCount}>{archivedChats.length}</Text>
                </TouchableOpacity>
              ) : activeFilter === 'archived' ? (
                <TouchableOpacity 
                  style={styles.archivedBackRow}
                  onPress={() => handleFilterChange('all')}
                >
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#6B46C1" style={{ marginRight: 8 }} />
                  <Text style={styles.archivedBackText}>Back to Chats</Text>
                </TouchableOpacity>
              ) : null
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={['#6B46C1']}
                tintColor="#6B46C1"
              />
            }
            scrollIndicatorInsets={{ right: 1 }}
          />
        </>
      ) : (
        <View style={{ flex: 1 }}>
          {renderEmptyState()}
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openNewChatModal} activeOpacity={0.8}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="pencil-plus" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* New Chat Modal */}
      {renderNewChatModal()}

      {/* New Community Modal */}
      {renderCreateCommunityModal()}

      {/* Starred Messages Modal */}
      {renderStarredMessagesModal()}

      {/* Options sheet modal */}
      {renderOptionsModal()}
    </View>
  );
};

export default ChatList;
