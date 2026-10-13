import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lottie from 'lottie-react';
import ChatList from './components/ChatList.jsx';
import ChatScreen from './components/ChatScreen.jsx';
import './Chat.css';
import messageAnimation from '../../../animation/message.json';

const Chat = () => {
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (location.state?.chat) {
      setSelectedChat(location.state.chat);
    }
  }, [location.state]);

  return (
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
            <div style={{ width: '180px', height: '180px', marginBottom: '10px' }}>
              {React.createElement(Lottie.default || Lottie, {
                animationData: messageAnimation,
                loop: true
              })}
            </div>
            <h3>GDK Chit Fund Chat</h3>
            <p>Select a group or user to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
