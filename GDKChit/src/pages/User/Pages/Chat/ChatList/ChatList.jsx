import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './ChatListStyles';
import ApiService from '../../../../../services/ApiService';
import ChatScreen from '../ChatScreen/ChatScreen';

const { width } = Dimensions.get('window');

const ChatList = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // We'll add new hooks at the end, but since this might cause a fast refresh error, 
  // the user might need to reload the app.
  const searchAnim = useRef(new Animated.Value(0)).current;
  const [sortMode, setSortMode] = useState('newest'); // 'newest', 'unread', 'name'
  const ws = useRef(null);

  // Load chats from API
  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.makeRequest('/chats');
      const data = await response.json();
      if (data.success) {
        setChats(data.chats || []);
        applyFiltersAndSort(data.chats || [], searchQuery, activeFilter, sortMode);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChats();

    // Setup WebSocket
    const setupWebSocket = async () => {
      try {
        // Read accessToken (the key ApiService stores the JWT under)
        const token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('userToken');
        
        // Read user info from individual AsyncStorage keys
        const userName = await AsyncStorage.getItem('userName') || '';
        const userRole = await AsyncStorage.getItem('userRole') || 'User';
        
        if (!token) return;

        // Decode JWT for userId
        let userId = 'unknown';
        try {
          const payloadBase64 = token.split('.')[1];
          const payload = JSON.parse(atob(payloadBase64));
          userId = payload.userId || payload.id || 'unknown';
        } catch (e) {
          console.warn('Could not decode JWT for userId:', e);
        }

        const userType = userRole || 'User';
        
        // Convert http:// API_URL to ws:// and use correct /api/chat path
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
            if (payload.type === 'new_message_notification' || payload.type === 'new_message') {
              loadChats();
            }
          } catch(e) {}
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
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFiltersAndSort(chats, text, activeFilter, sortMode);
  };

  // Combined filter + sort logic
  const applyFiltersAndSort = (chatList, query, filter, sort) => {
    let filtered = [...chatList];

    // Apply filter type
    if (filter === 'unread') {
      filtered = filtered.filter(chat => chat.unread > 0);
    } else if (filter === 'groups') {
      filtered = filtered.filter(chat => chat.isGroup);
    } else if (filter === 'archived') {
      filtered = filtered.filter(chat => chat.archived);
    }

    // Apply search query
    if (query.trim() !== '') {
      filtered = filtered.filter(chat =>
        (chat.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (chat.lastMessage || '').toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply sort
    if (sort === 'unread') {
      filtered.sort((a, b) => (b.unread || 0) - (a.unread || 0));
    } else if (sort === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // 'newest'
      filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }

    setFilteredChats(filtered);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFiltersAndSort(chats, searchQuery, filter, sortMode);
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

  // Tune button — cycle sort modes
  const handleTunePress = () => {
    const modes = ['newest', 'unread', 'name'];
    const currentIndex = modes.indexOf(sortMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setSortMode(nextMode);
    applyFiltersAndSort(chats, searchQuery, activeFilter, nextMode);
  };

  const formatTime = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInMinutes / 1440);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString('en-IN', { day: 'short', month: 'short' });
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

  const renderChat = ({ item, index }) => {
    const isSelected = selectedChat === item.id;
    const isUnread = item.unread > 0;
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
              <Text 
                style={[
                  styles.chatName,
                  isUnread && styles.chatNameUnread,
                ]} 
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[styles.timestamp, isUnread && styles.timestampUnread]}>
                {formatTime(item.timestamp)}
              </Text>
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
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <MaterialCommunityIcons name="chat-outline" size={100} color="#E9D5FF" />
      </View>
      <Text style={styles.emptyStateText}>Start Conversations</Text>
      <Text style={styles.emptyStateSubtext}>
        Connect with your group members and start meaningful conversations today
      </Text>
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
              <MaterialCommunityIcons name="magnify" size={24} color="#6B46C1" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerIconButton, styles.headerIconButtonPrimary]}
              onPress={handleTunePress}
            >
              <MaterialCommunityIcons name="tune" size={24} color="#FFFFFF" />
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
          {['all', 'unread', 'groups', 'archived'].map((filter) => (
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filteredChats.length > 0 ? (
        <>
          <View style={styles.recentLabelContainer}>
            <View style={styles.recentLabelLine} />
            <Text style={styles.recentLabel}>RECENT</Text>
            <View style={styles.recentLabelLine} />
          </View>
          <FlatList
            data={filteredChats}
            renderItem={renderChat}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={true}
            contentContainerStyle={styles.listContainer}
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
    </SafeAreaView>
  );
};

export default ChatList;
