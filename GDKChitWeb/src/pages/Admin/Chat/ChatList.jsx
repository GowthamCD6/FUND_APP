import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, tokenStore, API_URL } from '../../../api/apiClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Search as RiSearchLine, RefreshCw as RiRefreshLine, Plus as RiAddLine, Users as RiGroupLine, User as RiUserLine, MoreVertical as RiMore2Fill, Settings as RiSettings3Line } from 'lucide-react';

const ChatList = ({ onSelectChat, selectedChatId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const ws = useRef(null);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await makeRequest('/chats');
      const data = await response.json();
      if (data.success) {
        setChats(data.chats || []);
        applyFilters(data.chats || [], searchQuery);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();

    // WebSocket Setup
    const setupWebSocket = () => {
      try {
        const token = tokenStore.getAccessToken();
        if (!token) return;

        let wsUrl = API_URL.replace('http', 'ws');
        wsUrl = wsUrl.replace(/\/api\/?$/, '');
        wsUrl = `${wsUrl}/api/chat?token=${token}&userId=${user?.id || 'admin'}&userType=Admin`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => console.log('Chat WS Connected (Web Admin)');
        
        ws.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message_notification' || payload.type === 'new_message') {
              loadChats();
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.current.onerror = (e) => console.log('Chat WS Error');
      } catch (e) {
        console.error('Error setting up WS:', e);
      }
    };

    setupWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  const applyFilters = (chatList, query) => {
    let filtered = [...chatList];
    if (query.trim() !== '') {
      filtered = filtered.filter(chat =>
        (chat.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (chat.lastMessage || '').toLowerCase().includes(query.toLowerCase())
      );
    }
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    setFilteredChats(filtered);
  };

  const handleSearch = (e) => {
    const text = e.target.value;
    setSearchQuery(text);
    applyFilters(chats, text);
  };

  const formatTime = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const diffInDays = Math.floor(diffInMinutes / 1440);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleChatPress = (chat) => {
    onSelectChat({
      chatId: chat.id,
      chatName: chat.name,
      chatAvatar: chat.avatar,
      isGroup: chat.isGroup,
      groupId: chat.groupId,
    });
  };

  return (
    <>
      <div className="chat-list-header">
        <div className="chat-list-title-row">
          <h2 className="chat-list-title">Messages</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }} onClick={loadChats}>
              <RiRefreshLine size={20} color="var(--primary)" />
            </button>
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }} onClick={() => setShowDropdown(!showDropdown)}>
                <RiMore2Fill size={20} color="var(--text)" />
              </button>
              {showDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
                  <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 8, zIndex: 20, minWidth: 160, marginTop: 8 }}>
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left', borderRadius: '4px' }} className="hover-bg">
                      <RiAddLine size={16} /> New Chat
                    </button>
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left', borderRadius: '4px' }} className="hover-bg">
                      <RiSettings3Line size={16} /> Chat Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="chat-search">
          <RiSearchLine size={16} color="var(--muted)" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="chat-list-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
              onClick={() => handleChatPress(chat)}
            >
              <div className="chat-avatar">
                {chat.avatar && chat.avatar.startsWith('http') ? (
                  <img src={chat.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  chat.isGroup ? <RiGroupLine size={24} /> : <RiUserLine size={24} />
                )}
              </div>
              <div className="chat-item-info">
                <div className="chat-item-top">
                  <span className="chat-item-name">{chat.name}</span>
                  <span className="chat-item-time">{formatTime(chat.timestamp)}</span>
                </div>
                <div className="chat-item-bottom">
                  <span className="chat-item-msg">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="chat-unread">{chat.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            No conversations found.
          </div>
        )}
      </div>
    </>
  );
};

export default ChatList;
