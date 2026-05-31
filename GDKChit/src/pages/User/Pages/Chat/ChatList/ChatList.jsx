import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
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
  const searchAnim = new Animated.Value(0);

  // Mock chats data - will be replaced with API calls
  const mockChats = [
    {
      id: 1,
      name: 'Priya Sharma',
      lastMessage: 'That sounds good! 😊',
      timestamp: new Date(Date.now() - 5 * 60000),
      avatar: '👩‍🦰',
      unread: 2,
      isOnline: true,
      isGroup: false,
      archived: false,
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      lastMessage: 'See you tomorrow!',
      timestamp: new Date(Date.now() - 1 * 60000),
      avatar: '👨‍💼',
      unread: 0,
      isOnline: true,
      isGroup: false,
      archived: false,
    },
    {
      id: 3,
      name: 'Admin Support',
      lastMessage: 'Your payment has been confirmed.',
      timestamp: new Date(Date.now() - 2 * 3600000),
      avatar: '👨‍💻',
      unread: 1,
      isOnline: true,
      isGroup: false,
      archived: false,
    },
    {
      id: 4,
      name: 'Anita Devi',
      lastMessage: 'Thanks for the update!',
      timestamp: new Date(Date.now() - 1 * 86400000),
      avatar: '👩',
      unread: 0,
      isOnline: false,
      isGroup: false,
      archived: false,
    },
    {
      id: 5,
      name: 'Suresh Patel',
      lastMessage: 'Let\'s meet next week',
      timestamp: new Date(Date.now() - 2 * 86400000),
      avatar: '👨',
      unread: 0,
      isOnline: false,
      isGroup: false,
      archived: false,
    },
  ];

  // Load chats on component mount
  useEffect(() => {
    const loadChats = () => {
      try {
        // Using mock data for now
        setChats(mockChats);
        setFilteredChats(mockChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadChats, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    
    const timer = setTimeout(() => {
      setChats(mockChats);
      setFilteredChats(mockChats);
      setRefreshing(false);
    }, 1000);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterChats(text, activeFilter);
  };

  const filterChats = (query, filter) => {
    let filtered = chats;

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
        chat.name.toLowerCase().includes(query.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredChats(filtered);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    filterChats(searchQuery, filter);
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

  const formatTime = (date) => {
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
    // Open ChatScreen within this component instead of navigating
    setOpenChat({
      chatId: chat.id,
      chatName: chat.name,
      chatAvatar: chat.avatar,
    });
  };

  const handleBackFromChat = () => {
    // Return to chat list
    setOpenChat(null);
    setSelectedChat(null);
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
            <View style={[styles.avatarCircle, isUnread && styles.avatarCircleUnread]}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
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
      <TouchableOpacity style={styles.emptyStateButton}>
        <MaterialCommunityIcons name="pencil-plus" size={22} color="#FFFFFF" />
        <Text style={styles.emptyStateButtonText}>Compose Message</Text>
      </TouchableOpacity>
    </View>
  );

  // If a chat is open, show ChatScreen instead of chat list
  if (openChat) {
    return (
      <ChatScreen 
        route={{ params: openChat }}
        navigation={{ 
          ...navigation,
          goBack: handleBackFromChat 
        }}
        onBack={handleBackFromChat}
      />
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
            <TouchableOpacity style={[styles.headerIconButton, styles.headerIconButtonPrimary]}>
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
