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

const ChatScreen = ({ route, navigation, onBack, ws }) => {
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
  const [onlineStatus, setOnlineStatus] = useState(true);

  // Handle back navigation
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  // Load messages on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await ApiService.makeRequest(`/chats/messages/${chatId}`);
        const data = await response.json();
        if (data.success && data.messages) {
          const formatted = data.messages.map(msg => ({
            id: msg.id,
            sender: msg.sender_type === 'User' ? 'user' : 'other', // User app perspective
            text: msg.message,
            timestamp: new Date(msg.created_at),
            isRead: msg.is_read === 1,
            status: 'read',
            avatar: msg.sender_type === 'User' ? null : chatAvatar,
            senderName: msg.sender_name
          }));
          setMessages(formatted);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chatId]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return;
    
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'join_room', roomId: chatId }));
    } else {
      // If not yet open, send once it opens
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'join_room', roomId: chatId }));
      });
    }
    
    const handleWsMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'new_message' && payload.data.roomId === chatId) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.data.id)) return prev;
            
            // Remove matching temp message if it exists
            const filtered = prev.filter(m => !(String(m.id).startsWith('temp-') && m.text === payload.data.message));
            
            const newMsg = {
              id: payload.data.id,
              sender: payload.data.senderType === 'User' ? 'user' : 'other',
              text: payload.data.message,
              timestamp: new Date(payload.data.created_at),
              isRead: true,
              status: 'read',
              avatar: payload.data.senderType === 'User' ? null : chatAvatar,
              senderName: payload.data.sender_name
            };
            return [...filtered, newMsg];
          });
        }
      } catch (e) {
        console.error("WS error parsing message", e);
      }
    };
    
    ws.addEventListener('message', handleWsMessage);
    
    return () => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'leave_room', roomId: chatId }));
      }
      ws.removeEventListener('message', handleWsMessage);
    };
  }, [ws, chatId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const tempId = 'temp-' + Date.now();
    const newMessage = {
      id: tempId,
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
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'send_message',
          data: {
            roomId: chatId,
            text: newMessage.text,
          }
        }));
        
        // Optimistically set to delivered
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === tempId ? { ...msg, status: 'delivered' } : msg
            )
          );
          setIsSending(false);
        }, 300);
      } else {
        // Fallback to HTTP if WS is down
        const response = await ApiService.makeRequest('/chats/send', {
          method: 'POST',
          body: JSON.stringify({
            roomId: chatId,
            message: newMessage.text,
          }),
        });
        const data = await response.json();
        
        if (data.success) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === tempId ? { 
                ...msg, 
                id: data.data.id,
                status: 'read', 
                isRead: true 
              } : msg
            )
          );
        }
        setIsSending(false);
      }
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
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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

  // Check if messages from same sender should be grouped
  const shouldGroupWithPrevious = (currentMsg, previousMsg) => {
    if (!previousMsg || !currentMsg) return false;
    return (
      previousMsg.sender === currentMsg.sender &&
      (new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp)) < 60000 // Within 1 minute
    );
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
        return <MaterialCommunityIcons name="check" size={14} color="#E0C3FC" />;
      case 'delivered':
        return <MaterialCommunityIcons name="check-all" size={14} color="#E0C3FC" />;
      case 'read':
        return <MaterialCommunityIcons name="check-all" size={14} color="#FFFFFF" />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUserMessage = item.sender === 'user';
    const showDateSeparator = shouldShowDateSeparator(item, messages[index - 1]);
    const isGrouped = shouldGroupWithPrevious(item, messages[index - 1]);
    const nextMsg = messages[index + 1];
    const isLastInGroup = !shouldGroupWithPrevious(nextMsg, item);

    return (
      <View>
        {/* Date Separator */}
        {showDateSeparator && (
          <View style={{ alignItems: 'center', marginVertical: 8, marginTop: 2 }}>
            <View style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
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
            !isLastInGroup && { marginBottom: -2 },
            isGrouped && { marginTop: -2 },
          ]}
        >
          <View style={[
            { maxWidth: '85%' },
            isUserMessage && { alignItems: 'flex-start' },
            !isUserMessage && { alignItems: 'flex-end' },
          ]}>
            {/* Reply Preview */}
            {item.repliedTo && (
              <View style={{
                backgroundColor: isUserMessage ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#7C3AED',
                borderRadius: 4,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: isUserMessage ? '#DDD6FE' : '#7C3AED' }}>
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
              isUserMessage ? styles.userBubble : styles.otherBubble,
              isGrouped && (isUserMessage ? styles.groupedUserBubble : styles.groupedOtherBubble),
            ]}>
              <Text style={[
                styles.messageText,
                isUserMessage && styles.userMessageText,
                { textAlign: isUserMessage ? 'left' : 'right' }
              ]}>
                {item.text}
              </Text>

              {isLastInGroup && (
                <View style={styles.messageFooter}>
                  <Text style={[
                    styles.timestamp,
                    isUserMessage && styles.userTimestamp
                  ]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {isUserMessage && getStatusIcon(item.status)}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F1F7" />
      
      {/* Enhanced Header with Profile Info - Exact Match */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWithStatus}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{chatAvatar}</Text>
              </View>
              {onlineStatus && <View style={styles.onlineStatusDot} />}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{chatName}</Text>
              <Text style={styles.profileStatus}>Online</Text>
            </View>
          </View>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <MaterialCommunityIcons name="magnify" size={24} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
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
              backgroundColor: '#E9D5FF',
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
              borderLeftWidth: 3,
              borderLeftColor: '#7C3AED',
              borderRadius: 6,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#7C3AED' }}>
                  Replying to {replyingTo.sender === 'user' ? 'yourself' : chatName}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B46C1', marginTop: 2, maxHeight: 30 }} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton} disabled={isSending}>
              <MaterialCommunityIcons name="plus" size={24} color="#7C3AED" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#B4B4B4"
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

            <TouchableOpacity style={styles.emojiButton} disabled={isSending}>
              <MaterialCommunityIcons name="emoticon-outline" size={22} color="#B4B4B4" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={isSending || !messageText.trim()}
            >
              {isSending ? (
                <ActivityIndicator size={16} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name="send"
                  size={18}
                  color="#FFFFFF"
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