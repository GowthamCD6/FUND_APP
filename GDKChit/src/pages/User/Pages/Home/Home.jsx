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
  const [activeTestimonialSlide, setActiveTestimonialSlide] = useState(0);
  const flatListRef = useRef(null);
  const testimonialListRef = useRef(null);
  const scrollTimer = useRef(null);
  const testimonialTimer = useRef(null);
  const mainScrollRef = useRef(null);
  const plansLayoutY = useRef(0);

  // Scroll to Popular Plans section
  const scrollToPlans = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        y: plansLayoutY.current - 20,
        animated: true,
      });
    }
  };

  const plans = [
    {
      id: 1,
      name: '1 Lakh Plan',
      badge: 'Popular',
      amount: '₹1,00,000',
      monthly: '₹5,000',
      duration: '20 Months',
      return: '₹95,000',
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
      return: '₹1,90,000',
      color: '#E5E4E2',
      gradient: ['#E5E4E2', '#C0C0C0'],
    },
    {
      id: 3,
      name: '3 Lakh Plan',
      badge: 'Trending',
      amount: '₹3,00,000',
      monthly: '₹15,000',
      duration: '20 Months',
      return: '₹2,85,000',
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
      return: '₹4,75,000',
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
      title: 'RBI Registered',
      description:
        'Fully compliant with Reserve Bank of India regulations for chit funds',
      icon: 'shield-check',
    },
    {
      title: 'Transparent Auctions',
      description: 'Live monthly auctions with complete transparency and fair bidding',
      icon: 'gavel',
    },
    {
      title: 'Guaranteed Payouts',
      description: 'On-time prize money disbursement with zero delays',
      icon: 'cash-check',
    },
    {
      title: 'Digital Tracking',
      description: 'Track your investments, payments and returns in real-time',
      icon: 'cellphone-check',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Members', icon: 'account-group' },
    { value: '₹50Cr+', label: 'Funds Managed', icon: 'currency-inr' },
    { value: '25+', label: 'Years Legacy', icon: 'calendar-check' },
    { value: '100%', label: 'Trust Score', icon: 'star-circle' },
  ];

  const testimonials = [
    {
      id: 1,
      text: "Used my chit payout of ₹1.9 lakhs to start a small grocery store in Thirunelveli. The monthly contribution of ₹10,000 was affordable, and I received the amount exactly when I needed it for my business. No bank would give me a loan without collateral, but this chit fund made my dream possible.",
      name: "Murugan K",
      title: "Small Business Owner, Thirunelveli",
    },
    {
      id: 2,
      text: "My daughter's wedding was funded through the 3 Lakh plan. I won the auction in the 8th month and received ₹2.75 lakhs. The remaining EMIs were manageable with my salary. The entire process was transparent - I could see all bidding details in the app itself.",
      name: "Lakshmi Devi S",
      title: "Government School Teacher, Madurai",
    },
    {
      id: 3,
      text: "Being part of this chit fund for 8 years now. What I appreciate most is the personal touch - they call before every due date and the staff knows me by name. Received ₹4.5 lakhs last year which helped me renovate my ancestral home. Will continue for life!",
      name: "Rajesh Babu M",
      title: "Auto Parts Dealer, Tenkasi",
    },
  ];

  // Create infinite loop data for testimonials
  const infiniteTestimonials = [...testimonials, ...testimonials, ...testimonials];
  const initialTestimonialIndex = testimonials.length; // Start from middle set

  // Testimonial slider configuration
  const TESTIMONIAL_CARD_WIDTH = width * 0.88;
  const TESTIMONIAL_SPACING = 12;
  const TESTIMONIAL_SNAP_INTERVAL = TESTIMONIAL_CARD_WIDTH + TESTIMONIAL_SPACING;

  // Initialize testimonial scroll position to middle set
  useEffect(() => {
    if (testimonialListRef.current) {
      setTimeout(() => {
        testimonialListRef.current.scrollToIndex({
          index: initialTestimonialIndex,
          animated: false,
        });
      }, 150);
    }
  }, []);

  // Auto scroll for testimonials - infinite loop
  const startTestimonialAutoScroll = useCallback(() => {
    stopTestimonialAutoScroll();
    testimonialTimer.current = setInterval(() => {
      if (testimonialListRef.current) {
        setActiveTestimonialSlide((prev) => {
          const nextIndex = prev + 1;
          testimonialListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 4000);
  }, []);

  const stopTestimonialAutoScroll = () => {
    if (testimonialTimer.current) {
      clearInterval(testimonialTimer.current);
      testimonialTimer.current = null;
    }
  };

  // Reset to middle when reaching edges (seamless loop for testimonials)
  const handleTestimonialScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / TESTIMONIAL_SNAP_INTERVAL);
    
    // If we've scrolled past the middle set, reset to middle
    if (currentIndex >= testimonials.length * 2) {
      testimonialListRef.current.scrollToIndex({
        index: currentIndex - testimonials.length,
        animated: false,
      });
      setActiveTestimonialSlide(currentIndex - testimonials.length);
    } else if (currentIndex < testimonials.length) {
      testimonialListRef.current.scrollToIndex({
        index: currentIndex + testimonials.length,
        animated: false,
      });
      setActiveTestimonialSlide(currentIndex + testimonials.length);
    } else {
      setActiveTestimonialSlide(currentIndex);
    }
  };

  const getTestimonialItemLayout = (data, index) => ({
    length: TESTIMONIAL_SNAP_INTERVAL,
    offset: TESTIMONIAL_SNAP_INTERVAL * index,
    index,
  });

  // Start testimonial auto scroll
  useEffect(() => {
    setActiveTestimonialSlide(initialTestimonialIndex);
    startTestimonialAutoScroll();
    return () => stopTestimonialAutoScroll();
  }, [startTestimonialAutoScroll]);

  const renderTestimonialItem = ({ item }) => (
    <View style={[styles.testimonialCard, { width: TESTIMONIAL_CARD_WIDTH, marginRight: TESTIMONIAL_SPACING }]}>
      <MaterialCommunityIcons name="format-quote-open" size={24} color="#6B46C1" style={{ opacity: 0.3, marginBottom: 8 }} />
      <Text style={styles.testimonialText}>{item.text}</Text>
      <View style={styles.testimonialAuthor}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.name}</Text>
          <Text style={styles.authorTitle}>{item.title}</Text>
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
  );

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
          <Text style={styles.planBadgeText}>{item.badge}</Text>
        </View>
      )}

      {/* Decorative Elements */}
      <View
        style={[styles.decorativeCircle, { backgroundColor: item.color }]}
      />
      <View
        style={[styles.decorativeCircleSmall, { backgroundColor: item.color }]}
      />

      {/* Top Content */}
      <View>
        {/* Plan Title */}
        <Text style={styles.planTitle}>{item.name}</Text>

        {/* Amount Section */}
        <View style={styles.amountRow}>
          <Text style={[styles.mainAmount, { color: item.color === '#E5E4E2' ? '#9CA3AF' : item.color }]}>
            {item.amount}
          </Text>
          <Text style={styles.totalLabel}>Total Value</Text>
        </View>

        {/* Monthly Info */}
        <Text style={styles.monthlyInfo}>
          {item.monthly} per month for {item.duration}
        </Text>
      </View>

      {/* Return Info - Bottom Footer */}
      <View style={styles.returnSection}>
        <Text style={styles.returnLabel}>Expected Return</Text>
        <Text style={styles.returnAmount}>
          {item.return}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={mainScrollRef}
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
            <Text style={styles.tagline}>Trusted Since 1999</Text>
          </View>
        </View>

        {/* Hero Section - Premium UI */}
        <View style={styles.heroSection}>
          {/* Decorative Background Elements */}
          <View style={styles.heroDecoCircle1} />
          <View style={styles.heroDecoCircle2} />
          
          {/* Top Content */}
          <View style={styles.heroTopContent}>
            <Text style={styles.heroTitle}>Grow Your Savings</Text>
            <Text style={styles.heroSubtitle}>
              Join 500+ families in our trusted chit fund community
            </Text>
            
            {/* Feature Pills */}
            <View style={styles.heroFeaturePills}>
              <View style={styles.heroFeaturePill}>
                <MaterialCommunityIcons name="percent" size={12} color="#6B46C1" />
                <Text style={styles.heroFeaturePillText}>Up to 95% Returns</Text>
              </View>
              <View style={styles.heroFeaturePill}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#10B981" />
                <Text style={styles.heroFeaturePillText}>RBI Registered</Text>
              </View>
            </View>
          </View>

          {/* Animation Above Button */}
          <View style={styles.heroAnimation}>
            <LottieView
              source={require('../../../../animation/Finance.json')}
              autoPlay
              loop
              style={styles.lottieHero}
            />
          </View>

          {/* Bottom Content */}
          <View style={styles.heroBottomContent}>
            {/* CTA Button */}
            <TouchableOpacity style={styles.heroButton} activeOpacity={0.85} onPress={scrollToPlans}>
              <Text style={styles.heroButtonText}>Explore Plans</Text>
              <View style={styles.heroButtonIcon}>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

         
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Our Achievements</Text>
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
        <View 
          style={styles.plansSection}
          onLayout={(event) => {
            plansLayoutY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.plansSectionHeader}>
            <Text style={styles.plansSectionTitle}>Popular Plans</Text>
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

        {/* Features Section - Professional Mobile UI */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Why Choose Us?</Text>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View 
                key={index} 
                style={[
                  styles.featureItem,
                  index !== features.length - 1 && styles.featureItemBorder
                ]}
              >
                <View style={styles.featureIconWrapper}>
                  <MaterialCommunityIcons
                    name={feature.icon}
                    size={22}
                    color="#6B46C1"
                  />
                </View>
                <View style={styles.featureTextContent}>
                  <Text style={styles.featureItemTitle}>{feature.title}</Text>
                  <Text style={styles.featureItemDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials Slider */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>Member Testimonials</Text>
          
          <FlatList
            ref={testimonialListRef}
            data={infiniteTestimonials}
            renderItem={renderTestimonialItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TESTIMONIAL_SNAP_INTERVAL}
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={{ paddingHorizontal: (width - TESTIMONIAL_CARD_WIDTH) / 2 }}
            snapToAlignment="center"
            onScrollBeginDrag={() => stopTestimonialAutoScroll()}
            onScrollEndDrag={() => startTestimonialAutoScroll()}
            onMomentumScrollEnd={handleTestimonialScrollEnd}
            getItemLayout={getTestimonialItemLayout}
            initialScrollIndex={initialTestimonialIndex}
          />

          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {testimonials.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  (activeTestimonialSlide % testimonials.length) === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Need Assistance?</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:+918610696889')}>
              <MaterialCommunityIcons name="phone" size={24} color="#6B46C1" />
              <Text style={styles.contactText}>Call Us</Text>
              <Text style={styles.contactValue}>+91 86106 96889</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('https://wa.me/918610696889')}>
              <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
              <Text style={styles.contactText}>WhatsApp</Text>
              <Text style={styles.contactValue}>Chat with us</Text>
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