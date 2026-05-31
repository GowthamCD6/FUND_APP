import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  UIManager,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './ChatScreenStyle';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';

const { width, height } = Dimensions.get('window');

// Enable long press context menu on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ChatScreen = ({ route, navigation, onBack }) => {
  const { chatId, chatName, chatAvatar } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle back navigation
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  // Mock messages with more details
  const mockMessages = [
    {
      id: 1,
      sender: 'other',
      text: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 5 * 60000),
      avatar: chatAvatar,
      isRead: true,
      status: 'delivered',
    },
    {
      id: 2,
      sender: 'user',
      text: 'I\'m doing great! How about you?',
      timestamp: new Date(Date.now() - 4 * 60000),
      isRead: true,
      status: 'read',
    },
    {
      id: 3,
      sender: 'other',
      text: 'All good! Did you receive the payment confirmation?',
      timestamp: new Date(Date.now() - 3 * 60000),
      avatar: chatAvatar,
      isRead: true,
      status: 'delivered',
    },
    {
      id: 4,
      sender: 'user',
      text: 'Yes, I got it. Thanks for the update!',
      timestamp: new Date(Date.now() - 2 * 60000),
      isRead: true,
      status: 'read',
    },
    {
      id: 5,
      sender: 'other',
      text: 'Great! Let me know if you need anything else.',
      timestamp: new Date(Date.now() - 1 * 60000),
      avatar: chatAvatar,
      isRead: false,
      status: 'sent',
    },
  ];

  // Load messages on component mount
  useEffect(() => {
    const loadMessages = () => {
      try {
        // Replace with actual API call
        // const response = await ApiService.makeRequest(`/user/chats/${chatId}/messages`, { method: 'GET' });
        // setMessages(response.data || []);

        // Using mock data for now
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadMessages, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
      isRead: false,
      status: 'sent',
      repliedTo: replyingTo,
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    setReplyingTo(null);
    setIsSending(true);

    // Auto-scroll
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Replace with actual API call
      // const response = await ApiService.makeRequest('/user/messages/send', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     chatId,
      //     message: messageText,
      //   }),
      // });

      // Simulate API delay with progressive status
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
          )
        );
      }, 300);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'read', isRead: true } : msg
          )
        );
        setIsSending(false);
      }, 800);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date separator (Today, Yesterday, or Date)
  const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // Check if we need to show date separator
  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const previousDate = new Date(previousMsg.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  // Handle message long press for context menu
  const handleMessageLongPress = (message) => {
    setSelectedMessage(message);
    Alert.alert(
      'Message Options',
      '',
      [
        {
          text: 'Copy',
          onPress: () => {
            // Copy to clipboard
            console.log('Copied:', message.text);
          },
        },
        {
          text: 'Reply',
          onPress: () => {
            setReplyingTo(message);
            setSelectedMessage(null);
          },
        },
        {
          text: 'Forward',
          onPress: () => {
            console.log('Forward:', message.text);
          },
        },
        ...(message.sender === 'user'
          ? [
              {
                text: 'Delete',
                onPress: () => {
                  setMessages(messages.filter(msg => msg.id !== message.id));
                },
                style: 'destructive',
              },
            ]
          : []),
        {
          text: 'Cancel',
          onPress: () => setSelectedMessage(null),
          style: 'cancel',
        },
      ]
    );
  };

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Get status icon for message
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <MaterialCommunityIcons name="check" size={12} color="#DDD6FE" />;
      case 'delivered':
        return <MaterialCommunityIcons name="check-all" size={12} color="#DDD6FE" />;
      case 'read':
        return <MaterialCommunityIcons name="check-all" size={12} color="#60A5FA" />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUserMessage = item.sender === 'user';
    const showDateSeparator = shouldShowDateSeparator(item, messages[index - 1]);

    return (
      <View>
        {/* Date Separator */}
        {showDateSeparator && (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>
                {formatDateSeparator(item.timestamp)}
              </Text>
            </View>
          </View>
        )}

        {/* Message */}
        <TouchableOpacity
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.7}
          style={[
            styles.messageContainer,
            isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer,
            selectedMessage?.id === item.id && { backgroundColor: 'rgba(107, 70, 193, 0.1)', borderRadius: 12 },
          ]}
        >
          {!isUserMessage && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>{item.avatar}</Text>
              </View>
            </View>
          )}

          <View style={{ flex: 1 }}>
            {/* Reply Preview */}
            {item.repliedTo && (
              <View style={{
                backgroundColor: isUserMessage ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginBottom: 6,
                borderLeftWidth: 3,
                borderLeftColor: '#6B46C1',
                borderRadius: 4,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: isUserMessage ? '#DDD6FE' : '#6B46C1' }}>
                  Replying to
                </Text>
                <Text style={{ fontSize: 12, color: isUserMessage ? '#E9D5FF' : '#6B7280', marginTop: 2 }}>
                  {item.repliedTo.text}
                </Text>
              </View>
            )}

            {/* Message Bubble */}
            <View style={[
              styles.messageBubble,
              isUserMessage ? styles.userBubble : styles.otherBubble
            ]}>
              <Text style={[
                styles.messageText,
                isUserMessage && styles.userMessageText
              ]}>
                {item.text}
              </Text>

              <View style={styles.messageFooter}>
                <Text style={[
                  styles.timestamp,
                  isUserMessage && styles.userTimestamp
                ]}>
                  {formatTime(item.timestamp)}
                </Text>
                {isUserMessage && getStatusIcon(item.status)}
              </View>
            </View>
          </View>

          {isUserMessage && <View style={styles.spacer} />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Custom Header with Online Status */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={handleGoBack} style={{ marginRight: 16, padding: 4 }}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#6B46C1" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{chatName}</Text>
              <Text style={{ fontSize: 12, color: '#10B981', marginTop: 2 }}>Online</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSearchActive(!searchActive)}
              style={{ padding: 8, borderRadius: 20 }}
            >
              <MaterialCommunityIcons name="magnify" size={24} color="#6B46C1" />
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 8, borderRadius: 20 }}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#6B46C1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {searchActive && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12 }}>
              <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14 }}
                placeholder="Search messages..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B46C1" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : filteredMessages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={filteredMessages}
            renderItem={({ item, index }) => renderMessage({ item, index: filteredMessages.indexOf(item) })}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            scrollEnabled={true}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            scrollEventThrottle={16}
          />
        ) : searchActive && searchQuery.length > 0 ? (
          <View style={styles.emptyMessages}>
            <MaterialCommunityIcons name="magnify" size={50} color="#D1D5DB" />
            <Text style={styles.emptyText}>No messages found</Text>
            <Text style={styles.emptySubtext}>Try a different search</Text>
          </View>
        ) : (
          <View style={styles.emptyMessages}>
            <MaterialCommunityIcons name="chat-outline" size={50} color="#D1D5DB" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          {/* Reply Preview */}
          {replyingTo && (
            <View style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 8,
              borderLeftWidth: 3,
              borderLeftColor: '#6B46C1',
              borderRadius: 4,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B46C1' }}>
                  Replying to {replyingTo.sender === 'user' ? 'yourself' : chatName}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, maxHeight: 30 }} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton} disabled={isSending}>
              <MaterialCommunityIcons name="plus-circle" size={26} color="#6B46C1" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={(text) => {
                setMessageText(text);
                setIsTyping(text.length > 0);
                handleTyping();
              }}
              multiline
              maxLength={1000}
              editable={!isSending}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={isSending || !messageText.trim()}
            >
              {isSending ? (
                <ActivityIndicator size={20} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name={messageText.trim() ? 'send' : 'emoticon-happy-outline'}
                  size={24}
                  color={messageText.trim() ? '#FFFFFF' : '#9CA3AF'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;