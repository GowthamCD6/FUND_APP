import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, API_URL, tokenStore } from '../../../../api/apiClient.js';
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
  Send as RiSendLine,
  Play as RiPlayLine,
  Pause as RiPauseLine,
  Volume2 as RiVolume2Line,
  Image as RiImageLine,
  FileText as RiFileTextLine,
  Phone as RiPhoneLine,
  MapPin as RiMapPinLine,
  Download as RiDownloadLine,
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
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [shareContactModal, setShareContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());
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
    }, 4000);

    return () => {
      clearInterval(interval);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
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
        alert(data.message || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleShareContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      alert('Please enter contact name and phone number');
      return;
    }
    const payload = JSON.stringify({ name: contactName.trim(), phone: contactPhone.trim() });
    sendRawMessage(`[CONTACT_CARD]${payload}`);
    setContactName('');
    setContactPhone('');
    setShareContactModal(false);
  };

  const handleShareLocation = () => {
    setShowAttachments(false);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        sendRawMessage(`Location: ${mapUrl}`);
      },
      (err) => {
        alert('Could not retrieve current location: ' + err.message);
      }
    );
  };

  const handleToggleAudio = (rawUrl) => {
    const audioUrl = formatFileUrl(rawUrl);
    if (currentlyPlaying === audioUrl) {
      audioPlayerRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play()
        .then(() => setCurrentlyPlaying(audioUrl))
        .catch(err => {
          console.error('Error playing audio:', err);
          alert('Could not play audio note');
        });
      audioPlayerRef.current.onended = () => setCurrentlyPlaying(null);
    }
  };

  const renderMessageContent = (msg) => {
    const text = msg.text || '';

    // 1. Audio / Voice Note
    if (text.startsWith('Audio: Voice Note |')) {
      const parts = text.split('|');
      const audioUrl = parts[1]?.trim() || '';
      const isPlaying = currentlyPlaying === formatFileUrl(audioUrl);

      return (
        <div className="chat-audio-player">
          <button 
            type="button" 
            className="chat-audio-play-btn" 
            onClick={() => handleToggleAudio(audioUrl)}
          >
            {isPlaying ? <RiPauseLine size={16} /> : <RiPlayLine size={16} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiVolume2Line size={14} /> Voice Note
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Click to listen</div>
          </div>
        </div>
      );
    }

    // 2. Document file
    if (text.startsWith('Document:')) {
      const parts = text.replace('Document:', '').split('|');
      const docName = parts[0]?.trim() || 'Attached Document';
      const docUrl = formatFileUrl(parts[1]?.trim() || '');

      return (
        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="chat-doc-card">
          <RiFileTextLine size={24} color="#2E7D32" />
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

    // 3. Image URL directly
    if (text.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || ((text.includes('/uploads/') || text.includes('cloudinary.com') || text.includes('/image/upload/')) && !text.includes(' '))) {
      const imgUrl = formatFileUrl(text);
      return (
        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
          <img src={imgUrl} alt="attachment" className="chat-image-attachment" />
        </a>
      );
    }

    // 4. Contact Card
    if (text.startsWith('[CONTACT_CARD]')) {
      try {
        const cData = JSON.parse(text.replace('[CONTACT_CARD]', ''));
        return (
          <div className="chat-contact-card">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2E7D32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {cData.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{cData.name}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{cData.phone}</div>
            </div>
            <a href={`tel:${cData.phone}`} style={{ color: '#2E7D32', background: '#fff', padding: 6, borderRadius: '50%', display: 'flex' }}>
              <RiPhoneLine size={16} />
            </a>
          </div>
        );
      } catch {
        return <div>Shared Contact</div>;
      }
    }

    // 5. Location
    if (text.startsWith('Location:')) {
      const locUrl = text.replace('Location:', '').trim();
      return (
        <a href={locUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2E7D32', fontWeight: 700, textDecoration: 'underline' }}>
          <RiMapPinLine size={16} /> View Shared Location
        </a>
      );
    }

    // Default plain text
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
            <p className="chat-screen-status">
              {chat.isGroup ? `${groupMembers.length > 0 ? groupMembers.length : ''} Members` : 'Active'}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="chat-header-action-btn" onClick={() => setSearchActive(!searchActive)} title="Search">
            <RiSearchLine size={19} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className="chat-header-action-btn" onClick={() => setShowDropdown(!showDropdown)} title="Options">
              <RiMore2Fill size={19} />
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
                  <button className="chat-dropdown-item" onClick={() => { setShowDropdown(false); loadMessages(true); }}>
                    <RiStarLine size={16} style={{ color: '#F59E0B' }} /> Refresh Chat
                  </button>
                  <button className="chat-dropdown-item danger" onClick={() => { setShowDropdown(false); setMessages([]); }}>
                    <RiDeleteBinLine size={16} /> Clear Chat
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
            
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="chat-date-separator">
                    <span className="chat-date-pill">{formatDateSeparator(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`chat-message-row ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                  <div className="chat-bubble">
                    {msg.sender === 'other' && chat.isGroup && (
                      <div className="chat-bubble-sender-name">{msg.senderName || 'Member'}</div>
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
            <div className="chat-empty-icon" style={{ background: '#EBF3ED', color: '#1B3322' }}>
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
              <RiImageLine size={20} color="#2E7D32" />
            </div>
            Image
          </button>

          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#1B3322', fontSize: 12, fontWeight: 600 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiFileTextLine size={20} color="#2563EB" />
            </div>
            Document
          </button>

          <button 
            type="button" 
            onClick={() => setShareContactModal(true)} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#1B3322', fontSize: 12, fontWeight: 600 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiPhoneLine size={20} color="#D97706" />
            </div>
            Contact
          </button>

          <button 
            type="button" 
            onClick={handleShareLocation} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#1B3322', fontSize: 12, fontWeight: 600 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiMapPinLine size={20} color="#DC2626" />
            </div>
            Location
          </button>
        </div>
      )}

      {/* Input Area (Redesigned Pill) */}
      <div className="chat-screen-input-container">
        <form className="chat-screen-input-wrapper" onSubmit={handleSendMessage}>
          <button 
            type="button" 
            className="chat-input-action-btn"
            onClick={() => { setShowAttachments(v => !v); setShowEmojis(false); }}
            title="Attach file, contact or location"
            style={{ color: showAttachments ? '#2E7D32' : '#6B7A6E' }}
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
            className="chat-input-action-btn secondary"
            onClick={() => { setShowEmojis(v => !v); setShowAttachments(false); }}
            title="Emoji"
            style={{ color: showEmojis ? '#2E7D32' : '#94A3B8' }}
          >
            <RiSmileLine size={22} />
          </button>
          
          <button 
            type="submit" 
            className="chat-send-btn-redesign"
            disabled={!messageText.trim() || isUploading}
            style={{ background: '#2E7D32' }}
          >
            <RiSendLine size={18} />
          </button>
        </form>
      </div>

      {/* Share Contact Dialog */}
      {shareContactModal && (
        <div className="group-info-modal-backdrop" onClick={() => setShareContactModal(false)} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="def-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="def-modal-header">
              <h3 className="def-modal-title">Share Contact</h3>
              <button onClick={() => setShareContactModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <RiCloseLine size={20} />
              </button>
            </div>
            <div className="def-modal-body">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Contact Name</label>
                <input 
                  type="text" 
                  value={contactName} 
                  onChange={e => setContactName(e.target.value)} 
                  placeholder="e.g. Suresh Kumar"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid #DCE3DC' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number</label>
                <input 
                  type="text" 
                  value={contactPhone} 
                  onChange={e => setContactPhone(e.target.value)} 
                  placeholder="e.g. 9876543210"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid #DCE3DC' }} 
                />
              </div>
            </div>
            <div className="def-modal-footer">
              <button className="reports-refresh-btn" onClick={() => setShareContactModal(false)}>Cancel</button>
              <button className="def-reminder-btn" onClick={handleShareContact}>Share Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Info Sidebar Drawer */}
      {showGroupInfo && (
        <div className="group-info-modal-backdrop" onClick={() => setShowGroupInfo(false)}>
          <div className="group-info-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="group-info-header">
              <button className="group-info-back-btn" onClick={() => setShowGroupInfo(false)}>
                <RiArrowLeftLine size={24} />
              </button>
              <h3 className="group-info-title">Group Details</h3>
            </div>
            <div className="group-info-content-scroll">
              <div className="group-info-hero">
                <div className="group-info-avatar-wrapper">
                  {chat.chatAvatar && typeof chat.chatAvatar === 'string' && (chat.chatAvatar.startsWith('http') || chat.chatAvatar.startsWith('/uploads')) ? (
                    <img 
                      src={chat.chatAvatar.startsWith('http') ? chat.chatAvatar : `${API_URL.replace(/\/api\/?$/, '')}${chat.chatAvatar}`} 
                      alt="group avatar" 
                      className="group-info-avatar-img" 
                    />
                  ) : (
                    <div className="group-info-avatar-placeholder" style={{ background: '#EBF3ED', color: '#1B3322' }}>
                      <RiGroupLine size={60} color="#1B3322" />
                    </div>
                  )}
                </div>
                <h4 className="group-info-name">{chat.chatName}</h4>
              </div>
              <div className="group-info-members-header">{groupMembers.length} Enrolled Members</div>
              <div className="group-info-members-list">
                {groupMembers.map((member) => (
                  <div key={member.userId || member.id} className="group-info-member-card">
                    <div className="group-info-member-avatar" style={{ background: '#EBF3ED', color: '#1B3322', fontWeight: 800 }}>
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
