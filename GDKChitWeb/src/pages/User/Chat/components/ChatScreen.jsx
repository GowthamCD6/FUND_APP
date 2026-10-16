import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, API_URL, tokenStore } from '../../../../api/apiClient.js';
import { useAuth } from '../../../../context/AuthContext.jsx';
import {
  Users as RiGroupLine, User as RiUserLine, MoreVertical as RiMore2Fill,
  Check as RiCheckLine, CheckCheck as RiCheckCheckLine,
  Star as RiStarLine, Trash2 as RiDeleteBinLine, Info as RiInformationLine,
  Search as RiSearchLine, Plus as RiPlusLine, Smile as RiSmileLine,
  X as RiCloseLine, ArrowLeft as RiArrowLeftLine, Send as RiSendLine,
  Image as RiImageLine, FileText as RiFileTextLine, Download as RiDownloadLine,
  Paperclip as RiPaperclipLine
} from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😊', '🙏', '🔥', '🎉', '💰', '💵', '💳', '✅', '⚠️', '🤝', '👏', '⭐', '📍', '📞'];

const formatFileUrl = (url) => {
  if (!url) return '';
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};

const ChatScreen = ({ chat, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
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

  const loadMessages = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await makeRequest(`/chats/messages/${chat.chatId}`);
      const data = await response.json();
      if (data.success && data.messages) {
        const formatted = data.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'User' ? 'user' : 'other',
          text: msg.message,
          timestamp: new Date(msg.created_at),
          isRead: msg.is_read === 1 || msg.read_at !== null,
          status: (msg.is_read === 1 || msg.read_at !== null) ? 'read' : 'delivered',
          senderName: msg.sender_name,
        }));
        setMessages(formatted);
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
      loadMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [chat.chatId, user]);

  const sendRawMessage = async (text) => {
    if (!text.trim()) return;

    const tempId = 'temp-' + Date.now();
    const newMessage = {
      id: tempId,
      sender: 'user',
      text: text,
      timestamp: new Date(),
      isRead: false,
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const response = await makeRequest('/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: chat.chatId,
          message: newMessage.text,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, id: data.data.id, status: 'delivered' } : msg
          )
        );
        loadMessages(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const txt = messageText;
    setMessageText('');
    setShowEmojis(false);
    setShowAttachments(false);
    sendRawMessage(txt);
  };

  const handleFileUpload = async (e, type = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setShowAttachments(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = tokenStore.getAccessToken();
      const res = await fetch(`${API_URL}/chats/upload-file`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.fileUrl) {
        if (type === 'image') {
          await sendRawMessage(data.fileUrl);
        } else {
          await sendRawMessage(`Document: ${file.name} | ${data.fileUrl}`);
        }
      } else {
        alert(data.message || 'Failed to upload media file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading attachment');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const renderMessageContent = (msg) => {
    const text = msg.text || '';

    // 1. Document file
    if (text.startsWith('Document:')) {
      const parts = text.replace('Document:', '').split('|');
      const docName = parts[0]?.trim() || 'Attached Document';
      const docUrl = formatFileUrl(parts[1]?.trim() || '');

      return (
        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="chat-doc-card">
          <RiFileTextLine size={24} color="#059669" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {docName}
            </div>
            <span style={{ fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RiDownloadLine size={12} /> Download file
            </span>
          </div>
        </a>
      );
    }

    // 2. Image URL directly (Cloudinary or local upload)
    if (
      text.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) ||
      ((text.includes('/uploads/') || text.includes('cloudinary.com') || text.includes('/image/upload/')) && !text.includes(' '))
    ) {
      const imgUrl = formatFileUrl(text);
      return (
        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
          <img src={imgUrl} alt="attachment" className="chat-image-attachment" />
        </a>
      );
    }

    // Plain text
    return <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{text}</div>;
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
    return new Date(currentMsg.timestamp).toDateString() !== new Date(previousMsg.timestamp).toDateString();
  };

  const shouldGroupWithPrevious = (currentMsg, previousMsg) => {
    if (!previousMsg) return false;
    const sameSender = currentMsg.sender === previousMsg.sender;
    const timeDiff = Math.abs(new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp));
    return sameSender && timeDiff < 60000;
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => (msg.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <>
      {/* Hidden file inputs for attachments */}
      <input 
        type="file" 
        ref={imageInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={(e) => handleFileUpload(e, 'image')} 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" 
        style={{ display: 'none' }} 
        onChange={(e) => handleFileUpload(e, 'doc')} 
      />

      {/* Header */}
      <div className="chat-screen-header">
        <div className="chat-screen-header-info" onClick={() => { if (chat.isGroup) { fetchGroupMembers(); setShowGroupInfo(true); } }}>
          <div className="chat-screen-avatar">
            {chat.chatAvatar && typeof chat.chatAvatar === 'string' && (chat.chatAvatar.startsWith('http') || chat.chatAvatar.startsWith('/uploads')) ? (
              <img 
                src={chat.chatAvatar.startsWith('http') ? chat.chatAvatar : `${API_URL.replace(/\/api\/?$/, '')}${chat.chatAvatar}`} 
                alt={chat.chatName} 
                className="chat-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="chat-avatar-text" 
              style={{ 
                display: chat.chatAvatar && typeof chat.chatAvatar === 'string' && (chat.chatAvatar.startsWith('http') || chat.chatAvatar.startsWith('/uploads')) ? 'none' : 'flex' 
              }}
            >
              {chat.isGroup ? (
                <RiGroupLine size={20} color="var(--chat-primary)" />
              ) : chat.chatName ? (
                chat.chatName.substring(0, 2).toUpperCase()
              ) : (
                <RiUserLine size={20} color="var(--chat-primary)" />
              )}
            </div>
            {!chat.isGroup && <div className="online-dot" />}
          </div>
          <div>
            <h3 className="chat-screen-name">{chat.chatName}</h3>
            <span className="chat-screen-status">
              {chat.isGroup ? `${groupMembers.length || 'Chit'} members` : 'online'}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="chat-screen-header-actions">
          <button 
            type="button" 
            className={`chat-header-icon-btn ${searchActive ? 'active' : ''}`}
            onClick={() => {
              setSearchActive(!searchActive);
              if (searchActive) setSearchQuery('');
            }}
            title="Search Messages"
          >
            <RiSearchLine size={20} />
          </button>
          
          <div style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="chat-header-icon-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              title="More Options"
            >
              <RiMore2Fill size={20} />
            </button>

            {showDropdown && (
              <>
                <div className="chat-dropdown-overlay" onClick={() => setShowDropdown(false)} />
                <div className="chat-dropdown-menu">
                  {chat.isGroup && (
                    <button className="chat-dropdown-item" onClick={() => { setShowDropdown(false); fetchGroupMembers(); setShowGroupInfo(true); }}>
                      <RiInformationLine size={16} /> Group Info
                    </button>
                  )}
                  <button className="chat-dropdown-item" onClick={() => { setShowDropdown(false); loadMessages(true); }}>
                    <RiStarLine size={16} style={{ color: '#F59E0B' }} /> Refresh Chat
                  </button>
                  <button className="chat-dropdown-item danger" onClick={() => { setShowDropdown(false); setMessages([]); }}>
                    <RiDeleteBinLine size={16} /> Clear Messages
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
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)' }}>Loading conversation...</div>
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
                    {renderMessageContent(msg)}
                    <div className="chat-message-footer">
                      <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                      {msg.sender === 'user' && (
                        msg.status === 'read' 
                          ? <RiCheckCheckLine size={14} color="#60a5fa" style={{ marginLeft: 2 }} title="Read" />
                          : msg.status === 'delivered'
                            ? <RiCheckCheckLine size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} title="Delivered" />
                            : <RiCheckLine size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} title="Sent" />
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
            <p>Start the conversation with {chat.chatName}!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Picker Strip */}
      {showEmojis && (
        <div style={{ background: '#FFFFFF', padding: '8px 16px', display: 'flex', gap: 10, overflowX: 'auto', borderTop: '1px solid #E2E8E2' }}>
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setMessageText(prev => prev + emoji)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Options Popover */}
      {showAttachments && (
        <div style={{ background: '#FFFFFF', padding: '12px 18px', borderTop: '1px solid #E2E8E2', display: 'flex', gap: 24, alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => imageInputRef.current?.click()} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#1B3322', fontSize: 12, fontWeight: 600 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EBF3ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiImageLine size={20} color="#059669" />
            </div>
            <span>Photo / Media</span>
          </button>

          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#1B3322', fontSize: 12, fontWeight: 600 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiFileTextLine size={20} color="#2563EB" />
            </div>
            <span>Document</span>
          </button>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <div className="chat-screen-footer-area">
        <form className="chat-screen-input-wrapper" onSubmit={handleSendMessage}>
          <button 
            type="button" 
            className={`chat-input-action-btn ${showAttachments ? 'active' : ''}`}
            onClick={() => {
              setShowAttachments(!showAttachments);
              setShowEmojis(false);
            }}
            title="Attach Media or File"
          >
            <RiPlusLine size={22} />
          </button>
          
          <input 
            type="text" 
            className="chat-input-box-redesign" 
            placeholder={isUploading ? "Uploading attachment..." : "Type a message..."} 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isUploading}
          />

          <button 
            type="button" 
            className={`chat-input-action-btn secondary ${showEmojis ? 'active' : ''}`}
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowAttachments(false);
            }}
            title="Insert Emoji"
          >
            <RiSmileLine size={22} />
          </button>
          
          <button 
            type="submit" 
            className="chat-send-btn-redesign"
            disabled={!messageText.trim() || isUploading}
            title="Send Message"
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
