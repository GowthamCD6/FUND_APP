import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0C38',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  /* ── Mandala Canvas Wrapper ─────────────────────────────────────────── */
  topRangoliWrapper: {
    position: 'absolute',
    top: -(width * 0.45),
    left: -(width * 0.36), // Moved a tiny bit towards the right
    width: width * 1.8,
    height: width * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mandalaCircleContainer: {
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: (width * 1.8) / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeStarContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }], // Center the 120x120 SVG
    zIndex: 5,
  },

  /* ── Content Overlay Area ────────────────────────────────────────────── */
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    zIndex: 10,
    marginTop: width * 0.48, // Positioned Tamil text higher up towards the mandala
  },

  brandHeader: {
    alignItems: 'center',
  },

  brandTitleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 42,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Black' : 'System',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },

  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },

  taglineText: {
    fontSize: 14,
    color: '#FFD54F',
    fontWeight: '700',
    letterSpacing: 0.8,
    fontStyle: 'normal',
  },

  taglineDot: {
    fontSize: 12,
    color: '#FFD54F',
    opacity: 0.8,
  },

  /* ── Bottom Brand Footer ───────────────────────────────────────────── */
  bottomFooter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandLogoText: {
    fontSize: 36,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-light' : 'System',
  },

  miniStar: {
    marginLeft: -2,
    marginTop: -16,
  },

  brandLogoGold: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD54F',
    letterSpacing: 3,
    marginTop: -4,
    textAlign: 'center',
  },
});

export default styles;