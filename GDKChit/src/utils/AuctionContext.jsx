import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../services/AuctionWebSocketService';
import ApiService from '../services/ApiService';
import { useAuth } from './AuthContext';

const AuctionContext = createContext(null);

export const AuctionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Assume isAuthenticated indicates login status
  const [activeAuctionAlert, setActiveAuctionAlert] = useState(null);

  useEffect(() => {
    let unsubscribeAlert = null;
    
    // We only connect globally if it's not already connected, or if it makes sense to connect
    const initWS = async () => {
      try {
        const token = await ApiService.getAccessToken();
        const userId = await AsyncStorage.getItem('userId');
        const role = (await AsyncStorage.getItem('userRole')) || 'user';
        
        if (token && userId) {
          if (!AuctionWebSocketService.isConnected()) {
            await AuctionWebSocketService.connect(token, userId, role.toLowerCase());
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

    if (isAuthenticated) {
      initWS();
    }

    return () => {
      if (unsubscribeAlert) unsubscribeAlert();
      // Notice: we might not want to disconnect globally on unmount since this is App level
    };
  }, [isAuthenticated]);

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
