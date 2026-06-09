import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  UIManager,
  Modal,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import styles from './ChatScreenStyle';
import ApiService from '../../../../../services/ApiService';

// Enable long press context menu on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ChatScreen = ({ route, navigation, onBack, ws }) => {
  const { chatId, chatName, chatAvatar, isGroup } = route.params || {};
  const [showDropdown, setShowDropdown] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const onlineStatus = true;
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);

  // Handle back navigation
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleOpenGroupInfo = () => {
    setShowDropdown(false);
    fetchGroupMembers();
    setShowGroupInfoModal(true);
  };

  const handleDeleteChat = async () => {
    try {
      const res = await ApiService.makeRequest('/chats/rooms/delete', {
        method: 'POST',
        body: JSON.stringify({ roomId: chatId })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Chat deleted successfully', [
          { text: 'OK', onPress: () => handleGoBack() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to delete chat');
      }
    } catch (e) {
      console.log('Error deleting chat', e);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const confirmDeleteChat = () => {
    setShowDropdown(false);
    Alert.alert(
      'Delete Chat',
      isGroup 
        ? 'Are you sure you want to delete this group chat and all its messages?' 
        : 'Are you sure you want to delete this chat and all its messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: handleDeleteChat, style: 'destructive' }
      ]
    );
  };

  // Fetch group members if isGroup on load
  const fetchGroupMembers = React.useCallback(async () => {
    try {
      const res = await ApiService.makeRequest(`/chats/rooms/${chatId}/members`);
      const data = await res.json();
      if (data.success) setGroupMembers(data.members || []);
    } catch (e) {
      console.log('Error fetching members', e);
    }
  }, [chatId]);

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
            senderName: msg.sender_name,
            isStarred: msg.isStarred > 0
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
  }, [chatId, chatAvatar]);

  useEffect(() => {
    if (isGroup) {
      fetchGroupMembers();
    }
  }, [isGroup, fetchGroupMembers]);

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
        if (payload.type === 'new_message' && (payload.data.roomId === chatId || payload.data.sourceRoomId === chatId)) {
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
              senderName: payload.data.sender_name,
              isStarred: false
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
  }, [ws, chatId, chatAvatar]);

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
    Alert.alert(
      'Message Options',
      '',
      [
        {
          text: 'Copy',
          onPress: () => {
            Clipboard.setString(message.text);
          },
        },
        {
          text: message.isStarred ? 'Unstar Message' : 'Star Message',
          onPress: async () => {
            try {
              const res = await ApiService.makeRequest('/chats/messages/star', {
                method: 'POST',
                body: JSON.stringify({
                  messageId: message.id,
                  isStarred: !message.isStarred
                })
              });
              const data = await res.json();
              if (data.success) {
                setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isStarred: !m.isStarred } : m));
              } else {
                Alert.alert('Error', data.message || 'Failed to update star status');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Network error');
            }
          }
        },
        {
          text: 'Reply',
          onPress: () => {
            setReplyingTo(message);
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
                  // Call backend API to delete message
                  ApiService.makeRequest('/chats/delete', {
                    method: 'POST',
                    body: JSON.stringify({ messageId: message.id }),
                  })
                    .then(response => response.json())
                    .then(data => {
                      if (data.success) {
                        setMessages(messages.filter(msg => msg.id !== message.id));
                      } else {
                        Alert.alert('Error', data.message || 'Failed to delete message');
                      }
                    })
                    .catch(err => {
                      console.error('Delete message error:', err);
                      Alert.alert('Error', 'Failed to connect to server');
                    });
                },
                style: 'destructive',
              },
            ]
          : []),
        {
          text: 'Cancel',
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

              {(isLastInGroup || item.isStarred) && (
                <View style={styles.messageFooter}>
                  {item.isStarred && (
                    <MaterialCommunityIcons name="star" size={12} color={isUserMessage ? "#E0C3FC" : "#7C3AED"} style={{ marginRight: 4 }} />
                  )}
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Enhanced Header with Profile Info - Exact Match */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          
          {/* Profile Section */}
          <TouchableOpacity style={styles.profileSection} onPress={() => { if(isGroup) handleOpenGroupInfo(); }} activeOpacity={isGroup ? 0.7 : 1}>
            <View style={styles.avatarWithStatus}>
              <View style={styles.profileAvatar}>
                {chatAvatar && (chatAvatar.startsWith('http') || chatAvatar.startsWith('data:image')) ? (
                  <Image source={{ uri: chatAvatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                ) : (
                  <MaterialCommunityIcons name={isGroup ? "account-group" : "account"} size={30} color="#7C3AED" />
                )}
              </View>
              {onlineStatus && <View style={styles.onlineStatusDot} />}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{chatName}</Text>
              <Text style={styles.profileStatus}>
                {isGroup ? `${groupMembers.length > 0 ? groupMembers.length : ''} Members` : (onlineStatus ? 'Online' : 'Offline')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setSearchActive(!searchActive)}>
              <MaterialCommunityIcons name="magnify" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowDropdown(!showDropdown)}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#000" />
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {isGroup && (
                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={() => {
                      setShowDropdown(false);
                      handleOpenGroupInfo();
                    }}
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color="#7C3AED" />
                    <Text style={styles.dropdownItemText}>Group Info</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => {
                    setShowDropdown(false);
                    setShowStarredModal(true);
                  }}
                >
                  <MaterialCommunityIcons name="star-outline" size={20} color="#F59E0B" />
                  <Text style={styles.dropdownItemText}>Starred Messages</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={confirmDeleteChat}
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                  <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Delete Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Search Bar - Conditional */}
        {searchActive && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, color: '#1F2937', fontSize: 14 }}
                placeholder="Search in chat..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
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
      {/* Group Info Full Modal */}
      <Modal visible={showGroupInfoModal} animationType="slide" onRequestClose={() => setShowGroupInfoModal(false)}>
        <SafeAreaView style={styles.groupInfoModalOverlay}>
          {/* Header */}
          <View style={styles.groupInfoModalHeader}>
            <TouchableOpacity onPress={() => setShowGroupInfoModal(false)}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.groupInfoModalTitle}>Group Info</Text>
          </View>

          <ScrollView style={styles.groupInfoContent}>
            {/* Top Section (Avatar & Name) */}
            <View style={styles.groupInfoHeaderSection}>
              <View style={styles.groupInfoAvatarContainer}>
                {chatAvatar && (chatAvatar.startsWith('http') || chatAvatar.startsWith('data:image')) ? (
                  <Image source={{ uri: chatAvatar }} style={{ width: 120, height: 120, borderRadius: 60 }} />
                ) : (
                  <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-group" size={60} color="#9CA3AF" />
                  </View>
                )}
              </View>
              
              <View style={styles.groupInfoNameContainer}>
                <Text style={styles.groupInfoNameText}>{chatName}</Text>
              </View>
            </View>

            {/* Members Section */}
            <View style={styles.groupInfoMembersSection}>
              <Text style={styles.groupInfoMembersHeader}>{groupMembers.length} Members</Text>

              {groupMembers.map((item) => (
                <View key={item.userId || item.id} style={styles.groupInfoMemberItem}>
                  <View style={styles.groupInfoMemberAvatar}>
                    {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                      <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <Text style={styles.userListAvatarText}>
                        {(item.name || 'U').substring(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.groupInfoMemberInfo}>
                    <Text style={styles.groupInfoMemberName}>{item.name}</Text>
                    <Text style={styles.groupInfoMemberPhone}>{item.phone}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Starred Messages Modal */}
      <Modal
        visible={showStarredModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStarredModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingTop: 16, paddingBottom: 30 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1F2937' }}>Starred Messages</Text>
              <TouchableOpacity onPress={() => setShowStarredModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={messages.filter(m => m.isStarred)}
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
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#6B46C1' }}>
                      {item.sender === 'user' ? 'You' : (item.senderName || 'Other')}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#1F2937' }}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No starred messages in this chat.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ChatScreen;