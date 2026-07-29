import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const AnimationDebugPanel = ({
  isVisible,
  onClose,
  animationProgress,
  animationDuration,
  animationState,
  onPlayPause,
  onRestart,
  onSpeedChange,
  onSeek,
  isPlaying,
}) => {
  const [speed, setSpeed] = useState(1);
  const [minimized, setMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + (100 * speed);
          if (newTime >= animationDuration) {
            clearInterval(interval);
            return animationDuration;
          }
          return newTime;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, speed, animationDuration]);

  // Reset time when animation restarts
  useEffect(() => {
    if (!isPlaying) {
      setCurrentTime(0);
    }
  }, [isPlaying]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  const renderPlaybackControls = () => (
    <View style={styles.controlsRow}>
      <TouchableOpacity onPress={onRestart} style={styles.controlButton}>
        <MaterialCommunityIcons name="restart" size={24} color="#6B46C1" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPlayPause} style={styles.controlButton}>
        <MaterialCommunityIcons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color="#6B46C1" 
        />
      </TouchableOpacity>
      <View style={styles.speedControl}>
        <Text style={styles.speedLabel}>Speed: {speed}x</Text>
        <View style={styles.speedButtons}>
          <TouchableOpacity 
            onPress={() => {
              const newSpeed = Math.max(0.25, speed - 0.25);
              setSpeed(newSpeed);
              onSpeedChange(newSpeed);
            }} 
            style={styles.speedButton}
          >
            <Text style={styles.speedButtonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              const newSpeed = Math.min(2, speed + 0.25);
              setSpeed(newSpeed);
              onSpeedChange(newSpeed);
            }} 
            style={styles.speedButton}
          >
            <Text style={styles.speedButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      <Slider
        style={styles.timeline}
        minimumValue={0}
        maximumValue={animationDuration}
        value={currentTime}
        onValueChange={onSeek}
        onSlidingComplete={onSeek}
        minimumTrackTintColor="#6B46C1"
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor="#6B46C1"
        step={1}
      />
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeLabel}>{formatTime(animationDuration)}</Text>
      </View>
    </View>
  );

  const renderAnimationState = () => (
    <View style={styles.stateContainer}>
      <Text style={styles.stateLabel}>Animation State:</Text>
      <ScrollView style={styles.stateScroll} horizontal>
        {Object.entries(animationState).map(([key, value]) => (
          <View key={key} style={styles.stateItem}>
            <Text style={styles.stateItemLabel}>{key}:</Text>
            <Text style={styles.stateItemValue}>
              {typeof value === 'number' ? value.toFixed(2) : value.toString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderMinimizedView = () => (
    <View style={styles.minimizedContainer}>
      <TouchableOpacity 
        style={styles.minimizedButton}
        onPress={() => setMinimized(false)}
      >
        <MaterialCommunityIcons name="chevron-up" size={24} color="#6B46C1" />
        <Text style={styles.minimizedText}>Animation Debugger</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {minimized ? renderMinimizedView() : (
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>Animation Debugger</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  onPress={() => setMinimized(true)}
                  style={styles.headerButton}
                >
                  <MaterialCommunityIcons name="chevron-down" size={24} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.headerButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            
            {renderPlaybackControls()}
            {renderTimeline()}
            {renderAnimationState()}
            
            <View style={styles.shortcuts}>
              <Text style={styles.shortcutsTitle}>Keyboard Shortcuts:</Text>
              <Text style={styles.shortcutText}>• Space: Play/Pause</Text>
              <Text style={styles.shortcutText}>• R: Restart</Text>
              <Text style={styles.shortcutText}>• ←/→: Seek</Text>
              <Text style={styles.shortcutText}>• ↑/↓: Speed</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  controlButton: {
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  speedControl: {
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  speedButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  speedButtonText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  timelineContainer: {
    marginBottom: 20,
  },
  timeline: {
    width: '100%',
    height: 40,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stateContainer: {
    marginBottom: 20,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  stateScroll: {
    flexGrow: 0,
  },
  stateItem: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  stateItemValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  shortcuts: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  shortcutsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  minimizedContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  minimizedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    marginLeft: 8,
  },
});

export default AnimationDebugPanel;