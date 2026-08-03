import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, StyleSheet, Animated, Dimensions, Easing, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect as SvgRect,
  Path,
  G
} from 'react-native-svg';

import styles from './SplashStyle';

const { width, height } = Dimensions.get('window');
const FLOWER_SIZE = width * 1.8;

const RangoliPurple = require('../../../assets/splash/RangoliPurple.jpeg');
const RangoliWhite = require('../../../assets/splash/RangoliWhite.jpeg'); // The white version

// The 4-pointed star path
const STAR_PATH = "M 50 5 C 50 32 68 50 95 50 C 68 50 50 68 50 95 C 50 68 32 50 5 50 C 32 50 50 32 50 5 Z";

export const SplashScreen = ({ navigation, onFinish, loop = false }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current; // Opaque cover overlay
  const waveSize = useRef(new Animated.Value(0)).current;
  const targetRouteRef = useRef('Welcome');

  // Background Auth Check & Asset Pre-decoding
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndPrepare = async () => {
      // 1. Resolve Auth Route in background
      try {
        const phone = await AsyncStorage.getItem('userPhone');
        const role = await AsyncStorage.getItem('userRole');
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!phone || !role || !accessToken || !refreshToken) {
          targetRouteRef.current = 'Welcome';
        } else if (String(role || '').toLowerCase() === 'admin') {
          targetRouteRef.current = 'AdminTabs';
        } else {
          targetRouteRef.current = 'TabRouter';
        }
      } catch (error) {
        targetRouteRef.current = 'Welcome';
      }

      // 2. Prefetch Both Image Assets to eliminate bitmap decoding delay
      try {
        const purpleUri = Image.resolveAssetSource(RangoliPurple)?.uri;
        const whiteUri = Image.resolveAssetSource(RangoliWhite)?.uri;
        if (purpleUri) await Image.prefetch(purpleUri).catch(() => {});
        if (whiteUri) await Image.prefetch(whiteUri).catch(() => {});
      } catch (e) {
        // Fallback gracefully
      }

      // 3. Wait 2 frames for Android layout engine to draw full opacity screen under overlay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isMounted) return;

          // Reveal Splash Screen: Fade out dark cover overlay smoothly (220ms)
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();

          // Spin purple mandala immediately in lockstep
          Animated.timing(rotation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();

          // Expand white mandala reveal
          Animated.timing(waveSize, {
            toValue: FLOWER_SIZE,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
            delay: 2300,
          }).start();

          if (!loop) {
            setTimeout(() => {
              if (!isMounted) return;
              const target = targetRouteRef.current;
              if (onFinish) {
                onFinish(target);
              } else if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: target }],
                });
              }
            }, 3700);
          }
        });
      });
    };

    checkAuthAndPrepare();
    return () => { isMounted = false; };
  }, [loop, navigation, onFinish, overlayOpacity, rotation, waveSize]);

  // Interpolate for a gentle quarter rotation (90 degrees), starting upside down (180deg)
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '270deg'],
  });

  const waveBorderRadius = waveSize.interpolate({
    inputRange: [0, FLOWER_SIZE],
    outputRange: [0, FLOWER_SIZE / 2],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0C38" translucent={false} />

      {/* Fully Opaque Base Layer (Image + Text rendered at opacity: 1 beneath cover) */}
      <View style={styles.topRangoliWrapper} pointerEvents="none">
        
        {/* Base Purple Mandala (Clipped in a circle container to remove square edges) */}
        <View style={styles.mandalaCircleContainer}>
          <Animated.Image
            source={RangoliPurple}
            style={{
              width: FLOWER_SIZE,
              height: FLOWER_SIZE,
              opacity: 0.8,
              transform: [{ rotate: spin }],
            }}
            resizeMode="cover"
          />
        </View>

        {/* White Mandala Reveal Mask (expands from center) */}
        <Animated.View
          style={{
            position: 'absolute',
            width: waveSize,
            height: waveSize,
            borderRadius: waveBorderRadius,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {/* The White Image stays fixed size and aligns perfectly with the base image */}
          <Animated.Image
            source={RangoliWhite}
            style={{
              position: 'absolute',
              width: FLOWER_SIZE,
              height: FLOWER_SIZE,
              opacity: 0.8,
              transform: [{ rotate: spin }], // It must spin perfectly in sync with the base!
            }}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* ── Main Text Content Overlay ── */}
      <View style={styles.contentWrapper}>
        <View style={styles.brandHeader}>
          {/* Main Title */}
          <Text style={styles.brandTitleText}>ஸ்ரீ பெரியநாயகி அம்மன்</Text>

          <View style={styles.taglineRow}>
            <Svg width={36} height={1}>
              <Defs>
                <SvgLinearGradient id="lineGradLeft" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#e5c158" stopOpacity="0" />
                  <Stop offset="100%" stopColor="#e5c158" stopOpacity="0.8" />
                </SvgLinearGradient>
              </Defs>
              <SvgRect width="36" height="1" fill="url(#lineGradLeft)" />
            </Svg>

            <Text style={styles.taglineDot}>✦</Text>
            <Text style={styles.taglineText}>Chitfunds Since 1999</Text>
            <Text style={styles.taglineDot}>✦</Text>

            <Svg width={36} height={1}>
              <Defs>
                <SvgLinearGradient id="lineGradRight" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#e5c158" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor="#e5c158" stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <SvgRect width="36" height="1" fill="url(#lineGradRight)" />
            </Svg>
          </View>
        </View>
      </View>

      {/* ── Bottom Brand Footer ── */}
      <View style={styles.bottomFooter}>
        <View style={styles.brandLogoRow}>
          <Text style={styles.brandLogoText}>ஸ்ரீ</Text>
          <Svg width={18} height={18} viewBox="0 0 100 100" style={styles.miniStar}>
            <Defs>
              <SvgLinearGradient id="miniStarGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FFF176" />
                <Stop offset="100%" stopColor="#FFC107" />
              </SvgLinearGradient>
            </Defs>
            <Path d={STAR_PATH} fill="url(#miniStarGrad)" />
          </Svg>
        </View>
        <Text style={styles.brandLogoGold}>CHITFUNDS</Text>
      </View>

      {/* ── Top Cover Overlay (Fades out from opacity: 1 to 0 to reveal fully rendered layout) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#1A0C38',
            opacity: overlayOpacity,
            zIndex: 999,
          },
        ]}
      />
    </View>
  );
};

export default SplashScreen;