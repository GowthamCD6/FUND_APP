import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, tokenStore, API_URL } from '../../../../api/apiClient.js';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { Search as RiSearchLine, RefreshCw as RiRefreshLine, Plus as RiAddLine, Users as RiGroupLine, User as RiUserLine, MoreVertical as RiMore2Fill, Settings as RiSettings3Line } from 'lucide-react';

const ChatList = ({ onSelectChat, selectedChatId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const loadChats = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await makeRequest('/chats');
      const data = await response.json();
      if (data.success) {
        setChats(data.chats || []);
        applyFilters(data.chats || [], searchQuery);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadChats(true);

    const interval = setInterval(() => {
      loadChats(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [user, searchQuery]);

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
          <div>
            <h2 className="chat-list-title">Messages</h2>
            <div className="chat-list-subtitle">GDK Chit Fund Chat</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--chat-primary)' }} onClick={loadChats}>
              <RiRefreshLine size={20} />
            </button>
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#1F2937' }} onClick={() => setShowDropdown(!showDropdown)}>
                <RiMore2Fill size={20} />
              </button>
              {showDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
                  <div className="chat-dropdown-menu">
                    <button className="chat-dropdown-item" onClick={() => setShowDropdown(false)}>
                      <RiAddLine size={16} /> New Chat
                    </button>
                    <button className="chat-dropdown-item" onClick={() => setShowDropdown(false)}>
                      <RiSettings3Line size={16} /> Chat Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="chat-search">
          <RiSearchLine size={16} color="#9CA3AF" />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ width: '50%', height: 13, background: '#e2e8f0', borderRadius: 4 }} />
                    <div style={{ width: 35, height: 10, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                  <div style={{ width: '75%', height: 11, background: '#e2e8f0', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${chat.unread > 0 ? 'unread' : ''} ${selectedChatId === chat.id ? 'active' : ''}`}
              onClick={() => handleChatPress(chat)}
            >
              <div className="chat-avatar">
                {chat.avatar && typeof chat.avatar === 'string' && (chat.avatar.startsWith('http') || chat.avatar.startsWith('/uploads')) ? (
                  <img 
                    src={chat.avatar.startsWith('http') ? chat.avatar : `${API_URL.replace(/\/api\/?$/, '')}${chat.avatar}`} 
                    alt={chat.name || 'avatar'} 
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
                    display: chat.avatar && typeof chat.avatar === 'string' && (chat.avatar.startsWith('http') || chat.avatar.startsWith('/uploads')) ? 'none' : 'flex' 
                  }}
                >
                  {chat.isGroup ? (
                    <RiGroupLine size={22} color="var(--chat-primary)" />
                  ) : chat.name ? (
                    chat.name.substring(0, 2).toUpperCase()
                  ) : (
                    <RiUserLine size={22} color="var(--chat-primary)" />
                  )}
                </div>
                {!chat.isGroup && <div className="online-dot" />}
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
