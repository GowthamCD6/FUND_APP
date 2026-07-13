import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../services/AuctionWebSocketService';
import { useAuth } from './AuthContext';

const AuctionContext = createContext(null);

export const AuctionProvider = ({ children }) => {
  const { userToken } = useAuth(); // Assume userToken indicates login status
  const [activeAuctionAlert, setActiveAuctionAlert] = useState(null);

  useEffect(() => {
    let unsubscribeAlert = null;
    
    // We only connect globally if it's not already connected, or if it makes sense to connect
    const initWS = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          if (!AuctionWebSocketService.isConnected()) {
            await AuctionWebSocketService.connect(token, userId, 'user');
          }
          
          unsubscribeAlert = AuctionWebSocketService.on('auction_created_alert', (data) => {
            console.log('Auction Context received alert:', data);
            setActiveAuctionAlert(data);
          });
        }
      } catch (err) {
        console.error('Failed to init Auction WS in Context:', err);
      }
    };

    if (userToken) {
      initWS();
    }

    return () => {
      if (unsubscribeAlert) unsubscribeAlert();
      // Notice: we might not want to disconnect globally on unmount since this is App level
    };
  }, [userToken]);

  const clearAuctionAlert = () => {
    setActiveAuctionAlert(null);
  };

  return (
    <AuctionContext.Provider value={{ activeAuctionAlert, clearAuctionAlert }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuctionContext = () => useContext(AuctionContext);
