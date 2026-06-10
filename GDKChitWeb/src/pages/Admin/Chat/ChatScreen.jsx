import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, tokenStore, API_URL } from '../../../api/apiClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Users as RiGroupLine, User as RiUserLine, Check as RiCheckLine, MoreVertical as RiMore2Fill, Star as RiStarLine, Trash2 as RiDeleteBinLine, Info as RiInformationLine } from 'lucide-react';

const ChatScreen = ({ chat, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await makeRequest(`/chats/messages/${chat.chatId}`);
        const data = await response.json();
        if (data.success && data.messages) {
          const formatted = data.messages.map(msg => ({
            id: msg.id,
            sender: msg.sender_type === 'Admin' ? 'user' : 'other',
            text: msg.message,
            timestamp: new Date(msg.created_at),
            isRead: msg.is_read === 1,
            status: 'read',
            senderName: msg.sender_name,
          }));
          setMessages(formatted);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // WebSocket Setup
    const setupWebSocket = () => {
      try {
        const token = tokenStore.getAccessToken();
        if (!token) return;

        let wsUrl = API_URL.replace('http', 'ws');
        wsUrl = wsUrl.replace(/\/api\/?$/, '');
        wsUrl = `${wsUrl}/api/chat?token=${token}&userId=${user?.id || 'admin'}&userType=Admin`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          ws.current.send(JSON.stringify({ type: 'join_room', roomId: chat.chatId }));
        };
        
        ws.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message' && payload.data.roomId === chat.chatId) {
              setMessages(prev => {
                if (prev.find(m => m.id === payload.data.id)) return prev;
                
                const filtered = prev.filter(m => !(String(m.id).startsWith('temp-') && m.text === payload.data.message));
                
                const newMsg = {
                  id: payload.data.id,
                  sender: payload.data.senderType === 'Admin' ? 'user' : 'other',
                  text: payload.data.message,
                  timestamp: new Date(payload.data.created_at),
                  isRead: true,
                  status: 'read',
                  senderName: payload.data.sender_name,
                };
                return [...filtered, newMsg];
              });
              setTimeout(scrollToBottom, 100);
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

      } catch (e) {
        console.error('Error setting up WS:', e);
      }
    };

    setupWebSocket();

    return () => {
      if (ws.current) {
        if (ws.current.readyState === 1) {
          ws.current.send(JSON.stringify({ type: 'leave_room', roomId: chat.chatId }));
        }
        ws.current.close();
      }
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
      if (ws.current && ws.current.readyState === 1) {
        ws.current.send(JSON.stringify({
          type: 'send_message',
          data: {
            roomId: chat.chatId,
            text: newMessage.text,
          }
        }));
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'delivered' } : msg));
        }, 300);
      } else {
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
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Header */}
      <div className="chat-screen-header">
        <div className="chat-screen-header-info">
          <div className="chat-screen-avatar">
            {chat.chatAvatar && chat.chatAvatar.startsWith('http') ? (
              <img src={chat.chatAvatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              chat.isGroup ? <RiGroupLine size={20} /> : <RiUserLine size={20} />
            )}
          </div>
          <div>
            <h3 className="chat-screen-name">{chat.chatName}</h3>
            <p className="chat-screen-status">{chat.isGroup ? 'Group' : 'User'}</p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 8, color: 'var(--text)' }} 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <RiMore2Fill size={20} />
          </button>
          {showDropdown && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
              <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 8, zIndex: 20, minWidth: 160 }}>
                {chat.isGroup && (
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left', borderRadius: '4px' }} className="hover-bg">
                    <RiInformationLine size={16} color="var(--primary)" /> Group Info
                  </button>
                )}
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left', borderRadius: '4px' }} className="hover-bg">
                  <RiStarLine size={16} color="#F59E0B" /> Starred Messages
                </button>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', textAlign: 'left', borderRadius: '4px' }} className="hover-bg">
                  <RiDeleteBinLine size={16} /> Delete Chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-screen-messages">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)' }}>Loading messages...</div>
        ) : messages.length > 0 ? (
          messages.map((msg, index) => (
            <div key={msg.id} className={`chat-message-row ${msg.sender === 'user' ? 'sent' : 'received'}`}>
              <div className="chat-bubble">
                {msg.sender === 'other' && chat.isGroup && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', marginBottom: 2 }}>{msg.senderName}</div>
                )}
                {msg.text}
                <div className="chat-message-time">
                  {formatTime(msg.timestamp)}
                  {msg.sender === 'user' && (
                    <RiCheckLine size={12} color={msg.status === 'read' ? '#4CAF50' : 'inherit'} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--muted)' }}>
            <p>No messages yet.</p>
            <p style={{ fontSize: 13 }}>Send a message to start the conversation.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="chat-screen-input" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="chat-input-box" 
          placeholder="Type a message..." 
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={!messageText.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </>
  );
};

export default ChatScreen;
