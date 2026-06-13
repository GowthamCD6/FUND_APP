import React, { useState } from 'react';
import ChatList from './ChatList.jsx';
import ChatScreen from './ChatScreen.jsx';
import './Chat.css';
import { MessageSquare as RiChat3Line } from 'lucide-react';

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="page" style={{ padding: 0, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'stretch', boxSizing: 'border-box' }}>
      <div className="chat-container">
        <div className="chat-sidebar">
          <ChatList 
            onSelectChat={setSelectedChat} 
            selectedChatId={selectedChat?.chatId} 
          />
        </div>
        <div className="chat-main">
          {selectedChat ? (
            <ChatScreen 
              chat={selectedChat} 
              onBack={() => setSelectedChat(null)} 
            />
          ) : (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">
                <RiChat3Line size={64} />
              </div>
              <h3>GDK Chit Fund Chat</h3>
              <p>Select a group or user to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
