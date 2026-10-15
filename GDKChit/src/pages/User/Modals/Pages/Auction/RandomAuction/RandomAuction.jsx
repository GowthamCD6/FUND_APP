import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Animated,
  Dimensions,
  Vibration,
  Easing,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuctionWebSocketService from '../../../../../../services/AuctionWebSocketService';
import ApiService from '../../../../../../services/ApiService';
import { useLanguage } from '../../../../../../utils/LanguageContext';

const { width } = Dimensions.get('window');

const dotStyles = {
  1: [{ top: '50%', left: '50%', marginLeft: -7, marginTop: -7 }],
  2: [
    { top: 16, left: 16 },
    { bottom: 16, right: 16 }
  ],
  3: [
    { top: 16, left: 16 },
    { top: '50%', left: '50%', marginLeft: -7, marginTop: -7 },
    { bottom: 16, right: 16 }
  ],
  4: [
    { top: 16, left: 16 }, { top: 16, right: 16 },
    { bottom: 16, left: 16 }, { bottom: 16, right: 16 }
  ],
  5: [
    { top: 16, left: 16 }, { top: 16, right: 16 },
    { top: '50%', left: '50%', marginLeft: -7, marginTop: -7 },
    { bottom: 16, left: 16 }, { bottom: 16, right: 16 }
  ],
  6: [
    { top: 16, left: 16 }, { top: '50%', left: 16, marginTop: -7 }, { bottom: 16, left: 16 },
    { top: 16, right: 16 }, { top: '50%', right: 16, marginTop: -7 }, { bottom: 16, right: 16 }
  ]
};

const Dots = ({ value }) => (
  <>
    {dotStyles[value]?.map((pos, i) => (
      <View key={i} style={[styles.dot, pos]} />
    ))}
  </>
);

const RandomAuction = ({
  participants = [],
  selectedGroup,
  onAuctionComplete,
  onAuctionStatusChange,
  onAmountChange,
}) => {
  const { t, language } = useLanguage();
  const [diceValue, setDiceValue] = useState(1);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(0)).current;
  
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const idX = animX.addListener(({ value }) => { currentX.current = value; });
    const idY = animY.addListener(({ value }) => { currentY.current = value; });
    return () => {
      animX.removeListener(idX);
      animY.removeListener(idY);
    };
  }, [animX, animY]);

  const maxParticipants = Math.min(Math.max(participants.length, 1), 6);

  useEffect(() => {
    let unsubscribeDice;

    const initWebSocket = async () => {
      try {
        const token = await ApiService.getAccessToken();
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          await AuctionWebSocketService.connect(token, userId, 'user');
          
          unsubscribeDice = AuctionWebSocketService.on('dice_rolling', (data) => {
            const { groupId, duration, finalValue, winner, initialAmount } = data;
            if (groupId && selectedGroup && groupId.toString() === selectedGroup.id.toString()) {
              if (onAuctionStatusChange) onAuctionStatusChange(true);
              if (initialAmount && onAmountChange) onAmountChange(initialAmount);
              executeDiceRoll(finalValue, Number(duration) || 30000, winner);
            }
          });
        }
      } catch (err) {
        console.error('Failed to connect WebSocket on user RandomAuction:', err);
      }
    };

    initWebSocket();

    return () => {
      unsubscribeDice?.();
    };
  }, [selectedGroup]);

  const joinDraw = async () => {
    if (hasJoined || isDiceRolling) {
      Alert.alert(t('Already Joined'), t('You have already joined this lucky draw. Wait for the admin to roll the dice!'));
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId && selectedGroup?.id) {
        AuctionWebSocketService.joinAuction(selectedGroup.id, userId);
      }
    } catch (e) {
      console.error(e);
    }
    setHasJoined(true);
    if (onAuctionStatusChange) onAuctionStatusChange(true);
    Alert.alert(t('Joined Successfully!'), t('You have joined the lucky draw. Wait for the admin to start the draw.'));
  };

  const executeDiceRoll = (finalValue, duration, winner) => {
    setIsDiceRolling(true);
    setShowResult(false);
    
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 50, 30, 50]);
    } else {
      Vibration.vibrate([0, 40, 25, 40]);
    }

    const getTargetRotation = (val) => {
      switch(val) {
        case 1: return { x: 0, y: 0 };
        case 2: return { x: 90, y: 0 };
        case 3: return { x: 0, y: -90 };
        case 4: return { x: 0, y: 90 };
        case 5: return { x: -90, y: 0 };
        case 6: return { x: 0, y: 180 };
        default: return { x: 0, y: 0 };
      }
    };

    const target = getTargetRotation(finalValue);
    
    const extraSpinsX = 50 + Math.floor(Math.random() * 20);
    const extraSpinsY = 50 + Math.floor(Math.random() * 20);

    const getNextTarget = (current, targetAngle, extraSpins) => {
      const currentBase = Math.floor(current / 360) * 360;
      return currentBase + (360 * extraSpins) + targetAngle;
    };

    const finalX = getNextTarget(currentX.current, target.x, extraSpinsX);
    const finalY = getNextTarget(currentY.current, target.y, extraSpinsY);

    Animated.parallel([
      Animated.timing(animX, {
        toValue: finalX,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(animY, {
        toValue: finalY,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(animTranslateY, {
          toValue: -100,
          duration: duration * 0.33,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: duration * 0.67,
          easing: Easing.bounce,
          useNativeDriver: true
        })
      ])
    ]).start();

    // Use strict setTimeout to ensure modal only shows after exact duration
    setTimeout(() => {
      setDiceValue(finalValue);
      setShowResult(true);
      
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 70, 40, 70]);
      } else {
        Vibration.vibrate([0, 60, 30, 60]);
      }
      
      setTimeout(() => {
        setIsDiceRolling(false);
        if (onAuctionStatusChange) onAuctionStatusChange(false);
        if (onAuctionComplete && winner) {
          onAuctionComplete({
            type: 'random',
            winner: winner,
            diceValue: finalValue,
            participantPosition: finalValue,
          });
        }
      }, 500); 
    }, duration + 1000);
  };

  const rotateXInterpolate = animX.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });
  const rotateYInterpolate = animY.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  const getFaceTransform = (rotateY, rotateX) => {
    const transforms = [
      { perspective: 800 },
      { rotateX: rotateXInterpolate },
      { rotateY: rotateYInterpolate }
    ];
    if (rotateY) transforms.push({ rotateY });
    if (rotateX) transforms.push({ rotateX });
    
    transforms.push({ rotateY: '90deg' });
    transforms.push({ translateX: 50 });
    transforms.push({ rotateY: '-90deg' });
    
    return transforms;
  };

  const renderParticipantsGrid = () => (
    <View style={styles.participantsCard}>
      <Text style={[styles.cardTitle, language === 'ta' && { fontSize: 16 }]}>{t('Participants')}</Text>
      <View style={styles.participantsGrid}>
        {participants.map((participant, index) => (
          <View key={participant.id} style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.avatarText}>{participant.avatar}</Text>
            </View>
            <Text style={styles.participantName} numberOfLines={1}>
              {participant.name.split(' ')[0]}
            </Text>
            <View style={styles.participantNumber}>
              <Text style={styles.participantNumberText}>{index + 1}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.tabContent}>
      <View style={styles.diceCard}>
        <View style={styles.diceTitleContainer}>
          <Text style={[styles.diceTitle, language === 'ta' && { fontSize: 16 }]}>{t('Lucky Draw')}</Text>
          <View style={styles.participantCountBadge}>
            <MaterialCommunityIcons name="account-multiple" size={14} color="#FFFFFF" />
            <Text style={styles.participantCountText}>{participants.length} {t('Participants')}</Text>
          </View>
        </View>

        {!isDiceRolling && !showResult && (
          <View style={styles.waitingBadge}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6B46C1" />
            <Text style={[styles.waitingText, language === 'ta' && { fontSize: 11 }]}>{t('Waiting for Admin to start the draw...')}</Text>
          </View>
        )}
        
        <View style={styles.diceWrapper}>
          <Animated.View style={[styles.diceContainer, { transform: [{ translateY: animTranslateY }] }]}>
            <Animated.View style={[styles.face, { transform: getFaceTransform('0deg', null), backgroundColor: 1 <= maxParticipants ? '#6B46C1' : '#E5E7EB', borderColor: 1 <= maxParticipants ? '#4C1D95' : '#D1D5DB' }]}>
              {1 <= maxParticipants && <Dots value={1} />}
            </Animated.View>
            <Animated.View style={[styles.face, { transform: getFaceTransform(null, '-90deg'), backgroundColor: 2 <= maxParticipants ? '#7C3AED' : '#E5E7EB', borderColor: 2 <= maxParticipants ? '#5B21B6' : '#D1D5DB' }]}>
              {2 <= maxParticipants && <Dots value={2} />}
            </Animated.View>
            <Animated.View style={[styles.face, { transform: getFaceTransform('90deg', null), backgroundColor: 3 <= maxParticipants ? '#8B5CF6' : '#E5E7EB', borderColor: 3 <= maxParticipants ? '#6D28D9' : '#D1D5DB' }]}>
              {3 <= maxParticipants && <Dots value={3} />}
            </Animated.View>
            <Animated.View style={[styles.face, { transform: getFaceTransform('-90deg', null), backgroundColor: 4 <= maxParticipants ? '#A855F7' : '#E5E7EB', borderColor: 4 <= maxParticipants ? '#7E22CE' : '#D1D5DB' }]}>
              {4 <= maxParticipants && <Dots value={4} />}
            </Animated.View>
            <Animated.View style={[styles.face, { transform: getFaceTransform(null, '90deg'), backgroundColor: 5 <= maxParticipants ? '#9333EA' : '#E5E7EB', borderColor: 5 <= maxParticipants ? '#6B21A8' : '#D1D5DB' }]}>
              {5 <= maxParticipants && <Dots value={5} />}
            </Animated.View>
            <Animated.View style={[styles.face, { transform: getFaceTransform('180deg', null), backgroundColor: 6 <= maxParticipants ? '#C084FC' : '#E5E7EB', borderColor: 6 <= maxParticipants ? '#9333EA' : '#D1D5DB' }]}>
              {6 <= maxParticipants && <Dots value={6} />}
            </Animated.View>
          </Animated.View>
        </View>
        
        {showResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Winner Rolled:</Text>
            <View style={styles.resultValue}>
              <Text style={styles.resultNumber}>{diceValue}</Text>
            </View>
          </View>
        )}

        {isDiceRolling && (
          <View style={styles.rollingBadge}>
            <MaterialCommunityIcons name="timer-sand" size={18} color="#92400E" />
            <Text style={styles.rollingText}>Rolling in progress...</Text>
          </View>
        )}
        
        {!hasJoined && !isDiceRolling && !showResult && (
          <TouchableOpacity 
            style={styles.rollButton}
            onPress={joinDraw}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="hand-wave" size={20} color="#FFFFFF" />
            <Text style={styles.rollButtonText}>Join Lucky Draw</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderParticipantsGrid()}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  diceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  diceTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  diceTitleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  participantCountBadge: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  diceWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  diceContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  face: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    backfaceVisibility: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  rollButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    elevation: 5,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  rollButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803D',
  },
  resultValue: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rollingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    marginTop: 10,
  },
  rollingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  participantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  participantCard: {
    width: (width - 80) / 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  participantNumber: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  participantNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
});

export default RandomAuction;
