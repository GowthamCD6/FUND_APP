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
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AuctionWebSocketService from '../../../../../../../services/AuctionWebSocketService';
import { useLanguage } from '../../../../../../../utils/LanguageContext';

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
}) => {
  const { t } = useLanguage();
  const [poolAmount, setPoolAmount] = useState(selectedGroup?.groupAmount?.toString() || '');
  const [diceValue, setDiceValue] = useState(1);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [joinedParticipants, setJoinedParticipants] = useState(new Set());

  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(0)).current;
  
  const currentX = useRef(0);
  const currentY = useRef(0);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    const handleUserJoined = (data) => {
      if (data.groupId === selectedGroup?.id) {
        setJoinedParticipants(prev => {
          const newSet = new Set(prev);
          newSet.add(data.userId.toString());
          return newSet;
        });
      }
    };
    const unsubscribe = AuctionWebSocketService.on('user_joined_auction', handleUserJoined);
    return () => unsubscribe();
  }, [selectedGroup]);

  useEffect(() => {
    const idX = animX.addListener(({ value }) => { currentX.current = value; });
    const idY = animY.addListener(({ value }) => { currentY.current = value; });
    return () => {
      animX.removeListener(idX);
      animY.removeListener(idY);
    };
  }, [animX, animY]);

  const allJoined = participants.length > 0 && participants.every(p => joinedParticipants.has(p.id.toString()));
  const maxParticipants = Math.min(Math.max(participants.length, 1), 6);

  const rollDice = () => {
    if (isDiceRolling) return;
    if (participants.length === 0) {
      Alert.alert("Error", t("No participants available for the random draw."));
      return;
    }
    if (!allJoined) {
      Alert.alert("Waiting", t("Please wait for all selected participants to join the auction."));
      return;
    }

    const parsedAmount = parseFloat(poolAmount);
    if (!poolAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", t("Please enter a valid pool amount."));
      return;
    }

    const finalValue = Math.floor(Math.random() * maxParticipants) + 1;
    const winner = participants[finalValue - 1]; // Dice value maps directly to participant number

    if (selectedGroup?.id) {
      AuctionWebSocketService.rollDice(
        selectedGroup.id,
        30000, 
        finalValue,
        winner,
        parseFloat(poolAmount)
      );
    }
    
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
        duration: 30000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(animY, {
        toValue: finalY,
        duration: 30000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(animTranslateY, {
          toValue: -100,
          duration: 10000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: 20000,
          easing: Easing.bounce,
          useNativeDriver: true
        })
      ])
    ]).start();

    // Use strict setTimeout to ensure modal only shows after exact duration
    const t1 = setTimeout(() => {
      setDiceValue(finalValue);
      setShowResult(true);
      
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 70, 40, 70]);
      } else {
        Vibration.vibrate([0, 60, 30, 60]);
      }
      
      const t2 = setTimeout(() => {
        setIsDiceRolling(false);
        if (onAuctionComplete && winner) {
          onAuctionComplete({
            type: 'random',
            winner: winner,
            diceValue: finalValue,
            participantPosition: finalValue,
            amount: parseFloat(poolAmount)
          });
        }
      }, 500); 
      timersRef.current.push(t2);
    }, 31000); 
    timersRef.current.push(t1);
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
    
    // React Native doesn't natively support translateZ in style transforms.
    // We simulate translateZ(50) by rotating 90deg, moving along X, then rotating back.
    transforms.push({ rotateY: '90deg' });
    transforms.push({ translateX: 50 });
    transforms.push({ rotateY: '-90deg' });
    
    return transforms;
  };

  const renderParticipantsTable = () => (
    <View style={styles.participantsCard}>
      <Text style={styles.cardTitle}>{t('Participants')}</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.2 }]}>No.</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>{t('Participant')}</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.3, textAlign: 'right' }]}>{t('Status')}</Text>
        </View>
        {participants.map((participant, index) => {
          const isJoined = joinedParticipants.has(participant.id.toString());
          return (
            <View key={participant.id} style={styles.tableRow}>
              <View style={{ flex: 0.2, justifyContent: 'center' }}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{index + 1}</Text>
                </View>
              </View>
              <View style={styles.tableCellUser}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>{participant.avatar}</Text>
                </View>
                <Text style={styles.tableUserName} numberOfLines={1}>{participant.name}</Text>
              </View>
              <View style={{ flex: 0.3, alignItems: 'flex-end', justifyContent: 'center' }}>
                <View style={[styles.statusBadgeInline, isJoined ? {backgroundColor: '#D1FAE5'} : {backgroundColor: '#FEF3C7'}]}>
                  <Text style={[styles.statusBadgeTextInline, isJoined ? {color: '#065F46'} : {color: '#92400E'}]}>
                    {isJoined ? t('Joined') : t('Pending')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.tabContent}>
      <View style={styles.diceCard}>
        <View style={styles.diceTitleContainer}>
          <Text style={styles.diceTitle}>{t('Lucky Draw')}</Text>
          <View style={styles.participantCountBadge}>
            <MaterialCommunityIcons name="account-multiple" size={14} color="#FFFFFF" />
            <Text style={styles.participantCountText}>{participants.length} {participants.length === 1 ? t('Participant') : t('Participants')}</Text>
          </View>
        </View>
        
        {!isDiceRolling && !showResult && (
          <View style={styles.poolAmountCard}>
            <Text style={styles.poolAmountLabel}>{t('Lucky Draw Pool Amount')}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={poolAmount}
                onChangeText={setPoolAmount}
                placeholder="90000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
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
            <Text style={styles.resultLabel}>{t('Rolled:')}</Text>
            <View style={styles.resultValue}>
              <Text style={styles.resultNumber}>{diceValue}</Text>
            </View>
          </View>
        )}

        {isDiceRolling && (
          <View style={styles.rollingBadge}>
            <MaterialCommunityIcons name="timer-sand" size={18} color="#92400E" />
            <Text style={styles.rollingText}>{t('Rolling...')}</Text>
          </View>
        )}
        
        {!isDiceRolling && !showResult && (
          <TouchableOpacity 
            style={[styles.rollButton, !allJoined && styles.disabledButton]}
            onPress={rollDice}
            disabled={!allJoined}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="dice-multiple" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.rollButtonText}>
              {allJoined ? t('Roll Dice') : t('Waiting for Participants...')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {renderParticipantsTable()}
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
  poolAmountCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  poolAmountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B46C1',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
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
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#9CA3AF',
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
  tableContainer: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  numberBadge: {
    backgroundColor: '#F3F4F6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tableCellUser: {
    flex: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  smallAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  statusBadgeInline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeTextInline: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default RandomAuction;