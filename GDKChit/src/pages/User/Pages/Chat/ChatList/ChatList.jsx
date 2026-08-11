import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath || typeof avatarPath !== 'string') return null;
  const trimmed = avatarPath.trim();
  if (!trimmed || trimmed.length <= 4 || trimmed.includes('👤') || trimmed.includes('👥') || trimmed.includes('📢') || trimmed.includes('👨‍💻')) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = (ApiService.baseURL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api\/?$/, '');
  return `${base}${cleanPath}`;
};

const { width } = Dimensions.get('window');

const ChatList = ({ navigation }) => {
  // ---- Refs (always first) ----
  const searchAnim = useRef(new Animated.Value(0)).current;
  const ws = useRef(null);

  // ---- State ----
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest'); // 'newest' | 'unread' | 'name'

  // WhatsApp Pinned/Muted/Archived
  const [pinnedChats, setPinnedChats] = useState([]);
  const [mutedChats, setMutedChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);

  // Long-press options modal
  const [selectedChatOptions, setSelectedChatOptions] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Header three-dot menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

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

  const parseJwtUserId = (token) => {
    try {
      if (!token) return 'unknown';
      const base64Url = token.split('.')[1];
      if (!base64Url) return 'unknown';
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = '';
      for (let i = 0; i < padded.length; i += 4) {
        const a = chars.indexOf(padded.charAt(i));
        const b = chars.indexOf(padded.charAt(i + 1));
        const c = chars.indexOf(padded.charAt(i + 2));
        const d = chars.indexOf(padded.charAt(i + 3));
        const bitmap = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
        str += String.fromCharCode((bitmap >> 16) & 255);
        if (c !== 64) str += String.fromCharCode((bitmap >> 8) & 255);
        if (d !== 64) str += String.fromCharCode(bitmap & 255);
      }
      const parsed = JSON.parse(str);
      return parsed.userId || parsed.id || 'unknown';
    } catch (err) {
      return 'unknown';
    }
  };

  useEffect(() => {
    loadChats();

    const unsubscribe = navigation?.addListener ? navigation.addListener('focus', () => {
      loadChats();
    }) : () => {};

    // Setup WebSocket
    const setupWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('userToken');
        const userName = await AsyncStorage.getItem('userName') || '';
        const userRole = await AsyncStorage.getItem('userRole') || 'User';

        if (!token) return;

        const userId = parseJwtUserId(token);
        const userType = userRole || 'User';

        let wsUrl = ApiService.baseURL ? ApiService.baseURL.replace('http', 'ws') : 'ws://localhost:5000';
        wsUrl = wsUrl.replace(/\/api\/admin\/?$/, '').replace(/\/api\/?$/, '');
        wsUrl = `${wsUrl}/api/chat?token=${token}&userId=${userId}&userType=${userType}`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('Chat WebSocket Connected (User)');
        };

        const handleWsMessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message_notification' || payload.type === 'new_message' || payload.type === 'user_presence') {
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
      } catch (e) {
        console.error('Error setting up WS:', e);
      }
    };

    setupWebSocket();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (ws.current) {
        try { ws.current.close(); } catch (e) { }
      }
    };
  }, []);

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

  // Three-dot header menu
  const toggleHeaderMenu = () => setShowHeaderMenu(prev => !prev);

  const handleSortSelect = (mode) => {
    setSortMode(mode);
    setShowHeaderMenu(false);
  };

  const handleMarkAllRead = () => {
    setShowHeaderMenu(false);
    // Optimistically clear unread badges on the UI
    setChats(prev => prev.map(c => ({ ...c, unread: 0 })));
  };

  const renderHeaderMenu = () => {
    if (!showHeaderMenu) return null;
    const sortLabels = { newest: 'Newest First', unread: 'Most Unread', name: 'Name (A–Z)' };
    return (
      <Modal
        visible={showHeaderMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHeaderMenu(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowHeaderMenu(false)}
        >
          {/* Dropdown card anchored top-right */}
          <View style={{
            position: 'absolute',
            top: 60,
            right: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            paddingVertical: 6,
            minWidth: 210,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
          }}>
            {/* Sort section label */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, letterSpacing: 0.8 }}>SORT BY</Text>

            {['newest', 'unread', 'name'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16 }}
                onPress={() => handleSortSelect(mode)}
              >
                <MaterialCommunityIcons
                  name={sortMode === mode ? 'radiobox-marked' : 'radiobox-blank'}
                  size={18}
                  color={sortMode === mode ? '#7C3AED' : '#9CA3AF'}
                />
                <Text style={{ fontSize: 14, fontWeight: sortMode === mode ? '700' : '500', color: sortMode === mode ? '#7C3AED' : '#374151', marginLeft: 10 }}>
                  {sortLabels[mode]}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />

            {/* Mark all read */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16 }}
              onPress={handleMarkAllRead}
            >
              <MaterialCommunityIcons name="check-all" size={18} color="#6B46C1" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 10 }}>Mark all as read</Text>
            </TouchableOpacity>

            {/* View archived (only if any) */}
            {archivedChats.length > 0 && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16 }}
                onPress={() => { setShowHeaderMenu(false); handleFilterChange('archived'); }}
              >
                <MaterialCommunityIcons name="archive-outline" size={18} color="#6B46C1" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 10 }}>Archived ({archivedChats.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const formatTime = (dateInput) => {
    if (!dateInput) return '';
    // Normalize MySQL DATETIME "2025-07-16 04:27:36" → "2025-07-16T04:27:36Z"
    const str = dateInput instanceof Date ? null : String(dateInput).trim().replace(' ', 'T');
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
    setOpenChat(null);
    setSelectedChat(null);
    loadChats();
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
              {getAvatarUrl(item.avatar) ? (
                <Image source={{ uri: getAvatarUrl(item.avatar) }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <MaterialCommunityIcons name={item.isGroup ? "account-group" : "account-circle"} size={30} color={isUnread ? "#FFFFFF" : "#7C3AED"} />
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
    <SafeAreaView style={styles.container}>
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
              onPress={toggleHeaderMenu}
            >
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

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
          {['all', 'personal', 'groups', 'unread', ...(archivedChats.length > 0 ? ['archived'] : [])].map((filter) => (
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
      ) : (
        <View style={{ flex: 1 }}>
          {renderEmptyState()}
        </View>
      )}

      {/* Options sheet modal */}
      {renderOptionsModal()}

      {/* Header three-dot dropdown menu */}
      {renderHeaderMenu()}
    </SafeAreaView>
  );
};

export default ChatList;
