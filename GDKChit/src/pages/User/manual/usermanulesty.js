import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ─── Root container (absolute full-screen) ───
  rootOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
  },

  // ─── Four dim panels that surround the transparent cut-out ───
  dimPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },

  // ─── Transparent cut-out window with glowing border ───
  cutoutWindow: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
    zIndex: 10001,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },

  // ─── Animated hand pointer ───
  handContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10005,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Typewriter text container ───
  textContainer: {
    position: 'absolute',
    left: width * 0.05,
    width: width * 0.9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 10020,
  },

  // ─── Title row (icon + title) ───
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    flex: 1,
  },

  // ─── Description text with typewriter effect ───
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  typewriterCursor: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  // ─── Footer (progress dots + Next button) ───
  footerRow: {
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
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  completedDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },

  // ─── "Press here" instruction badge (appears during wait-for-press steps) ───
  pressHereBadge: {
    position: 'absolute',
    zIndex: 10006,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 10,
  },
  pressHereText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default styles;
