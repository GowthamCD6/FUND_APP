import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  UIManager,
  Modal,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import styles from './ChatScreenStyle';
import Header from '../../../../../components/HeaderComponent/Header';
import ApiService from '../../../../../services/ApiService';

const { width, height } = Dimensions.get('window');

// Enable long press context menu on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ChatScreen = ({ route, navigation, onBack, ws }) => {
  const insets = useSafeAreaInsets();
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
  const [groupDetails, setGroupDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMsgOptionsModal, setShowMsgOptionsModal] = useState(false);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardChats, setForwardChats] = useState([]);
  const [loadingForward, setLoadingForward] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('smileys');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
  };

  const handleTextInputFocus = () => {
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
  };

  const sendDirectMessage = async (text) => {
    if (!text.trim()) return;

    const tempId = 'temp-' + Date.now();
    const activeReply = replyingTo; // capture active reply
    const newMessage = {
      id: tempId,
      sender: 'user',
      text: text,
      timestamp: new Date(),
      isRead: false,
      status: 'sent',
      replyTo: activeReply ? {
        id: activeReply.id,
        text: activeReply.text
      } : null
    };

    setMessages(prev => [...prev, newMessage]);
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
            replyTo: activeReply?.id || null
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
            replyTo: activeReply?.id || null
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

  const uploadAndSendImage = async (base64, type) => {
    try {
      setIsSending(true);
      const res = await ApiService.makeRequest('/chats/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileBase64: `data:${type};base64,${base64}`
        })
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        await sendDirectMessage(data.fileUrl);
      } else {
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (e) {
      console.log('Error uploading image:', e);
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentOption = (type) => {
    setShowAttachmentModal(false);
    if (type === 'camera') {
      const options = { mediaType: 'photo', quality: 0.8, saveToPhotos: true, includeBase64: true };
      launchCamera(options, (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', 'Could not open camera');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const file = response.assets[0];
          if (file.base64) {
            uploadAndSendImage(file.base64, file.type || 'image/jpeg');
          } else {
            Alert.alert('Error', 'Failed to get image data');
          }
        }
      });
    } else if (type === 'gallery') {
      const options = { mediaType: 'photo', quality: 0.8, includeBase64: true };
      launchImageLibrary(options, (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', 'Could not open image library');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const file = response.assets[0];
          if (file.base64) {
            uploadAndSendImage(file.base64, file.type || 'image/jpeg');
          } else {
            Alert.alert('Error', 'Failed to get image data');
          }
        }
      });
    } else if (type === 'document') {
      sendDirectMessage('📄 Document: invoice_2026.pdf');
    } else if (type === 'audio') {
      sendDirectMessage('🎵 Audio recording (0:30)');
    } else if (type === 'location') {
      sendDirectMessage('📍 Location: https://maps.google.com/?q=12.9716,77.5946');
    } else if (type === 'contact') {
      sendDirectMessage('👤 Contact: GDK Support (+91 98765 43210)');
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:image')) return avatarPath;
    const base = (ApiService.baseURL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api\/?$/, '');
    const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
    return `${base}${path}`;
  };

  // Handle back navigation
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
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

  // Fetch group members & metadata
  const fetchGroupMembers = React.useCallback(async () => {
    try {
      const query = groupId ? `?groupId=${groupId}` : '';
      const res = await ApiService.makeRequest(`/chats/rooms/${chatId}/members${query}`);
      const data = await res.json();
      if (data.success) {
        setGroupMembers(data.members || []);
        if (data.groupInfo) {
          setGroupDetails(data.groupInfo);
        }
      }
    } catch (e) {
      console.log('Error fetching members', e);
    }
  }, [chatId, groupId]);

  useEffect(() => {
    if (isGroup) {
      fetchGroupMembers();
    }
  }, [isGroup, fetchGroupMembers]);

  // Load messages on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await ApiService.makeRequest(`/chats/messages/${chatId}`);
        const data = await response.json();
        if (data.success && data.messages) {
          const formatted = data.messages.map(msg => {
            const isMine = msg.sender_type === 'Admin'; // Admin app — 'Admin' = me
            let status = 'sent';
            if (isMine) {
              status = msg.read_at ? 'read' : 'sent';
            }
            return {
              id: msg.id,
              sender: isMine ? 'user' : 'other',
              text: msg.message,
              timestamp: msg.created_at, // raw string; parsed in formatTime
              isRead: !!msg.read_at,
              status,
              avatar: isMine ? null : chatAvatar,
              senderName: msg.sender_name,
              isStarred: msg.isStarred > 0,
              replyTo: msg.reply_to ? {
                id: msg.reply_to,
                text: msg.replied_to_message
              } : null
            };
          });
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
      ws.send(JSON.stringify({ type: 'mark_read', roomId: chatId }));
    } else {
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'join_room', roomId: chatId }));
        ws.send(JSON.stringify({ type: 'mark_read', roomId: chatId }));
      });
    }
    
    const handleWsMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // New incoming message
        if (payload.type === 'new_message' && payload.data.roomId === chatId) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.data.id)) return prev;
            const filtered = prev.filter(m => !(String(m.id).startsWith('temp-') && m.text === payload.data.message));
            const isMine = payload.data.senderType === 'Admin';
            const newMsg = {
              id: payload.data.id,
              sender: isMine ? 'user' : 'other',
              text: payload.data.message,
              timestamp: payload.data.created_at,
              isRead: false,
              status: isMine ? 'sent' : 'received',
              avatar: isMine ? null : chatAvatar,
              senderName: payload.data.sender_name,
              isStarred: false,
              replyTo: payload.data.reply_to ? {
                id: payload.data.reply_to,
                text: payload.data.replied_to_message
              } : null
            };
            return [...filtered, newMsg];
          });
        }

        // Read receipt — turn my messages blue tick
        if (payload.type === 'read_receipt' && payload.data.roomId === chatId) {
          const readIds = new Set(payload.data.messageIds);
          setMessages(prev =>
            prev.map(msg =>
              readIds.has(msg.id) ? { ...msg, status: 'read', isRead: true } : msg
            )
          );
        }
      } catch (e) {
        console.error('WS error parsing message', e);
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

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendDirectMessage(messageText);
    setMessageText('');
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

  const formatTime = (rawTimestamp) => {
    if (!rawTimestamp) return '';
    let date;
    if (rawTimestamp instanceof Date) {
      // Optimistic sends use new Date() — already correct local time
      date = rawTimestamp;
    } else {
      // Normalize MySQL DATETIME: "2025-07-16 04:27:36" → "2025-07-16T04:27:36Z"
      const str = String(rawTimestamp).trim().replace(' ', 'T');
      date = new Date(str.endsWith('Z') ? str : str + 'Z');
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date separator (Today, Yesterday, or Date)
  const formatDateSeparator = (rawTimestamp) => {
    if (!rawTimestamp) return '';
    let date;
    if (rawTimestamp instanceof Date) {
      date = rawTimestamp;
    } else {
      const str = String(rawTimestamp).trim().replace(' ', 'T');
      date = new Date(str.endsWith('Z') ? str : str + 'Z');
    }
    if (isNaN(date.getTime())) return '';

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
    const parseTs = (ts) => {
      if (ts instanceof Date) return ts;
      const s = String(ts).trim().replace(' ', 'T');
      return new Date(s.endsWith('Z') ? s : s + 'Z');
    };
    return parseTs(currentMsg.timestamp).toDateString() !== parseTs(previousMsg.timestamp).toDateString();
  };

  // Check if messages from same sender should be grouped (within 1 minute)
  const shouldGroupWithPrevious = (currentMsg, previousMsg) => {
    if (!previousMsg || !currentMsg) return false;
    const parseTs = (ts) => {
      if (ts instanceof Date) return ts.getTime();
      const s = String(ts).trim().replace(' ', 'T');
      return new Date(s.endsWith('Z') ? s : s + 'Z').getTime();
    };
    return (
      previousMsg.sender === currentMsg.sender &&
      (parseTs(currentMsg.timestamp) - parseTs(previousMsg.timestamp)) < 60000
    );
  };

  // Handle message long press for context menu
  const handleMessageLongPress = (message) => {
    setSelectedMsgOptions(message);
    setShowMsgOptionsModal(true);
  };

  const handleCopyMessage = (message) => {
    Clipboard.setString(message.text);
    setShowMsgOptionsModal(false);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const handleStarMessage = async (message) => {
    setShowMsgOptionsModal(false);
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
  };

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    setShowMsgOptionsModal(false);
  };

  const handleForwardMessage = async (message) => {
    setShowMsgOptionsModal(false);
    setLoadingForward(true);
    setShowForwardModal(true);
    try {
      const response = await ApiService.makeRequest('/chats');
      const data = await response.json();
      if (data.success) {
        setForwardChats(data.chats || []);
      } else {
        Alert.alert('Error', 'Failed to load chats for forwarding');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoadingForward(false);
    }
  };

  const handleForwardToChat = async (targetChat) => {
    if (!selectedMsgOptions) return;
    Alert.alert(
      'Forward Message',
      `Are you sure you want to forward this message to ${targetChat.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Forward',
          onPress: async () => {
            try {
              setShowForwardModal(false);
              const response = await ApiService.makeRequest('/chats/send', {
                method: 'POST',
                body: JSON.stringify({
                  roomId: targetChat.id,
                  message: selectedMsgOptions.text,
                }),
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', 'Message forwarded successfully');
              } else {
                Alert.alert('Error', 'Failed to forward message');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Network error');
            }
          }
        }
      ]
    );
  };

  const handleDeleteMessage = (message) => {
    setShowMsgOptionsModal(false);
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
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
          }
        }
      ]
    );
  };

  const renderMsgOptionsModal = () => {
    if (!selectedMsgOptions) return null;
    const isStarred = selectedMsgOptions.isStarred;
    const isUser = selectedMsgOptions.sender === 'user';

    return (
      <Modal
        visible={showMsgOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMsgOptionsModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} 
          activeOpacity={1} 
          onPress={() => setShowMsgOptionsModal(false)}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingVertical: 20, paddingBottom: 35 }}>
            {/* Handle bar */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>

            {/* Message Preview */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B46C1' }}>Selected Message</Text>
              <Text style={{ fontSize: 15, color: '#1F2937', marginTop: 4 }} numberOfLines={2}>{selectedMsgOptions.text}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 }} />

            {/* Action Items */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleReplyMessage(selectedMsgOptions)}>
              <MaterialCommunityIcons name="reply" size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                Reply
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleStarMessage(selectedMsgOptions)}>
              <MaterialCommunityIcons name={isStarred ? "star-off" : "star"} size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                {isStarred ? 'Unstar Message' : 'Star Message'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleCopyMessage(selectedMsgOptions)}>
              <MaterialCommunityIcons name="content-copy" size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                Copy Text
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleForwardMessage(selectedMsgOptions)}>
              <MaterialCommunityIcons name="share" size={22} color="#6B46C1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 14 }}>
                Forward Message
              </Text>
            </TouchableOpacity>

            {isUser && (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => handleDeleteMessage(selectedMsgOptions)}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444', marginLeft: 14 }}>
                  Delete Message
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderForwardModal = () => {
    return (
      <Modal
        visible={showForwardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForwardModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingTop: 16, paddingBottom: 30 }}>
            {/* Handle bar */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1F2937' }}>Forward to...</Text>
              <TouchableOpacity onPress={() => setShowForwardModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loadingForward ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6B46C1" />
              </View>
            ) : (
              <FlatList
                data={forwardChats}
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
                    onPress={() => handleForwardToChat(item)}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E9D5FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 16 }}>{item.isGroup ? '👥' : '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>{item.name}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF' }}>No chats available.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Filter messages by search query (forced rebuild)
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // WhatsApp-style tick icons
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        // Single grey tick — sent but not read
        return <MaterialCommunityIcons name="check" size={14} color="rgba(255,255,255,0.6)" />;
      case 'delivered':
        // Double grey tick — delivered but not read
        return <MaterialCommunityIcons name="check-all" size={14} color="rgba(255,255,255,0.6)" />;
      case 'read':
        // Double BLUE tick — recipient has seen the message
        return <MaterialCommunityIcons name="check-all" size={14} color="#60D0FE" />;
      default:
        // Clock icon while sending
        return <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255,255,255,0.5)" />;
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
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
            <View style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 }}>
              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>
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
            {item.replyTo && (
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
                  {item.replyTo.text}
                </Text>
              </View>
            )}

            {/* Message Bubble */}
            <View style={[
              styles.messageBubble,
              isUserMessage ? styles.userBubble : styles.otherBubble,
              isGrouped && (isUserMessage ? styles.groupedUserBubble : styles.groupedOtherBubble),
              (item.text && (item.text.startsWith('http://') || item.text.startsWith('https://')) && (item.text.match(/\.(jpeg|jpg|gif|png|webp)/i) || item.text.includes('/uploads/'))) && { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 16 }
            ]}>
              {(item.text && (item.text.startsWith('http://') || item.text.startsWith('https://')) && (item.text.match(/\.(jpeg|jpg|gif|png|webp)/i) || item.text.includes('/uploads/'))) ? (
                <Image 
                  source={{ uri: item.text.trim() }} 
                  style={{ 
                    width: 220, 
                    height: 220, 
                    borderRadius: 12,
                    backgroundColor: '#F3F4F6'
                  }} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.messageContentRow}>
                  {isGroup && !isUserMessage && (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED', width: '100%', marginBottom: 3 }}>
                      {item.senderName || 'Member'}
                    </Text>
                  )}
                  <Text style={[
                    styles.messageText,
                    isUserMessage && styles.userMessageText,
                  ]}>
                    {item.text}
                  </Text>

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
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
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

  const renderAttachmentModal = () => {
    return (
      <Modal
        visible={showAttachmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} 
          activeOpacity={1} 
          onPress={() => setShowAttachmentModal(false)}
        >
          <View style={{ 
            backgroundColor: '#FFFFFF', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            paddingVertical: 24, 
            paddingHorizontal: 20,
            paddingBottom: 40 
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 20, textAlign: 'center' }}>
              Share Attachment
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <TouchableOpacity style={{ alignItems: 'center', width: '30%', marginVertical: 12 }} onPress={() => handleAttachmentOption('document')}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#5F59F7', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="file-document" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', width: '30%', marginVertical: 12 }} onPress={() => handleAttachmentOption('camera')}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F43F5E', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="camera" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', width: '30%', marginVertical: 12 }} onPress={() => handleAttachmentOption('gallery')}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EC4899', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="image" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', width: '30%', marginVertical: 12 }} onPress={() => handleAttachmentOption('audio')}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="headphones" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', width: '30%', marginVertical: 12 }} onPress={() => handleAttachmentOption('location')}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="map-marker" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Location</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', width: '30%', marginVertical: 12 }} onPress={() => handleAttachmentOption('contact')}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="account" size={26} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
                {isGroup ? `${groupMembers.length || groupDetails?.totalMembers || 0} Members` : (onlineStatus ? 'Online' : 'Offline')}
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
          <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 2 }}>
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
        <View style={[
          styles.inputContainer,
          { paddingBottom: keyboardVisible ? 6 : (insets.bottom > 0 ? insets.bottom + 4 : 8) }
        ]}>
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
            <TouchableOpacity 
              style={styles.attachButton} 
              disabled={isSending}
              onPress={() => setShowAttachmentModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#7C3AED" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#B4B4B4"
              value={messageText}
              onFocus={handleTextInputFocus}
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
              style={styles.emojiButton} 
              disabled={isSending}
              onPress={toggleEmojiPicker}
            >
              <MaterialCommunityIcons 
                name={showEmojiPicker ? "keyboard-outline" : "emoticon-outline"} 
                size={22} 
                color="#B4B4B4" 
              />
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

          {/* Emoji Picker Panel */}
          {showEmojiPicker && (
            <View style={{
              height: 220,
              backgroundColor: '#FFFFFF',
              marginTop: 8,
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              {/* Category tabs */}
              <View style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                backgroundColor: '#F9FAFB',
              }}>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: activeEmojiTab === 'smileys' ? 2 : 0, borderBottomColor: '#7C3AED' }}
                  onPress={() => setActiveEmojiTab('smileys')}
                >
                  <Text style={{ fontSize: 16 }}>😀</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: activeEmojiTab === 'hands' ? 2 : 0, borderBottomColor: '#7C3AED' }}
                  onPress={() => setActiveEmojiTab('hands')}
                >
                  <Text style={{ fontSize: 16 }}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: activeEmojiTab === 'hearts' ? 2 : 0, borderBottomColor: '#7C3AED' }}
                  onPress={() => setActiveEmojiTab('hearts')}
                >
                  <Text style={{ fontSize: 16 }}>❤️</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8, justifyContent: 'space-between' }}>
                {(activeEmojiTab === 'smileys' ? [
                  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🤫', '🫡'
                ] : activeEmojiTab === 'hands' ? [
                  '✍️', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏', '👏', '🤝', '🙌', '👐', '🤲', '💅', '🤳'
                ] : [
                  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔'
                ]).map((emoji, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={{ width: '12%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', margin: 2 }}
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
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
          {/* Header Component */}
          <Header
            title="Group Info"
            onBack={() => setShowGroupInfoModal(false)}
            showBackButton={true}
            showDivider={true}
          />

          <ScrollView style={styles.groupInfoContent} showsVerticalScrollIndicator={false}>
            {/* Top Section (Hero Header) */}
            <View style={styles.groupInfoHeaderSection}>
              <TouchableOpacity style={styles.groupInfoAvatarContainer} onPress={handleChangeGroupPhoto} activeOpacity={0.8}>
                {chatAvatar && (chatAvatar.startsWith('http') || chatAvatar.startsWith('data:image')) ? (
                  <Image source={{ uri: chatAvatar }} style={{ width: 110, height: 110, borderRadius: 55 }} />
                ) : (
                  <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-group" size={56} color="#7C3AED" />
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

              {/* Group Started Date */}
              <View style={styles.groupInfoStartDateRow}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color="#7C3AED" />
                <Text style={styles.groupInfoStartDateText}>
                  Started on: {groupDetails?.startDate ? new Date(groupDetails.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </Text>
              </View>
            </View>

            {/* WhatsApp Native Grey Section Divider */}
            <View style={{ height: 10, backgroundColor: '#F3F4F6', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB' }} />

            {/* WhatsApp Native Group Permissions List */}
            <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
                <MaterialCommunityIcons name="shield-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.6 }}>Group permissions</Text>
              </View>

              {/* Send Messages Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Send group messages</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{groupDetails?.permissions?.sendMessages || 'Only Admins'}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 66 }} />

              {/* Edit Group Info Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Edit group info</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{groupDetails?.permissions?.editGroupInfo || 'Only Admins'}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 66 }} />

              {/* Add Members Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="account-plus-outline" size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Add other members</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{groupDetails?.permissions?.addMembers || 'Only Admins'}</Text>
                </View>
              </View>
            </View>

            {/* WhatsApp Native Grey Section Divider */}
            <View style={{ height: 10, backgroundColor: '#F3F4F6', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB' }} />

            {/* Members Section (Flat Native List with Add Members & Real-Time Profile Photos) */}
            <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>{groupMembers.length} Members</Text>
              </View>
              
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setShowAddUserModal(true)}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="account-plus" size={24} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#7C3AED' }}>Add members</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 76 }} />

              {groupMembers.map((item, idx) => {
                const rawName = item.name || item.user_name || 'Group Member';
                const memberName = String(rawName).match(/^[0-9+ -]+$/) ? `Member ${item.userId || idx + 1}` : rawName;
                const isAdmin = item.role === 'Admin';
                const avatarUrl = getAvatarUrl(item.avatar);

                return (
                  <View key={item.userId || idx}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' }}>
                        {avatarUrl ? (
                          <Image source={{ uri: avatarUrl }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#7C3AED' }}>
                            {memberName.substring(0, 2).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{memberName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {isAdmin && (
                            <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
                              <Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: '700' }}>Group Admin</Text>
                            </View>
                          )}
                          <TouchableOpacity onPress={() => handleRemoveUserFromGroup(item)} style={{ padding: 4 }}>
                            <MaterialCommunityIcons name="account-remove-outline" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {idx < groupMembers.length - 1 && (
                      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 76 }} />
                    )}
                  </View>
                );
              })}
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

      {/* Message options context sheet */}
      {renderMsgOptionsModal()}

      {/* Forward message chat selector modal */}
      {renderForwardModal()}

      {/* Attachment share options modal */}
      {renderAttachmentModal()}

    </SafeAreaView>
  );
};

export default ChatScreen;