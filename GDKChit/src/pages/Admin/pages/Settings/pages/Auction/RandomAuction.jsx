import React, { useState, useMemo } from 'react';
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

const { width, height } = Dimensions.get('window');

const RandomAuction = ({
  participants = [],
  onAuctionComplete,
}) => {
  
  const [diceValue, setDiceValue] = useState(1);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  
  // Animation Values
  const diceAnimations = useMemo(() => ({
    scale: new Animated.Value(1),
    rotateX: new Animated.Value(0),
    rotateY: new Animated.Value(0),
    rotateZ: new Animated.Value(0)
  }), []);

  const rollDice = (debugMode = false) => {
    if (isDiceRolling && !debugMode) return;
    setIsDiceRolling(true);

    // Vibration feedback
    if (!debugMode) {
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 30, 20, 30, 20, 30, 20]);
      } else if (Platform.OS === 'android') {
        Vibration.vibrate([0, 20, 15, 20, 15, 20, 15]);
      }
    }

    // Generate final dice value and set initial position
    const finalValue = Math.floor(Math.random() * 6) + 1;
    
    // Reset animations to starting position
    diceAnimations.scale.setValue(1.2); // Start slightly larger
    diceAnimations.rotateX.setValue(0);
    diceAnimations.rotateY.setValue(0);
    diceAnimations.rotateZ.setValue(0);

    // Helper function to create a single roll phase
    const createRollPhase = (phase, totalPhases) => {
      const progress = phase / totalPhases;
      const intensity = 1 - progress; // Rolls become less intense over time
      
      return Animated.parallel([
        // Scale bounce effect
        Animated.sequence([
          Animated.timing(diceAnimations.scale, {
            toValue: 1 + (0.3 * intensity),
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(diceAnimations.scale, {
            toValue: 0.8,
            duration: 150,
            easing: Easing.bounce,
            useNativeDriver: true,
          })
        ]),
        // Horizontal rolling (mainly Y-axis)
        Animated.timing(diceAnimations.rotateY, {
          toValue: diceAnimations.rotateY._value + (360 * (1 + intensity)),
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Slight forward roll (X-axis)
        Animated.timing(diceAnimations.rotateX, {
          toValue: diceAnimations.rotateX._value + (90 * intensity),
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        // Small wobble (Z-axis)
        Animated.sequence([
          Animated.timing(diceAnimations.rotateZ, {
            toValue: 30 * intensity,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(diceAnimations.rotateZ, {
            toValue: -30 * intensity,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          })
        ])
      ]);
    };

    // Create the main rolling sequence
    const rollPhases = [];
    const numPhases = 4;
    
    for (let i = 0; i < numPhases; i++) {
      rollPhases.push(createRollPhase(i, numPhases));
    }

    // Final settling animation
    const settleSequence = Animated.parallel([
      // Return to normal scale with a small bounce
      Animated.spring(diceAnimations.scale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      // Settle to the final rotation for the correct dice face
      Animated.spring(diceAnimations.rotateX, {
        toValue: finalValue <= 3 ? 0 : 180,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(diceAnimations.rotateY, {
        toValue: [1, 4].includes(finalValue) ? 0 : ([2, 5].includes(finalValue) ? 90 : -90),
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      // Stabilize any wobble
      Animated.spring(diceAnimations.rotateZ, {
        toValue: 0,
        friction: 4,
        tension: 45,
        useNativeDriver: true,
      })
    ]);

    // Combine all animations into the final sequence
    const ludoRollAnimation = Animated.sequence([
      ...rollPhases,
      settleSequence
    ]);

    // Rapid face changes during rolling
    let rollCount = 0;
    const faceChangeInterval = setInterval(() => {
      if (rollCount < 12) {
        setDiceValue(Math.floor(Math.random() * 6) + 1);
        rollCount++;
      } else {
        clearInterval(faceChangeInterval);
      }
    }, 100);

      // Run the animation with rapid face changes
    let currentFace = 1;
    const faceInterval = setInterval(() => {
      if (isDiceRolling) {
        currentFace = (currentFace % 6) + 1;
        setDiceValue(currentFace);
      }
    }, 100);

    ludoRollAnimation.start(() => {
      clearInterval(faceInterval);
      setDiceValue(finalValue);
      
      // Add a small delay before showing the result
      setTimeout(() => {
        setIsDiceRolling(false);
        
        if (participants.length === 0) {
          Alert.alert("Error", "No participants available for the random draw.");
          return;
        }

        const winnerIndex = (finalValue - 1) % participants.length;
        const winner = participants[winnerIndex];

        // Vibrate to indicate completion
        if (Platform.OS === 'ios') {
          Vibration.vibrate([0, 50]);
        } else {
          Vibration.vibrate(50);
        }

        if (onAuctionComplete) {
          onAuctionComplete({
            type: 'random',
            winner: winner,
            diceValue: finalValue
          });
        }
      }, 500);
    });
  };

  const renderDiceContainer = () => (
    <View style={styles.diceCard}>
      <Text style={styles.diceTitle}>Lucky Draw</Text>
      <Text style={styles.diceSubtitle}>Roll the dice to select winner</Text>
      
      <View style={styles.diceWrapper}>
        <View style={styles.diceContainer}>
            <Animated.View 
          style={[
            styles.dice,
            {
              transform: [
                { scale: diceAnimations.scale },
                { rotateX: diceAnimations.rotateX.interpolate({
                    inputRange: [-720, 0, 720, 1440, 2160],
                    outputRange: ['-720deg', '0deg', '720deg', '1440deg', '2160deg']
                  })
                },
                { rotateY: diceAnimations.rotateY.interpolate({
                    inputRange: [-720, 0, 720, 1440, 2160],
                    outputRange: ['-720deg', '0deg', '720deg', '1440deg', '2160deg']
                  })
                },
                { rotateZ: diceAnimations.rotateZ.interpolate({
                    inputRange: [-720, 0, 720, 1440],
                    outputRange: ['-720deg', '0deg', '720deg', '1440deg']
                  })
                }
              ]
            }
          ]}
        >
          <MaterialCommunityIcons 
            name={`dice-${diceValue}`} 
            size={60} 
            color={isDiceRolling ? "#6B46C1" : "#2D1B69"} 
          />
            </Animated.View>
            {isDiceRolling && (
              <View style={styles.diceShadow} />
            )}
          </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.rollButton, isDiceRolling && styles.disabledButton]}
        onPress={rollDice}
        disabled={isDiceRolling}
      >
        <MaterialCommunityIcons 
          name={isDiceRolling ? "loading" : "dice-multiple"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.rollButtonText}>
          {isDiceRolling ? 'Rolling...' : 'Roll Dice'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderParticipantsGrid = () => (
    <View style={styles.participantsCard}>
      <Text style={styles.cardTitle}>Participants</Text>
      <View style={styles.participantsGrid}>
        {participants.map((participant, index) => (
          <View key={participant.id} style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.avatarText}>{participant.avatar}</Text>
            </View>
            <Text style={styles.participantName}>{participant.name.split(' ')[0]}</Text>
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
      {renderDiceContainer()}
      {renderParticipantsGrid()}
      
      {!isDiceRolling && (
        <TouchableOpacity 
          style={styles.startButton}
          onPress={rollDice}
          disabled={isDiceRolling}
        >
          <MaterialCommunityIcons 
            name={'dice-multiple'} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.startButtonText}>
            Roll for Winner
          </Text>
        </TouchableOpacity>
      )}
      {isDiceRolling && (
        <View style={[styles.startButton, styles.disabledButton]}>
          <MaterialCommunityIcons 
            name={'loading'} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.startButtonText}>
            Rolling...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    paddingHorizontal: 16,
  },
  diceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  diceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  diceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  diceWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    perspective: 1000,
  },
  diceContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dice: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: '#6B46C1',
  },
  diceShadow: {
    position: 'absolute',
    bottom: -5,
    width: 90,
    height: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    transform: [{ scaleX: 0.9 }],
  },
  rollButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  rollButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F8F8FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantNumber: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RandomAuction;
