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
  Modal,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchImageLibrary } from 'react-native-image-picker';
import styles from './ChatScreenStyle';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';

const { width, height } = Dimensions.get('window');

// Enable long press context menu on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ChatScreen = ({ route, navigation, onBack, ws }) => {
  const { chatId, chatName, chatAvatar, isGroup, groupId } = route.params || {};
  const [localChatName, setLocalChatName] = useState(chatName);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRemoveUserModal, setShowRemoveUserModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
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
            sender: msg.sender_type === 'Admin' ? 'user' : 'other', // Admin app perspective
            text: msg.message,
            timestamp: new Date(msg.created_at),
            isRead: msg.is_read === 1,
            status: 'read',
            avatar: msg.sender_type === 'Admin' ? null : chatAvatar,
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
  }, [chatId]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return;
    
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'join_room', roomId: chatId }));
    } else {
      // If not yet open, send once it opens. Our WS wrapper or logic might need this.
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
            
            // Remove matching temp message if it exists (same text, sent within last 3 seconds)
            const filtered = prev.filter(m => !(String(m.id).startsWith('temp-') && m.text === payload.data.message));
            
            const newMsg = {
              id: payload.data.id,
              sender: payload.data.senderType === 'Admin' ? 'user' : 'other',
              text: payload.data.message,
              timestamp: new Date(payload.data.created_at),
              isRead: true,
              status: 'read',
              avatar: payload.data.senderType === 'Admin' ? null : chatAvatar,
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
        
        // Optimistically set to delivered, the WebSocket listener will replace it with the real message
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
            Clipboard.setString(message.text);
            setSelectedMessage(null);
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
            setSelectedMessage(null);
          }
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
            setSelectedMessage(null);
          },
        },
        ...(message.sender === 'user'
          ? [
              {
                text: 'Delete',
                onPress: () => {
                  // Call backend API to delete message
                  ApiService.makeRequest('/chats/delete', 'POST', { messageId: message.id })
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

  const fetchGroupMembers = async () => {
    try {
      const res = await ApiService.makeRequest('/admin/groups/getMembers?groupId=' + groupId);
      const data = await res.json();
      if (data.success) setGroupMembers(data.members || []);
    } catch (e) {
      console.log('Error fetching members', e);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await ApiService.makeRequest('/admin/users/getAllUsers');
      const data = await res.json();
      if (data.success) setAllUsers(data.users || []);
    } catch (e) {
      console.log('Error fetching users', e);
    }
  };

  const handleOpenAddUser = () => {
    setShowDropdown(false);
    fetchGroupMembers();
    fetchAllUsers();
    setShowAddUserModal(true);
  };

  const handleOpenRemoveUser = () => {
    setShowDropdown(false);
    fetchGroupMembers();
    setShowRemoveUserModal(true);
  };

  const handleAddUserToGroup = async (user) => {
    try {
      const res = await ApiService.makeRequest('/admin/groups/addMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId, members: [user] })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'User added to group');
        setShowAddUserModal(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to add user');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleRemoveUserFromGroup = async (user) => {
    try {
      const res = await ApiService.makeRequest('/admin/groups/removeMembers', {
        method: 'POST',
        body: JSON.stringify({ groupId, members: [{ id: user.userId || user.id }] })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'User removed from group');
        setShowRemoveUserModal(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to remove user');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleChangeGroupPhoto = async () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.5 }, async (response) => {
      if (response.didCancel || response.errorCode || !response.assets) return;
      const base64 = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
      try {
        const res = await ApiService.makeRequest('/chats/groups/updateAvatar', {
          method: 'POST',
          body: JSON.stringify({ groupId, avatarBase64: base64 })
        });
        const data = await res.json();
        if (data.success) {
          Alert.alert('Success', 'Group photo updated!');
        } else {
          Alert.alert('Error', data.message || 'Failed to update photo');
        }
      } catch (e) {
        Alert.alert('Error', 'Something went wrong');
      }
    });
  };

  const handleOpenGroupInfo = () => {
    setShowDropdown(false);
    fetchGroupMembers();
    fetchAllUsers();
    setNewGroupName(localChatName);
    setShowGroupInfoModal(true);
  };

  const handleRenameGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await ApiService.makeRequest('/admin/groups/renameGroup', {
        method: 'POST',
        body: JSON.stringify({ groupId, groupName: newGroupName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setLocalChatName(newGroupName.trim());
        setShowRenameDialog(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to rename group');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
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
              <Text style={styles.profileName} numberOfLines={1}>
                {localChatName}
              </Text>
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
            <TouchableOpacity style={styles.iconButton} onPress={() => { if(isGroup) setShowDropdown(!showDropdown); }}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#000" />
            </TouchableOpacity>
            
            {showDropdown && isGroup && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity style={styles.dropdownItem} onPress={handleOpenGroupInfo}>
                  <MaterialCommunityIcons name="information-outline" size={20} color="#7C3AED" />
                  <Text style={styles.dropdownItemText}>Group Info</Text>
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
      {/* Add User Modal */}
      <Modal visible={showAddUserModal} transparent animationType="fade" onRequestClose={() => setShowAddUserModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add User to Group</Text>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allUsers.filter(u => !groupMembers.find(m => m.userId === u.id))}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.userListItem}>
                  <View style={styles.userListItemLeft}>
                    <View style={styles.userListAvatar}>
                      {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                        <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                      ) : (
                        <MaterialCommunityIcons name="account" size={24} color="#7C3AED" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.userListName}>{item.name || item.nick_name}</Text>
                      <Text style={styles.userListPhone}>{item.phone}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.addUserButton} onPress={() => handleAddUserToGroup(item)}>
                    <Text style={styles.actionButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No available users to add.</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Remove User Modal */}
      <Modal visible={showRemoveUserModal} transparent animationType="fade" onRequestClose={() => setShowRemoveUserModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove User</Text>
              <TouchableOpacity onPress={() => setShowRemoveUserModal(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={groupMembers}
              keyExtractor={(item) => item.userId.toString()}
              renderItem={({ item }) => (
                <View style={styles.userListItem}>
                  <View style={styles.userListItemLeft}>
                    <View style={styles.userListAvatar}>
                      {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                        <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                      ) : (
                        <MaterialCommunityIcons name="account" size={24} color="#7C3AED" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.userListName}>{item.name}</Text>
                      <Text style={styles.userListPhone}>{item.phone}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.removeUserButton} onPress={() => handleRemoveUserFromGroup(item)}>
                    <Text style={styles.actionButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No members found.</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal visible={showAddUserModal} transparent animationType="fade" onRequestClose={() => setShowAddUserModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add User to Group</Text>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allUsers.filter(u => !groupMembers.find(m => m.userId === u.id))}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.userListItem}>
                  <View style={styles.userListItemLeft}>
                    <View style={styles.userListAvatar}>
                      <Text style={styles.userListAvatarText}>{(item.name || item.nick_name || 'U').substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.userListName}>{item.name || item.nick_name}</Text>
                      <Text style={styles.userListPhone}>{item.phone}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.addUserButton} onPress={() => handleAddUserToGroup(item)}>
                    <Text style={styles.actionButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No available users to add.</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Remove User Modal */}
      <Modal visible={showRemoveUserModal} transparent animationType="fade" onRequestClose={() => setShowRemoveUserModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove User</Text>
              <TouchableOpacity onPress={() => setShowRemoveUserModal(false)} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={groupMembers}
              keyExtractor={(item) => item.userId.toString()}
              renderItem={({ item }) => (
                <View style={styles.userListItem}>
                  <View style={styles.userListItemLeft}>
                    <View style={styles.userListAvatar}>
                      <Text style={styles.userListAvatarText}>{item.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.userListName}>{item.name}</Text>
                      <Text style={styles.userListPhone}>{item.phone}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.removeUserButton} onPress={() => handleRemoveUserFromGroup(item)}>
                    <Text style={styles.actionButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No members found.</Text>}
            />
          </View>
        </View>
      </Modal>

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
              <TouchableOpacity style={styles.groupInfoAvatarContainer} onPress={handleChangeGroupPhoto} activeOpacity={0.8}>
                {chatAvatar && (chatAvatar.startsWith('http') || chatAvatar.startsWith('data:image')) ? (
                  <Image source={{ uri: chatAvatar }} style={{ width: 120, height: 120, borderRadius: 60 }} />
                ) : (
                  <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-group" size={60} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.groupInfoAvatarEditIcon}>
                  <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.groupInfoNameContainer} onPress={() => setShowRenameDialog(true)}>
                <Text style={styles.groupInfoNameText}>{localChatName}</Text>
                <MaterialCommunityIcons name="pencil" size={20} color="#7C3AED" />
              </TouchableOpacity>
            </View>

            {/* Members Section */}
            <View style={styles.groupInfoMembersSection}>
              <Text style={styles.groupInfoMembersHeader}>{groupMembers.length} Members</Text>
              
              <TouchableOpacity style={styles.groupInfoAddMemberButton} onPress={() => setShowAddUserModal(true)}>
                <View style={styles.groupInfoAddMemberIconContainer}>
                  <MaterialCommunityIcons name="account-plus" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.groupInfoAddMemberText}>Add members</Text>
              </TouchableOpacity>

              {groupMembers.map((item) => (
                <View key={item.userId} style={styles.groupInfoMemberItem}>
                  <View style={styles.groupInfoMemberAvatar}>
                    {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')) ? (
                      <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <MaterialCommunityIcons name="account" size={24} color="#9CA3AF" />
                    )}
                  </View>
                  <View style={styles.groupInfoMemberInfo}>
                    <Text style={styles.groupInfoMemberName}>{item.name}</Text>
                    <Text style={styles.groupInfoMemberPhone}>{item.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveUserFromGroup(item)} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="account-remove" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Rename Dialog */}
      <Modal visible={showRenameDialog} transparent animationType="fade" onRequestClose={() => setShowRenameDialog(false)}>
        <View style={styles.renameDialogOverlay}>
          <View style={styles.renameDialogContainer}>
            <Text style={styles.renameDialogTitle}>Enter new subject</Text>
            <TextInput
              style={styles.renameDialogInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
              maxLength={25}
            />
            <View style={styles.renameDialogActions}>
              <TouchableOpacity style={[styles.renameDialogButton, styles.renameDialogButtonCancel]} onPress={() => setShowRenameDialog(false)}>
                <Text style={styles.renameDialogButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.renameDialogButton, styles.renameDialogButtonSave]} onPress={handleRenameGroup}>
                <Text style={styles.renameDialogButtonSaveText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ChatScreen;