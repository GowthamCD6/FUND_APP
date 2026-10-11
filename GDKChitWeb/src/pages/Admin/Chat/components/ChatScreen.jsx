import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, tokenStore, API_URL } from '../../../../api/apiClient.js';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { 
  Users as RiGroupLine, 
  User as RiUserLine, 
  Check as RiCheckLine, 
  CheckCheck as RiCheckCheckLine, 
  MoreVertical as RiMore2Fill, 
  Star as RiStarLine, 
  Trash2 as RiDeleteBinLine, 
  Info as RiInformationLine,
  Search as RiSearchLine,
  Plus as RiPlusLine,
  Smile as RiSmileLine,
  ChevronLeft as RiChevronLeftLine,
  X as RiCloseLine,
  ArrowLeft as RiArrowLeftLine,
  Send as RiSendLine
} from 'lucide-react';

const ChatScreen = ({ chat, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);
  
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupMembers = async () => {
    try {
      let url = `/chats/rooms/${chat.chatId}/members`;
      if (chat.groupId) {
        url = `/admin/groups/getMembers?groupId=${chat.groupId}`;
      }
      const res = await makeRequest(url);
      const data = await res.json();
      if (data.success) {
        setGroupMembers(data.members || data.data || []);
      }
    } catch (e) {
      console.error('Error fetching group members:', e);
    }
  };

  const loadMessages = async (showLoading = false, after = null) => {
    try {
      if (showLoading) setLoading(true);
      const url = after ? `/chats/messages/${chat.chatId}?after=${after}` : `/chats/messages/${chat.chatId}`;
      const response = await makeRequest(url);
      const data = await response.json();
      if (data.success && data.messages) {
        const formatted = data.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'Admin' ? 'user' : 'other',
          text: msg.message,
          timestamp: new Date(msg.created_at),
          isRead: msg.read_at !== null,
          status: msg.read_at !== null ? 'read' : 'delivered',
          senderName: msg.sender_name,
        }));
        
        setMessages(prev => {
            if (!after) return formatted;
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = formatted.filter(m => !existingIds.has(m.id));
            return [...prev, ...newMsgs];
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true);
    setTimeout(scrollToBottom, 100);

    if (chat.isGroup) {
      fetchGroupMembers();
    }

    const interval = setInterval(() => {
      const currentMessages = messagesRef.current;
      const validIds = currentMessages.map(m => m.id).filter(id => typeof id === 'number');
      const highestId = validIds.length > 0 ? Math.max(...validIds) : null;
      
      if (highestId && isFinite(highestId)) {
        loadMessages(false, highestId);
      } else {
        loadMessages(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [chat.chatId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const tempId = 'temp-' + Date.now();
    const newMessage = {
      id: tempId,
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
      isRead: false,
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setTimeout(scrollToBottom, 50);

    try {
      const response = await makeRequest('/chats/send', {
        method: 'POST',
        body: JSON.stringify({
          roomId: chat.chatId,
          message: newMessage.text,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, id: data.data.id, status: 'read', isRead: true } : msg));
        loadMessages(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

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

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const previousDate = new Date(previousMsg.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  const shouldGroupWithPrevious = (currentMsg, previousMsg) => {
    if (!previousMsg || !currentMsg) return false;
    return (
      previousMsg.sender === currentMsg.sender &&
      (new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp)) < 60000
    );
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <>
      {/* Header */}
      <div className="chat-screen-header">
        <div className="chat-screen-header-info" onClick={() => { if (chat.isGroup) { fetchGroupMembers(); setShowGroupInfo(true); } }}>
          <div className="chat-screen-avatar">
            {chat.chatAvatar && chat.chatAvatar.startsWith('http') ? (
              <img src={chat.chatAvatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              chat.isGroup ? <RiGroupLine size={20} /> : <RiUserLine size={20} />
            )}
            {!chat.isGroup && <div className="online-dot" />}
          </div>
          <div>
            <h3 className="chat-screen-name">{chat.chatName}</h3>
            <p className="chat-screen-status">
              {chat.isGroup ? `${groupMembers.length > 0 ? groupMembers.length : ''} Members` : 'Online'}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-header-action-btn" onClick={() => setSearchActive(!searchActive)}>
            <RiSearchLine size={20} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className="chat-header-action-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <RiMore2Fill size={20} />
            </button>
            {showDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
                <div className="chat-dropdown-menu">
                  {chat.isGroup && (
                    <button className="chat-dropdown-item" onClick={() => { setShowDropdown(false); fetchGroupMembers(); setShowGroupInfo(true); }}>
                      <RiInformationLine size={16} /> Group Info
                    </button>
                  )}
                  <button className="chat-dropdown-item" onClick={() => setShowDropdown(false)}>
                    <RiStarLine size={16} style={{ color: '#F59E0B' }} /> Starred Messages
                  </button>
                  <button className="chat-dropdown-item danger" onClick={() => setShowDropdown(false)}>
                    <RiDeleteBinLine size={16} /> Delete Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header Search Toggler overlay */}
      {searchActive && (
        <div className="chat-search-header-bar">
          <div className="chat-search-inner-wrapper">
            <RiSearchLine size={18} color="#9CA3AF" />
            <input 
              type="text" 
              placeholder="Search in conversation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <RiCloseLine size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="chat-screen-messages">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)' }}>Loading messages...</div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg, index) => {
            const showDate = shouldShowDateSeparator(msg, filteredMessages[index - 1]);
            const isGrouped = shouldGroupWithPrevious(msg, filteredMessages[index - 1]);
            
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="chat-date-separator">
                    <span className="chat-date-pill">{formatDateSeparator(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`chat-message-row ${msg.sender === 'user' ? 'sent' : 'received'} ${isGrouped ? 'grouped' : ''}`}>
                  <div className="chat-bubble">
                    {msg.sender === 'other' && chat.isGroup && !isGrouped && (
                      <div className="chat-bubble-sender-name">{msg.senderName}</div>
                    )}
                    <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                    <div className="chat-message-footer">
                      <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                      {msg.sender === 'user' && (
                        msg.status === 'read' 
                          ? <RiCheckCheckLine size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                          : msg.status === 'delivered'
                            ? <RiCheckCheckLine size={14} color="#D8BFD8" style={{ marginLeft: 2 }} />
                            : <RiCheckLine size={14} color="#D8BFD8" style={{ marginLeft: 2 }} />
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <RiUserLine size={36} />
            </div>
            <h3>No messages yet</h3>
            <p>Start the conversation by typing below!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Redesigned Pill) */}
      <div className="chat-screen-input-container">
        <form className="chat-screen-input-wrapper" onSubmit={handleSendMessage}>
          <button type="button" className="chat-input-action-btn">
            <RiPlusLine size={22} />
          </button>
          
          <input 
            type="text" 
            className="chat-input-box-redesign" 
            placeholder="Type a message..." 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />

          <button type="button" className="chat-input-action-btn secondary">
            <RiSmileLine size={22} />
          </button>
          
          <button 
            type="submit" 
            className="chat-send-btn-redesign"
            disabled={!messageText.trim()}
          >
            <RiSendLine size={18} />
          </button>
        </form>
      </div>

      {/* Group Info Sidebar Drawer */}
      {showGroupInfo && (
        <div className="group-info-modal-backdrop" onClick={() => setShowGroupInfo(false)}>
          <div className="group-info-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="group-info-header">
              <button className="group-info-back-btn" onClick={() => setShowGroupInfo(false)}>
                <RiArrowLeftLine size={24} />
              </button>
              <h3 className="group-info-title">Group Info</h3>
            </div>
            <div className="group-info-content-scroll">
              <div className="group-info-hero">
                <div className="group-info-avatar-wrapper">
                  {chat.chatAvatar && chat.chatAvatar.startsWith('http') ? (
                    <img src={chat.chatAvatar} alt="group avatar" className="group-info-avatar-img" />
                  ) : (
                    <div className="group-info-avatar-placeholder">
                      <RiGroupLine size={60} color="#1E40AF" />
                    </div>
                  )}
                </div>
                <h4 className="group-info-name">{chat.chatName}</h4>
              </div>
              <div className="group-info-members-header">{groupMembers.length} Members</div>
              <div className="group-info-members-list">
                {groupMembers.map((member) => (
                  <div key={member.userId || member.id} className="group-info-member-card">
                    <div className="group-info-member-avatar">
                      {(member.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="group-info-member-details">
                      <p className="group-info-member-name">{member.name}</p>
                      <p className="group-info-member-phone">{member.phone || 'No phone'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatScreen;
