import React, { useState, useMemo, useRef } from 'react';
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
import Svg, { Polygon, G, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const RandomAuction = ({ participants = [], onAuctionComplete }) => {
  const [diceValue, setDiceValue] = useState(1);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [drawInProgress, setDrawInProgress] = useState(true); // Draw is ongoing

  // 3D Cube Animation Values
  const diceAnimations = useMemo(
    () => ({
      scale: new Animated.Value(1),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotateX: new Animated.Value(0),
      rotateY: new Animated.Value(0),
      rotateZ: new Animated.Value(0),
    }),
    [],
  );

  // 3D Cube Geometry
  const create3DCube = (
    size,
    rotX,
    rotY,
    rotZ,
    translateX,
    translateY,
    scale,
  ) => {
    const s = size / 2;

    // Define vertices of cube
    let vertices = [
      [-s, -s, -s],
      [s, -s, -s],
      [s, s, -s],
      [-s, s, -s], // Front face indices: 0, 1, 2, 3
      [-s, -s, s],
      [s, -s, s],
      [s, s, s],
      [-s, s, s], // Back face indices: 4, 5, 6, 7
    ];

    // Apply 3D transformations
    vertices = vertices.map(([x, y, z]) => {
      // Rotate X
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);

      // Rotate Y
      let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
      let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

      // Rotate Z
      let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
      let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);

      // Apply scale and translation
      return [x3 * scale + translateX, y3 * scale + translateY, z2 * scale];
    });

    // Define faces with vertices indices - Mapped to standard dice values
    const faces = [
      {
        name: 'front',
        indices: [0, 1, 2, 3],
        color: '#6B46C1',
        dots: 1,
        initialRot: { x: 0, y: 0 },
      },
      {
        name: 'back',
        indices: [5, 4, 7, 6],
        color: '#7C3AED',
        dots: 6,
        initialRot: { x: 0, y: Math.PI },
      },
      {
        name: 'left',
        indices: [4, 0, 3, 7],
        color: '#8B5CF6',
        dots: 4,
        initialRot: { x: 0, y: -Math.PI / 2 },
      },
      {
        name: 'right',
        indices: [1, 5, 6, 2],
        color: '#9333EA',
        dots: 3,
        initialRot: { x: 0, y: Math.PI / 2 },
      },
      {
        name: 'top',
        indices: [3, 2, 6, 7],
        color: '#A855F7',
        dots: 5,
        initialRot: { x: -Math.PI / 2, y: 0 },
      },
      {
        name: 'bottom',
        indices: [4, 5, 1, 0],
        color: '#C084FC',
        dots: 2,
        initialRot: { x: Math.PI / 2, y: 0 },
      },
    ];

    // Calculate face centers and depth for sorting
    return faces
      .map(face => {
        const faceVertices = face.indices.map(i => vertices[i]);
        const center = faceVertices
          .reduce(
            (acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]],
            [0, 0, 0],
          )
          .map(c => c / 4);

        return {
          ...face,
          vertices: faceVertices,
          depth: center[2],
          visible: center[2] > -s,
        };
      })
      .sort((a, b) => a.depth - b.depth);
  };

  const renderDots = (dots, vertices) => {
    const center = vertices
      .reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1]], [0, 0])
      .map(c => c / 4);

    const s = 80 / 2;
    const dotOffset = s * 0.35;
    const dotRadius = 4.5;

    const dotPositions = {
      1: [[0, 0]],
      2: [
        [-dotOffset, -dotOffset],
        [dotOffset, dotOffset],
      ],
      3: [
        [-dotOffset, -dotOffset],
        [0, 0],
        [dotOffset, dotOffset],
      ],
      4: [
        [-dotOffset, -dotOffset],
        [dotOffset, -dotOffset],
        [-dotOffset, dotOffset],
        [dotOffset, dotOffset],
      ],
      5: [
        [-dotOffset, -dotOffset],
        [dotOffset, -dotOffset],
        [0, 0],
        [-dotOffset, dotOffset],
        [dotOffset, dotOffset],
      ],
      6: [
        [-dotOffset, -dotOffset],
        [dotOffset, -dotOffset],
        [-dotOffset, 0],
        [dotOffset, 0],
        [-dotOffset, dotOffset],
        [dotOffset, dotOffset],
      ],
    };

    return (dotPositions[dots] || []).map((pos, i) => (
      <Circle
        key={i}
        cx={center[0] + pos[0]}
        cy={center[1] + pos[1]}
        r={dotRadius}
        fill="white"
      />
    ));
  };

  const joinDraw = () => {
    if (!drawInProgress) {
      Alert.alert('Draw Ended', 'This lucky draw has already concluded.');
      return;
    }

    if (hasJoined) {
      Alert.alert(
        'Already Joined',
        'You have already joined this lucky draw. Wait for the admin to roll the dice!',
      );
      return;
    }

    setHasJoined(true);
    Alert.alert(
      'Joined Successfully!',
      'You have joined the lucky draw. Wait for the admin to start the draw.',
    );
  };

  const rollDice = () => {
    // This function is now for simulation/demo purposes only
    // In real app, only admin can trigger this
    if (isDiceRolling) return;
    setIsDiceRolling(true);
    setShowResult(false);

    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 50, 30, 50]);
    } else {
      Vibration.vibrate([0, 40, 25, 40]);
    }

    const finalValue = Math.floor(Math.random() * 6) + 1;

    diceAnimations.scale.setValue(1);
    diceAnimations.translateY.setValue(0);
    diceAnimations.translateX.setValue(0);
    diceAnimations.rotateX.setValue(0);
    diceAnimations.rotateY.setValue(0);
    diceAnimations.rotateZ.setValue(0);

    const ROLL_DURATION = 2500;
    const BOUNCE_COUNT = 15;

    const getTargetRotation = value => {
      const fullRotations = Math.PI * (8 + Math.floor(Math.random() * 4));
      let x = fullRotations;
      let y = fullRotations;

      switch (value) {
        case 1:
          x += 0;
          y += 0;
          break;
        case 6:
          x += 0;
          y += Math.PI;
          break;
        case 4:
          x += 0;
          y += -Math.PI / 2;
          break;
        case 3:
          x += 0;
          y += Math.PI / 2;
          break;
        case 5:
          x += -Math.PI / 2;
          y += 0;
          break;
        case 2:
          x += Math.PI / 2;
          y += 0;
          break;
        default:
          break;
      }
      return { x, y };
    };

    const targetRotation = getTargetRotation(finalValue);

    const createRealisticRoll = () => {
      const animations = [];
      const totalBounceTime = ROLL_DURATION * 0.75;
      const bounceDuration = totalBounceTime / BOUNCE_COUNT;

      for (let i = 0; i < BOUNCE_COUNT; i++) {
        const progress = i / BOUNCE_COUNT;
        const intensity = 1 - progress * 0.9;

        const randomX = (Math.random() - 0.5) * 40 * intensity;
        const randomHeight = 50 + Math.random() * 40 * intensity;
        const spinSpeedX = (Math.PI * 3 + Math.random() * Math.PI) * intensity;
        const spinSpeedY = (Math.PI * 3 + Math.random() * Math.PI) * intensity;
        const spinSpeedZ = (Math.random() - 0.5) * Math.PI * 2 * intensity;

        animations.push(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(diceAnimations.translateY, {
                toValue: -randomHeight,
                duration: bounceDuration * 0.45,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(diceAnimations.translateY, {
                toValue: 0,
                duration: bounceDuration * 0.55,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),

            Animated.sequence([
              Animated.timing(diceAnimations.translateX, {
                toValue: randomX,
                duration: bounceDuration * 0.5,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(diceAnimations.translateX, {
                toValue: -randomX * 0.3,
                duration: bounceDuration * 0.5,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),

            Animated.timing(diceAnimations.rotateX, {
              toValue: diceAnimations.rotateX._value + spinSpeedX,
              duration: bounceDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(diceAnimations.rotateY, {
              toValue: diceAnimations.rotateY._value + spinSpeedY,
              duration: bounceDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(diceAnimations.rotateZ, {
              toValue: spinSpeedZ,
              duration: bounceDuration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),

            Animated.sequence([
              Animated.timing(diceAnimations.scale, {
                toValue: 1 + 0.2 * intensity,
                duration: bounceDuration * 0.45,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(diceAnimations.scale, {
                toValue: 0.9,
                duration: bounceDuration * 0.1,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(diceAnimations.scale, {
                toValue: 1,
                duration: bounceDuration * 0.45,
                easing: Easing.out(Easing.bounce),
                useNativeDriver: true,
              }),
            ]),
          ]),
        );

        if (i % 3 === 0 && i > 0) {
          setTimeout(() => {
            if (Platform.OS === 'android') {
              Vibration.vibrate(20);
            }
          }, i * bounceDuration);
        }
      }

      return Animated.sequence(animations);
    };

    const createFinalSettle = () => {
      const settleDuration = ROLL_DURATION * 0.25;
      return Animated.parallel([
        Animated.sequence([
          Animated.timing(diceAnimations.translateY, {
            toValue: -40,
            duration: settleDuration * 0.2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(diceAnimations.translateY, {
            toValue: 0,
            duration: settleDuration * 0.8,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),

        Animated.spring(diceAnimations.translateX, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),

        Animated.spring(diceAnimations.rotateX, {
          toValue: targetRotation.x,
          friction: 12,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(diceAnimations.rotateY, {
          toValue: targetRotation.y,
          friction: 12,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(diceAnimations.rotateZ, {
          toValue: 0,
          friction: 12,
          tension: 50,
          useNativeDriver: true,
        }),

        Animated.sequence([
          Animated.timing(diceAnimations.scale, {
            toValue: 0.9,
            duration: settleDuration * 0.2,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(diceAnimations.scale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    const completeAnimation = Animated.sequence([
      createRealisticRoll(),
      createFinalSettle(),
    ]);

    let faceChangeCount = 0;
    const totalFaceChanges = Math.floor(ROLL_DURATION / 100);

    const faceChangeInterval = setInterval(() => {
      if (faceChangeCount < totalFaceChanges) {
        setDiceValue(Math.floor(Math.random() * 6) + 1);
        faceChangeCount++;
      } else {
        clearInterval(faceChangeInterval);
      }
    }, 100);

    completeAnimation.start(() => {
      clearInterval(faceChangeInterval);

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

          if (participants.length === 0) {
            Alert.alert(
              'Error',
              'No participants available for the random draw.',
            );
            return;
          }

          const winnerIndex = (finalValue - 1) % participants.length;
          const winner = participants[winnerIndex];

          if (onAuctionComplete) {
            onAuctionComplete({
              type: 'random',
              winner: winner,
              diceValue: finalValue,
            });
          }
        }, 800);
      }, 400);
    });
  };

  const Dice3D = () => {
    const [cubeState, setCubeState] = useState(null);

    React.useEffect(() => {
      const updateCube = () => {
        const rotX = diceAnimations.rotateX._value;
        const rotY = diceAnimations.rotateY._value;
        const rotZ = diceAnimations.rotateZ._value;
        const transX = diceAnimations.translateX._value;
        const transY = diceAnimations.translateY._value;
        const scale = diceAnimations.scale._value;

        const faces = create3DCube(80, rotX, rotY, rotZ, transX, transY, scale);
        setCubeState(faces);
      };

      const listeners = [
        diceAnimations.rotateX.addListener(updateCube),
        diceAnimations.rotateY.addListener(updateCube),
        diceAnimations.rotateZ.addListener(updateCube),
        diceAnimations.translateX.addListener(updateCube),
        diceAnimations.translateY.addListener(updateCube),
        diceAnimations.scale.addListener(updateCube),
      ];

      updateCube();

      return () =>
        listeners.forEach(id => {
          diceAnimations.rotateX.removeListener(id);
          diceAnimations.rotateY.removeListener(id);
          diceAnimations.rotateZ.removeListener(id);
          diceAnimations.translateX.removeListener(id);
          diceAnimations.translateY.removeListener(id);
          diceAnimations.scale.removeListener(id);
        });
    }, []);

    if (!cubeState) return null;

    return (
      <Svg width="200" height="200" viewBox="-100 -100 200 200">
        {cubeState.map((face, i) => {
          if (!face.visible) return null;

          const points = face.vertices.map(v => `${v[0]},${v[1]}`).join(' ');

          const isMainFace = showResult && face.depth > 35;
          const displayDots = showResult && isMainFace ? diceValue : face.dots;

          return (
            <G key={i}>
              <Polygon
                points={points}
                fill={
                  isMainFace
                    ? '#5B21B6'
                    : isDiceRolling
                    ? face.color
                    : '#6B46C1'
                }
                stroke={isMainFace ? '#2D1B69' : '#4C1D95'}
                strokeWidth={isMainFace ? 3.5 : 2.5}
              />
              {renderDots(displayDots, face.vertices)}
            </G>
          );
        })}
      </Svg>
    );
  };

  const renderDiceContainer = () => (
    <View style={styles.diceCard}>
      <Text style={styles.diceTitle}>Lucky Draw</Text>

      {hasJoined && drawInProgress && (
        <View style={styles.joinedMessage}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color="#10B981"
          />
          <Text style={styles.joinedText}>
            You've joined! Waiting for admin to roll...
          </Text>
        </View>
      )}

      {!drawInProgress && (
        <View style={styles.endedMessage}>
          <MaterialCommunityIcons
            name="flag-checkered"
            size={16}
            color="#6B7280"
          />
          <Text style={styles.endedText}>Lucky draw has ended</Text>
        </View>
      )}

      <View style={styles.diceWrapper}>
        <View style={styles.diceContainer}>
          <Dice3D />

          <Animated.View
            style={[
              styles.diceShadow,
              {
                transform: [
                  {
                    translateX: diceAnimations.translateX.interpolate({
                      inputRange: [-60, 0, 60],
                      outputRange: [-20, 0, 20],
                    }),
                  },
                  {
                    scaleX: diceAnimations.scale.interpolate({
                      inputRange: [0.8, 1, 1.3],
                      outputRange: [0.7, 1, 1.2],
                    }),
                  },
                  {
                    scaleY: diceAnimations.translateY.interpolate({
                      inputRange: [-100, 0],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
                opacity: diceAnimations.translateY.interpolate({
                  inputRange: [-100, -50, 0],
                  outputRange: [0.05, 0.15, 0.3],
                }),
              },
            ]}
          />
        </View>
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Rolled:</Text>
          <View style={styles.resultValue}>
            <Text style={styles.resultNumber}>{diceValue}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.rollButton,
          (isDiceRolling || hasJoined) && styles.disabledButton,
        ]}
        onPress={hasJoined ? null : rollDice}
        disabled={isDiceRolling || hasJoined}
        activeOpacity={hasJoined ? 1 : 0.7}
      >
        <MaterialCommunityIcons
          name={
            isDiceRolling
              ? 'timer-sand'
              : hasJoined
              ? 'check-circle'
              : 'dice-multiple'
          }
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.rollButtonText}>
          {isDiceRolling
            ? 'Rolling...'
            : hasJoined
            ? 'Joined Draw'
            : 'Preview Roll (Demo)'}
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
      {renderDiceContainer()}
      {renderParticipantsGrid()}

      {drawInProgress && !hasJoined && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={joinDraw}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="account-plus"
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.startButtonText}>Join Lucky Draw</Text>
        </TouchableOpacity>
      )}

      {hasJoined && drawInProgress && (
        <View style={[styles.startButton, styles.joinedButton]}>
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.startButtonText}>Joined - Waiting for Draw</Text>
        </View>
      )}

      {!drawInProgress && (
        <View style={[styles.startButton, styles.disabledButton]}>
          <MaterialCommunityIcons
            name="flag-checkered"
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.startButtonText}>Lucky Draw Ended</Text>
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
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
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
  diceWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  diceContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceShadow: {
    position: 'absolute',
    bottom: 20,
    width: 100,
    height: 25,
    borderRadius: 50,
    backgroundColor: 'rgba(107, 70, 193, 0.25)',
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
    backgroundColor: '#F8F8FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  startButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 14,
    gap: 10,
    elevation: 5,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#9333EA',
  },
  joinedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  joinedText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
  },
  endedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  endedText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  joinedButton: {
    backgroundColor: '#10B981',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default RandomAuction;
