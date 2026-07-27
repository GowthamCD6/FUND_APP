import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  UIManager,
  Modal,
  Image,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import styles from './ChatScreenStyle';
import ApiService from '../../../../../services/ApiService';
import Header from '../../../../../components/HeaderComponent/Header';

// Enable long press context menu on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ChatScreen = ({ route, navigation, onBack, ws }) => {
  const insets = useSafeAreaInsets();
  const { chatId, chatName, chatAvatar, isGroup, groupId } = route.params || {};
  const [showDropdown, setShowDropdown] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupDetails, setGroupDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMsgOptionsModal, setShowMsgOptionsModal] = useState(false);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardChats, setForwardChats] = useState([]);
  const [loadingForward, setLoadingForward] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const onlineStatus = true;
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('smileys');
  const [viewerImageUri, setViewerImageUri] = useState(null);
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
      sendDirectMessage('Document: invoice_2026.pdf');
    } else if (type === 'audio') {
      sendDirectMessage('Audio recording (0:30)');
    } else if (type === 'location') {
      sendDirectMessage('Location: https://maps.google.com/?q=12.9716,77.5946');
    } else if (type === 'contact') {
      sendDirectMessage('Contact: GDK Support (+91 98765 43210)');
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

  // Fetch group members if isGroup on load
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

  const handleOpenGroupInfo = () => {
    setShowDropdown(false);
    fetchGroupMembers();
    setShowGroupInfoModal(true);
  };

  // Load messages on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await ApiService.makeRequest(`/chats/messages/${chatId}`);
        const data = await response.json();
        if (data.success && data.messages) {
          const formatted = data.messages.map(msg => {
            const isMine = msg.sender_type === 'User'; // user app — 'User' = me
            // Determine tick status for my sent messages
            let status = 'sent';
            if (isMine) {
              status = msg.read_at ? 'read' : 'sent';
            }
            return {
              id: msg.id,
              sender: isMine ? 'user' : 'other',
              text: msg.message,
              timestamp: msg.created_at, // keep raw string, parse in formatTime
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
      // Notify server that we've read all messages in this room
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
        if (payload.type === 'new_message' && (payload.data.roomId === chatId || payload.data.sourceRoomId === chatId)) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.data.id)) return prev;
            const filtered = prev.filter(m => !(String(m.id).startsWith('temp-') && m.text === payload.data.message));
            const isMine = payload.data.senderType === 'User';
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

        // Read receipt — upgrade my sent messages to blue tick
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
  }, [ws, chatId, chatAvatar]);

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
      // Also handles ISO strings that already have T and Z
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
        // Single grey tick — sent but not delivered/read
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
                      <MaterialCommunityIcons name={item.isGroup ? "account-group" : "account"} size={22} color="#7C3AED" />
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

  const isImageContent = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return (
      (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) &&
      (trimmed.match(/\.(jpeg|jpg|gif|png|webp)/i) || trimmed.includes('/uploads/'))
    );
  };

  const renderSkeletonMessages = () => (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
      {[
        { isUser: false, width: 210, height: 48 },
        { isUser: true, width: 160, height: 42 },
        { isUser: false, width: 240, height: 54 },
        { isUser: true, width: 190, height: 46 },
        { isUser: false, width: 170, height: 42 },
        { isUser: true, width: 220, height: 52 },
      ].map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            justifyContent: item.isUser ? 'flex-end' : 'flex-start',
            marginVertical: 6,
          }}
        >
          <View
            style={{
              width: item.width,
              height: item.height,
              backgroundColor: item.isUser ? '#E9D5FF' : '#FFFFFF',
              borderRadius: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: item.isUser ? 16 : 4,
              borderBottomRightRadius: item.isUser ? 4 : 16,
              borderWidth: item.isUser ? 0 : 1,
              borderColor: '#E5E7EB',
              padding: 10,
              justifyContent: 'space-around',
            }}
          >
            <View style={{ width: '80%', height: 10, borderRadius: 5, backgroundColor: item.isUser ? '#D8BFD8' : '#E5E7EB' }} />
            <View style={{ width: '45%', height: 8, borderRadius: 4, backgroundColor: item.isUser ? '#D8BFD8' : '#F3F4F6', alignSelf: 'flex-end' }} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderImageViewerModal = () => {
    if (!viewerImageUri) return null;

    return (
      <Modal
        visible={!!viewerImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerImageUri(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
          <SafeAreaView style={{ position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 }}>
            <TouchableOpacity 
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setViewerImageUri(null)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Photo Preview</Text>
            <TouchableOpacity 
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => Alert.alert('Saved', 'Image saved to gallery')}
            >
              <MaterialCommunityIcons name="download" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          <Image
            source={{ uri: viewerImageUri }}
            style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.75 }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    );
  };

  const renderMessage = ({ item, index }) => {
    const isUserMessage = item.sender === 'user';
    const showDateSeparator = shouldShowDateSeparator(item, messages[index - 1]);
    const isGrouped = shouldGroupWithPrevious(item, messages[index - 1]);
    const nextMsg = messages[index + 1];
    const isLastInGroup = !shouldGroupWithPrevious(nextMsg, item);
    const isImg = isImageContent(item.text);

    return (
      <View>
        {/* Date Separator */}
        {showDateSeparator && (
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
            <View style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 }}>
              <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', letterSpacing: 0.2 }}>
                {formatDateSeparator(item.timestamp)}
              </Text>
            </View>
          </View>
        )}

        {/* Message */}
        <TouchableOpacity
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={400}
          activeOpacity={0.8}
          style={[
            styles.messageContainer,
            isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View style={[
            { maxWidth: '88%' },
            isUserMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
          ]}>
            {/* Reply Preview */}
            {item.replyTo && (
              <View style={{
                backgroundColor: isUserMessage ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginBottom: 4,
                borderLeftWidth: 3,
                borderLeftColor: '#7C3AED',
                borderRadius: 6,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isUserMessage ? '#DDD6FE' : '#7C3AED' }}>
                  Replying to
                </Text>
                <Text style={{ fontSize: 12, color: isUserMessage ? '#FFFFFF' : '#4B5563', marginTop: 1 }} numberOfLines={1}>
                  {item.replyTo.text}
                </Text>
              </View>
            )}

            {/* Message Content */}
            {isImg ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setViewerImageUri(item.text.trim())}
                style={styles.imageCardContainer}
              >
                <Image
                  source={{ uri: item.text.trim() }}
                  style={styles.imageMessage}
                  resizeMode="cover"
                />
                <View style={styles.imageGlassOverlay}>
                  {item.isStarred && (
                    <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                  )}
                  <Text style={styles.imageTimestampText}>{formatTime(item.timestamp)}</Text>
                  {isUserMessage && getStatusIcon(item.status)}
                </View>
              </TouchableOpacity>
            ) : item.text && (item.text.startsWith('Document:') || item.text.startsWith('📄 Document:')) ? (
              <View style={[styles.messageBubble, isUserMessage ? styles.userBubble : styles.otherBubble]}>
                <View style={[styles.attachmentCard, isUserMessage ? styles.attachmentUserCard : styles.attachmentOtherCard]}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: isUserMessage ? 'rgba(255,255,255,0.25)' : '#EEF2FF' }]}>
                    <MaterialCommunityIcons name="file-pdf-box" size={26} color={isUserMessage ? "#FFFFFF" : "#7C3AED"} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.attachmentTitle, { color: isUserMessage ? '#FFFFFF' : '#1F2937' }]} numberOfLines={1}>
                      {item.text.replace(/^(📄\s*)?Document:/i, '').trim()}
                    </Text>
                    <Text style={[styles.attachmentSubtitle, { color: isUserMessage ? '#DDD6FE' : '#6B7280' }]}>PDF Document • 250 KB</Text>
                  </View>
                  <MaterialCommunityIcons name="download" size={20} color={isUserMessage ? "#FFFFFF" : "#7C3AED"} />
                </View>
                <View style={styles.messageFooter}>
                  {item.isStarred && (
                    <MaterialCommunityIcons name="star" size={12} color={isUserMessage ? "#E0C3FC" : "#7C3AED"} style={{ marginRight: 2 }} />
                  )}
                  <Text style={[styles.timestamp, isUserMessage && styles.userTimestamp]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {isUserMessage && getStatusIcon(item.status)}
                </View>
              </View>
            ) : item.text && (item.text.startsWith('Audio') || item.text.startsWith('🎵 Audio')) ? (
              <View style={[styles.messageBubble, isUserMessage ? styles.userBubble : styles.otherBubble]}>
                <View style={[styles.attachmentCard, isUserMessage ? styles.attachmentUserCard : styles.attachmentOtherCard]}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: isUserMessage ? 'rgba(255,255,255,0.25)' : '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="play" size={24} color={isUserMessage ? "#FFFFFF" : "#D97706"} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.attachmentTitle, { color: isUserMessage ? '#FFFFFF' : '#1F2937' }]}>Voice Note</Text>
                    <Text style={[styles.attachmentSubtitle, { color: isUserMessage ? '#DDD6FE' : '#6B7280' }]}>0:30 • Audio</Text>
                  </View>
                </View>
                <View style={styles.messageFooter}>
                  {item.isStarred && (
                    <MaterialCommunityIcons name="star" size={12} color={isUserMessage ? "#E0C3FC" : "#7C3AED"} style={{ marginRight: 2 }} />
                  )}
                  <Text style={[styles.timestamp, isUserMessage && styles.userTimestamp]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {isUserMessage && getStatusIcon(item.status)}
                </View>
              </View>
            ) : item.text && (item.text.startsWith('Location:') || item.text.startsWith('📍 Location:')) ? (
              <View style={[styles.messageBubble, isUserMessage ? styles.userBubble : styles.otherBubble]}>
                <View style={[styles.attachmentCard, isUserMessage ? styles.attachmentUserCard : styles.attachmentOtherCard]}>
                  <View style={[styles.attachmentIconContainer, { backgroundColor: isUserMessage ? 'rgba(255,255,255,0.25)' : '#D1FAE5' }]}>
                    <MaterialCommunityIcons name="map-marker" size={24} color={isUserMessage ? "#FFFFFF" : "#059669"} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.attachmentTitle, { color: isUserMessage ? '#FFFFFF' : '#1F2937' }]}>Shared Location</Text>
                    <Text style={[styles.attachmentSubtitle, { color: isUserMessage ? '#DDD6FE' : '#6B7280' }]} numberOfLines={1}>Tap to open map</Text>
                  </View>
                </View>
                <View style={styles.messageFooter}>
                  {item.isStarred && (
                    <MaterialCommunityIcons name="star" size={12} color={isUserMessage ? "#E0C3FC" : "#7C3AED"} style={{ marginRight: 2 }} />
                  )}
                  <Text style={[styles.timestamp, isUserMessage && styles.userTimestamp]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {isUserMessage && getStatusIcon(item.status)}
                </View>
              </View>
            ) : item.text && (item.text.startsWith('Contact:') || item.text.startsWith('👤 Contact:')) ? (
              <View style={[styles.contactCard, isUserMessage ? styles.contactUserCard : styles.contactOtherCard]}>
                <View style={styles.contactHeader}>
                  <View style={[styles.contactAvatar, { backgroundColor: isUserMessage ? 'rgba(255,255,255,0.25)' : '#E9D5FF' }]}>
                    <MaterialCommunityIcons name="account" size={24} color={isUserMessage ? "#FFFFFF" : "#7C3AED"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactNameText, { color: isUserMessage ? '#FFFFFF' : '#1F2937' }]} numberOfLines={1}>
                      {item.text.replace(/^(👤\s*)?Contact:/i, '').trim()}
                    </Text>
                    <Text style={[styles.contactSubText, { color: isUserMessage ? '#DDD6FE' : '#6B7280' }]}>Shared Contact</Text>
                  </View>
                </View>
                <View style={[styles.contactDivider, isUserMessage && { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <TouchableOpacity 
                  style={styles.contactActionBtn} 
                  onPress={() => Alert.alert('Contact', `Messaging ${item.text.replace(/^(👤\s*)?Contact:/i, '').trim()}`)}
                >
                  <Text style={[styles.contactActionText, { color: isUserMessage ? '#FFFFFF' : '#7C3AED' }]}>Message Contact</Text>
                </TouchableOpacity>
                <View style={styles.messageFooter}>
                  {item.isStarred && (
                    <MaterialCommunityIcons name="star" size={12} color={isUserMessage ? "#E0C3FC" : "#7C3AED"} style={{ marginRight: 2 }} />
                  )}
                  <Text style={[styles.timestamp, isUserMessage && styles.userTimestamp]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {isUserMessage && getStatusIcon(item.status)}
                </View>
              </View>
            ) : (
              <View style={[
                styles.messageBubble,
                isUserMessage ? styles.userBubble : styles.otherBubble,
                isGrouped && (isUserMessage ? styles.groupedUserBubble : styles.groupedOtherBubble),
              ]}>
                {isGroup && !isUserMessage && (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED', marginBottom: 3 }}>
                    {item.senderName || 'Member'}
                  </Text>
                )}
                <View style={styles.messageContentRow}>
                  <Text style={[
                    styles.messageText,
                    isUserMessage && styles.userMessageText,
                  ]}>
                    {item.text}
                  </Text>

                  <View style={styles.messageFooter}>
                    {item.isStarred && (
                      <MaterialCommunityIcons name="star" size={12} color={isUserMessage ? "#E0C3FC" : "#7C3AED"} style={{ marginRight: 2 }} />
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
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <MaterialCommunityIcons name="magnify" size={20} color="#7C3AED" />
              <TextInput
                style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 8, color: '#1F2937', fontSize: 14, fontWeight: '500' }}
                placeholder="Search in chat..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 2, marginRight: 4 }}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchActive(false); }} style={{ padding: 2 }}>
                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
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
          renderSkeletonMessages()
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
                  <MaterialCommunityIcons name="emoticon-outline" size={20} color={activeEmojiTab === 'smileys' ? '#7C3AED' : '#9CA3AF'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: activeEmojiTab === 'hands' ? 2 : 0, borderBottomColor: '#7C3AED' }}
                  onPress={() => setActiveEmojiTab('hands')}
                >
                  <MaterialCommunityIcons name="thumb-up-outline" size={20} color={activeEmojiTab === 'hands' ? '#7C3AED' : '#9CA3AF'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: activeEmojiTab === 'hearts' ? 2 : 0, borderBottomColor: '#7C3AED' }}
                  onPress={() => setActiveEmojiTab('hearts')}
                >
                  <MaterialCommunityIcons name="heart-outline" size={20} color={activeEmojiTab === 'hearts' ? '#7C3AED' : '#9CA3AF'} />
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
              <View style={styles.groupInfoAvatarContainer}>
                {chatAvatar && (chatAvatar.startsWith('http') || chatAvatar.startsWith('data:image')) ? (
                  <Image source={{ uri: chatAvatar }} style={{ width: 110, height: 110, borderRadius: 55 }} />
                ) : (
                  <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-group" size={56} color="#7C3AED" />
                  </View>
                )}
              </View>
              
              <View style={styles.groupInfoNameContainer}>
                <Text style={styles.groupInfoNameText}>{groupDetails?.name || chatName}</Text>
              </View>

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

            {/* Members Section (Flat Native List with Real-Time User Profile Photos) */}
            <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>{groupMembers.length} Members</Text>
              </View>

              {groupMembers.map((item, idx) => {
                const rawName = item.name || item.user_name || 'Group Member';
                const memberName = String(rawName).match(/^[0-9+ -]+$/) ? `Member ${item.userId || idx + 1}` : rawName;
                const isAdmin = item.role === 'Admin';
                const avatarUrl = getAvatarUrl(item.avatar);

                return (
                  <View key={item.userId || item.id || idx}>
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
                        {isAdmin && (
                          <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                            <Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: '700' }}>Group Admin</Text>
                          </View>
                        )}
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

      {/* Fullscreen Photo Lightbox Modal */}
      {renderImageViewerModal()}

    </SafeAreaView>
  );
};

export default ChatScreen;