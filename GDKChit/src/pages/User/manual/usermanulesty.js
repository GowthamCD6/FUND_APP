import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    backgroundColor: 'transparent', // 100% Clear page background (Zero dimming!)
    zIndex: 9999,
  },

  // Top Right Skip Button
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 20,
    zIndex: 10005,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },

  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },

  // Top Left Step Counter Pill
  stepPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 20,
    zIndex: 10005,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 70, 193, 0.85)',
    borderWidth: 1,
    borderColor: '#A78BFA',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  stepPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FBBF24',
    marginRight: 8,
  },

  stepPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Vibrant Gold Circle Spotlight surrounding target button (positioned via transform)
  spotlightCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 18,
    elevation: 20,
    zIndex: 10001,
  },

  // High-Visibility Amber Gold Cursor Pointer Icon (positioned via transform)
  cursorPointerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10003,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },

  // Ultra-Transparent Floating Text Section
  tooltipCard: {
    position: 'absolute',
    left: width * 0.05,
    width: width * 0.9,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // High contrast dark glassmorphic card for 100% text readability
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#A78BFA',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 10002,
  },

  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  tooltipBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  tooltipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  tooltipDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  tooltipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },

  activeDot: {
    width: 18,
    backgroundColor: '#A78BFA',
  },

  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },

  tapHintText: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 80,
    width: '100%',
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    zIndex: 10005,
  },
});

export default styles;
