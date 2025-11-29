import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import styles from './Homesty';

const { width } = Dimensions.get('window');

// Configuration for the Perfect Slider
const CARD_WIDTH = width * 0.95; // Card takes 85% of screen width
const SPACING = 12; // Gap between cards
const SNAP_INTERVAL = CARD_WIDTH + SPACING; // Total scroll distance per slide

const Home = () => {
  const [activePlanSlide, setActivePlanSlide] = useState(0);
  const flatListRef = useRef(null);
  const scrollTimer = useRef(null);

  const plans = [
    {
      id: 1,
      name: '1 Lakh Plan',
      badge: 'Popular',
      amount: '₹1,00,000',
      monthly: '₹5,000',
      duration: '20 Months',
      return: '₹1,95,000',
      color: '#FFD700',
      gradient: ['#FFD700', '#FFA500'],
    },
    {
      id: 2,
      name: '2 Lakh Plan',
      badge: 'Best Value',
      amount: '₹2,00,000',
      monthly: '₹10,000',
      duration: '20 Months',
      return: '₹3,90,000',
      color: '#E5E4E2',
      gradient: ['#E5E4E2', '#C0C0C0'],
    },
    {
      id: 3,
      name: '3 Lakh Plan',
      badge: null,
      amount: '₹3,00,000',
      monthly: '₹15,000',
      duration: '20 Months',
      return: '₹5,85,000',
      color: '#B9F2FF',
      gradient: ['#B9F2FF', '#87CEEB'],
    },
    {
      id: 4,
      name: '5 Lakh Plan',
      badge: 'Premium',
      amount: '₹5,00,000',
      monthly: '₹25,000',
      duration: '20 Months',
      return: '₹9,75,000',
      color: '#DA70D6',
      gradient: ['#DA70D6', '#BA55D3'],
    },
  ];

  // Create infinite loop data by duplicating plans multiple times
  const infiniteData = [...plans, ...plans, ...plans];
  const initialIndex = plans.length; // Start from middle set

  // --- START: INFINITE CAROUSEL LOGIC ---

  // Initialize scroll position to middle set
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({ 
          index: initialIndex, 
          animated: false 
        });
      }, 100);
    }
  }, []);

  // Auto Scroll - Always moves forward (right to left)
  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    scrollTimer.current = setInterval(() => {
      if (flatListRef.current) {
        setActivePlanSlide((prev) => {
          const nextIndex = prev + 1;
          
          flatListRef.current.scrollToIndex({ 
            index: nextIndex, 
            animated: true,
          });
          
          return nextIndex;
        });
      }
    }, 3500);
  }, []);

  const stopAutoScroll = () => {
    if (scrollTimer.current) {
      clearInterval(scrollTimer.current);
      scrollTimer.current = null;
    }
  };

  // Reset to middle when reaching edges (seamless loop)
  const handleScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / SNAP_INTERVAL);
    
    // If we've scrolled past the middle set, reset to middle
    if (currentIndex >= plans.length * 2) {
      flatListRef.current.scrollToIndex({
        index: currentIndex - plans.length,
        animated: false,
      });
      setActivePlanSlide(currentIndex - plans.length);
    } else if (currentIndex < plans.length) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + plans.length,
        animated: false,
      });
      setActivePlanSlide(currentIndex + plans.length);
    }
  };

  // Lifecycle management
  useEffect(() => {
    setActivePlanSlide(initialIndex);
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll]);

  // Performance optimization for FlatList
  const getItemLayout = (data, index) => ({
    length: SNAP_INTERVAL,
    offset: SNAP_INTERVAL * index,
    index,
  });

  // --- END: INFINITE CAROUSEL LOGIC ---

  const features = [
    {
      title: 'Secure Investments',
      description:
        'Your money is safe with our RBI-compliant chit fund operations',
      icon: 'shield-check',
    },
    {
      title: 'Flexible Plans',
      description: 'Choose from various plans that suit your financial goals',
      icon: 'cog-outline',
    },
    {
      title: 'Easy Withdrawals',
      description: 'Quick and hassle-free withdrawal process',
      icon: 'cash-multiple',
    },
  ];

  const stats = [
    { value: '200+', label: 'Happy Customers' },
    { value: '₹20Cr+', label: 'Funds Managed' },
    { value: '20+', label: 'Years Experience' },
    { value: '99.9%', label: 'Success Rate' },
  ];

  const renderPlanItem = ({ item }) => (
    <View
      style={[
        styles.planCard,
        styles.planCardDynamic,
        { width: CARD_WIDTH },
      ]}>
      {/* Badge */}
      {item.badge && (
        <View style={[styles.badge, { backgroundColor: item.color }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}

      {/* Plan Title */}
      <Text style={styles.planTitle}>{item.name}</Text>

      {/* Amount Section */}
      <View style={styles.amountRow}>
        <Text style={[styles.mainAmount, { color: item.color }]}>
          {item.amount}
        </Text>
        <Text style={styles.totalLabel}>Total Value</Text>
      </View>

      {/* Monthly Info */}
      <Text style={styles.monthlyInfo}>
        {item.monthly} per month for {item.duration}
      </Text>

      {/* Return Info */}
      <View style={styles.returnSection}>
        <Text style={styles.returnLabel}>Expected Return</Text>
        <Text style={styles.returnAmount}>
          {item.return}
        </Text>
      </View>

      {/* Decorative Element */}
      <View
        style={[styles.decorativeCircle, { backgroundColor: item.color + '30' }]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.userName}>Gowtham</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color="#1A2A4E"
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>ஸ்ரீ பெரியநாயகி அம்மன்</Text>
            <Text style={styles.companySubtitle}>CHITFUNDS</Text>
            <Text style={styles.tagline}>Building Dreams Through Trust</Text>
          </View>
        </View>

        {/* Hero Section with Animation */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Grow Your Wealth</Text>
            <Text style={styles.heroSubtitle}>
              Join thousands of satisfied customers in our trusted chit fund
              community
            </Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Start Investing</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.heroAnimation}>
            <LottieView
              source={require('../../../../animation/Finance.json')}
              autoPlay
              loop
              style={styles.lottieHero}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Our Achievement</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- START: UPDATED PLANS SECTION --- */}
        <View style={styles.plansSection}>
          <View style={styles.plansSectionHeader}>
            <Text style={styles.sectionTitle}>Popular Plans</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={infiniteData}
            renderItem={renderPlanItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={[
              styles.plansScrollContent,
              { paddingHorizontal: (width - CARD_WIDTH) / 2 },
            ]}
            snapToAlignment="center"
            onScrollBeginDrag={() => stopAutoScroll()}
            onScrollEndDrag={() => startAutoScroll()}
            onMomentumScrollEnd={handleScrollEnd}
            getItemLayout={getItemLayout}
            initialScrollIndex={initialIndex}
          />
        </View>
        {/* --- END: UPDATED PLANS SECTION --- */}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={32}
                  color="#4CAF50"
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>What Our Customers Say</Text>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds has been my trusted partner for
              over 20 years. Their transparent process and timely payouts make
              them the best choice."
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>    Devaraj P</Text>
                <Text style={styles.authorTitle}>Business Owner</Text>
              </View>
              <View style={styles.ratingStars}>
                {[...Array(5)].map((_, i) => (
                  <MaterialCommunityIcons
                    key={i}
                    name="star"
                    size={16}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:+918610696889')}>
              <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
              <Text style={styles.contactText}>Call Us</Text>
              <Text style={styles.contactValue}>+91 8610696889</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() =>
                Linking.openURL('mailto:Gowthamnaveen124@gmial.com')
              }>
              <MaterialCommunityIcons name="email" size={24} color="#2196F3" />
              <Text style={styles.contactText}>Email Us</Text>
              <Text style={styles.contactValue}>
                Gowthamnaveen124@gmial.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerCopyright}>
            © 2025 ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;