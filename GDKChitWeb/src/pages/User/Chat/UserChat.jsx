import React, { useState, useEffect, useRef } from 'react';
import { makeRequest, tokenStore, API_URL } from '../../../api/apiClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  Search as RiSearchLine, RefreshCw as RiRefreshLine, Users as RiGroupLine, User as RiUserLine,
  Check as RiCheckLine, MoreVertical as RiMore2Fill, Star as RiStarLine, Trash2 as RiDeleteBinLine, Info as RiInformationLine,
} from 'lucide-react';
import './UserChat.css';

/* ─── Chat List ─── */
const ChatList = ({ onSelect, selectedId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadChats = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await makeRequest('/chats');
      const data = await res.json();
      if (data.success) { setChats(data.chats || []); applyFilter(data.chats || [], search); }
    } catch (e) { console.error(e); } finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => {
    loadChats(true);
    const interval = setInterval(() => {
      loadChats(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [search]);

  const applyFilter = (list, q) => {
    let f = [...list];
    if (q.trim()) f = f.filter(c => (c.name || '').toLowerCase().includes(q.toLowerCase()));
    f.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    setFiltered(f);
  };

  const handleSearch = (e) => { setSearch(e.target.value); applyFilter(chats, e.target.value); };

  const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d), now = new Date();
    const diffMin = Math.floor((now - date) / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diffD = Math.floor(diffMin / 1440);
    if (diffD < 7) return `${diffD}d`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <div className="uc-list-header">
        <div className="uc-list-title-row">
          <h2 className="uc-list-title">Messages</h2>
          <button className="uc-icon-btn" onClick={loadChats}><RiRefreshLine size={18} /></button>
        </div>
        <div className="uc-search">
          <RiSearchLine size={16} color="var(--muted)" />
          <input type="text" placeholder="Search conversations..." value={search} onChange={handleSearch} />
        </div>
      </div>
      <div className="uc-list-content">
        {loading ? <div className="uc-center">Loading...</div> :
         filtered.length > 0 ? filtered.map(c => (
          <div key={c.id} className={`uc-chat-item ${selectedId === c.id ? 'active' : ''}`}
            onClick={() => onSelect({ chatId: c.id, chatName: c.name, isGroup: c.isGroup, groupId: c.groupId })}>
            <div className="uc-avatar">{c.isGroup ? <RiGroupLine size={20} /> : <RiUserLine size={20} />}</div>
            <div className="uc-item-info">
              <div className="uc-item-top">
                <span className="uc-item-name">{c.name}</span>
                <span className="uc-item-time">{formatTime(c.timestamp)}</span>
              </div>
              <div className="uc-item-bottom">
                <span className="uc-item-msg">{c.lastMessage}</span>
                {c.unread > 0 && <span className="uc-unread">{c.unread}</span>}
              </div>
            </div>
          </div>
        )) : <div className="uc-center">No conversations found.</div>}
      </div>
    </>
  );
};

/* ─── Chat Screen ─── */
const ChatScreen = ({ chat }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const endRef = useRef(null);

  const scroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadMessages = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await makeRequest(`/chats/messages/${chat.chatId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages.map(m => ({
          id: m.id, sender: m.sender_type === 'User' ? 'user' : 'other',
          text: m.message, timestamp: new Date(m.created_at), senderName: m.sender_name,
        })));
      }
    } catch (e) { console.error(e); } finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => {
    loadMessages(true);
    setTimeout(scroll, 100);

    const interval = setInterval(() => {
      loadMessages(false);
    }, 5000);

    return () => { clearInterval(interval); };
  }, [chat.chatId]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, sender: 'user', text, timestamp: new Date() }]);
    const msg = text; setText('');
    setTimeout(scroll, 50);
    try {
      const res = await makeRequest('/chats/send', { method: 'POST', body: JSON.stringify({ roomId: chat.chatId, message: msg }) });
      const data = await res.json();
      if (data.success) {
        loadMessages(false);
      }
    } catch (e) { console.error(e); }
  };

  const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="uc-screen-header">
        <div className="uc-screen-info">
          <div className="uc-screen-avatar">{chat.isGroup ? <RiGroupLine size={18} /> : <RiUserLine size={18} />}</div>
          <div><h3 className="uc-screen-name">{chat.chatName}</h3><p className="uc-screen-status">{chat.isGroup ? 'Group' : 'User'}</p></div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="uc-icon-btn" onClick={() => setShowMenu(!showMenu)}><RiMore2Fill size={18} /></button>
          {showMenu && (
            <><div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
            <div className="uc-dropdown">
              {chat.isGroup && <button className="uc-dd-item"><RiInformationLine size={16} color="var(--primary)" /> Group Info</button>}
              <button className="uc-dd-item"><RiStarLine size={16} color="#F59E0B" /> Starred Messages</button>
              <button className="uc-dd-item" style={{ color: '#EF4444' }}><RiDeleteBinLine size={16} /> Delete Chat</button>
            </div></>
          )}
        </div>
      </div>
      <div className="uc-messages">
        {loading ? <div className="uc-center">Loading messages...</div> :
         messages.length > 0 ? messages.map(m => (
          <div key={m.id} className={`uc-msg-row ${m.sender === 'user' ? 'sent' : 'received'}`}>
            <div className="uc-bubble">
              {m.sender === 'other' && chat.isGroup && <div className="uc-sender-name">{m.senderName}</div>}
              {m.text}
              <div className="uc-msg-time">{fmtTime(m.timestamp)}{m.sender === 'user' && <RiCheckLine size={12} style={{ marginLeft: 4 }} />}</div>
            </div>
          </div>
        )) : <div className="uc-center" style={{ marginTop: 40 }}>No messages yet. Send a message to start.</div>}
        <div ref={endRef} />
      </div>
      <form className="uc-input-area" onSubmit={send}>
        <input type="text" className="uc-input" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} />
        <button type="submit" className="uc-send" disabled={!text.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </>
  );
};

/* ─── Main User Chat ─── */
const UserChat = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="uc-container">
      <div className="uc-sidebar"><ChatList onSelect={setSelected} selectedId={selected?.chatId} /></div>
      <div className="uc-main">
        {selected ? <ChatScreen chat={selected} /> : (
          <div className="uc-empty">
            <RiGroupLine size={56} color="#d1d5db" />
            <h3>GDK Chit Fund Chat</h3>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserChat;
