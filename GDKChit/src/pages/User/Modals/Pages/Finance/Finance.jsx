import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';
import { styles } from './FinanceStyle';

const { width } = Dimensions.get('window');

const Finance = ({ selectedGroup, onBack }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleApplyLoan = () => {
    Alert.alert('Loan Application', 'Redirecting to application form...');
  };

  const handleTalkToExpert = () => {
    Alert.alert('Expert Support', 'Connecting you with our finance expert...');
  };

  const handleScroll = (event) => {
    scrollAnim.setValue(event.nativeEvent.contentOffset.y);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroScale, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(heroScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [heroScale]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Finance" onBack={onBack} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ===== HERO SECTION WITH GRADIENT ===== */}
        <Animated.View 
          style={[
            styles.heroSection,
            { transform: [{ scale: heroScale }] }
          ]}
        >
          <View style={styles.heroBackground}>
            <View style={styles.heroBgGradient1} />
            <View style={styles.heroBgGradient2} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTagContainer}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FBBF24" />
              <Text style={styles.heroTagText}>LIMITED TIME OFFER</Text>
            </View>
            
            <Text style={styles.heroTitle}>Grow Your Dreams</Text>
            <Text style={styles.heroSubtitle}>With Smart Finance</Text>
            
            <Text style={styles.heroDesc}>Quick loans. Trusted by 8,500+ customers. No paperwork nightmare.</Text>

            {/* Animated Stats */}
            <View style={styles.statsContainer}>
              <StatItem value="8.5%" label="From" />
              <View style={styles.statDivider} />
              <StatItem value="48h" label="Approval" />
              <View style={styles.statDivider} />
              <StatItem value="₹50L" label="Max Loan" />
            </View>

            {/* Primary CTA Button */}
            <TouchableOpacity 
              style={styles.ctaButton} 
              onPress={handleApplyLoan}
              activeOpacity={0.8}
            >
              <LinearGradientView colors={['#8B5CF6', '#7C3AED']}>
                <View style={styles.ctaButtonContent}>
                  <MaterialCommunityIcons name="rocket-launch" size={18} color="#FFFFFF" />
                  <Text style={styles.ctaButtonText}>Check My Eligibility</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
                </View>
              </LinearGradientView>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ===== COLLECTION FREQUENCY INFO - FEATURED ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collection Schedule</Text>
            <View style={styles.badgeNew}>
              <Text style={styles.badgeText}>IMPORTANT</Text>
            </View>
          </View>
          
          <View style={styles.collectionInfoContainer}>
            <CollectionInfoCard
              icon="briefcase"
              title="For Shopkeepers"
              frequency="Daily Collection"
              desc="Amounts are collected every day for shopkeeper members"
              color="#10B981"
              bgColor="#ECFDF5"
              borderColor="#6EE7B7"
              iconBg="#D1FAE5"
            />
            <CollectionInfoCard
              icon="account"
              title="For Personal Users"
              frequency="Weekly Collection"
              desc="Amounts are collected once a week for personal users"
              color="#3B82F6"
              bgColor="#EFF6FF"
              borderColor="#93C5FD"
              iconBg="#DBEAFE"
            />
          </View>
        </View>

        {/* ===== HIGHLIGHTED BENEFITS ===== */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { marginLeft: 16 }]}>Why GDK Finance?</Text>
          <View style={styles.benefitsGrid}>
            <BenefitCard
              icon="lightning-bolt"
              title="Fast Approval"
              desc="Get approved in hours"
              color="#F59E0B"
            />
            <BenefitCard
              icon="shield-check"
              title="100% Safe"
              desc="RBI Licensed"
              color="#10B981"
            />
            <BenefitCard
              icon="file-document"
              title="Zero Paperwork"
              desc="Fully Digital"
              color="#8B5CF6"
            />
            <BenefitCard
              icon="headset"
              title="24/7 Support"
              desc="Always Available"
              color="#EC4899"
            />
          </View>
        </View>

        {/* ===== LOAN PRODUCTS - ENHANCED ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan Products</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAll}>SEE ALL</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            <LoanProductCard
              icon="cash"
              title="Personal"
              rate="10.5%"
              label="p.a."
              color="#8B5CF6"
              onPress={handleApplyLoan}
              badge="Popular"
            />
            <LoanProductCard
              icon="briefcase"
              title="Business"
              rate="12%"
              label="p.a."
              color="#EC4899"
              onPress={handleApplyLoan}
            />
          </View>

          <View style={styles.productsGrid}>
            <LoanProductCard
              icon="gem"
              title="Gold"
              rate="8.5%"
              label="LOW RATE"
              color="#F59E0B"
              onPress={handleApplyLoan}
              badge="Best Rate"
            />
            <LoanProductCard
              icon="school"
              title="Student"
              rate="9%"
              label="p.a."
              color="#06B6D4"
              onPress={handleApplyLoan}
            />
          </View>
        </View>

        {/* ===== PREMIUM BANNER ===== */}
        <View style={styles.bannerSection}>
          <View style={styles.premiumBanner}>
            <View style={styles.bannerGlow} />
            <View style={styles.bannerContent}>
              <View style={styles.bannerIconContainer}>
                <MaterialCommunityIcons name="gift" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTag}>EXCLUSIVE FOR YOU</Text>
                <Text style={styles.bannerDesc}>₹500 Cashback on First Loan</Text>
                <Text style={styles.bannerSmall}>Valid till June 30</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* ===== QUICK ANSWERS (FAQ) ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Questions</Text>
          <Text style={styles.faqSubtitle}>Find answers to your queries</Text>

          <FAQItem
            question="Who is eligible to apply?"
            answer="Indian citizens aged 21-60 with a stable income. Both salaried and self-employed applicants are welcome."
            index={0}
            expanded={expandedFAQ === 0}
            onToggle={() => toggleFAQ(0)}
          />
          <FAQItem
            question="What documents do I need?"
            answer="Basic documents include ID proof, address proof, income proof (salary slips or ITR), bank statements, and any other relevant documents."
            index={1}
            expanded={expandedFAQ === 1}
            onToggle={() => toggleFAQ(1)}
          />
          <FAQItem
            question="How fast is the approval?"
            answer="Our fast-track process approves most loans within 24-48 hours. Some cases may take up to 3 business days."
            index={2}
            expanded={expandedFAQ === 2}
            onToggle={() => toggleFAQ(2)}
          />
          <FAQItem
            question="Any prepayment penalty?"
            answer="Zero prepayment penalty! Repay anytime without any extra charges or penalties."
            index={3}
            expanded={expandedFAQ === 3}
            onToggle={() => toggleFAQ(3)}
          />
        </View>

        {/* ===== FINAL CTA SECTION ===== */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaGradient}>
              <MaterialCommunityIcons name="rocket" size={56} color="#FFFFFF" />
              <Text style={styles.ctaCardTitle}>Ready to Get Started?</Text>
              <Text style={styles.ctaCardDesc}>Apply in just 5 minutes. No stress, no hassle.</Text>

              <TouchableOpacity style={styles.applyButton} onPress={handleApplyLoan}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Apply for a Loan Now</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.expertButton} onPress={handleTalkToExpert}>
                <MaterialCommunityIcons name="phone-in-talk" size={18} color="#7C3AED" />
                <Text style={styles.expertButtonText}>Talk to an Expert</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>* Subject to eligibility, T&C apply.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ===== SUB COMPONENTS =====

const StatItem = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BenefitCard = ({ icon, title, desc, color }) => (
  <View style={styles.benefitCard}>
    <View style={[styles.benefitIcon, { backgroundColor: `${color}20` }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.benefitTitle}>{title}</Text>
    <Text style={styles.benefitDesc}>{desc}</Text>
  </View>
);

const LoanProductCard = ({ icon, title, rate, label, color, onPress, badge }) => (
  <TouchableOpacity 
    style={styles.loanCard} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {badge && (
      <View style={[styles.loanBadge, { backgroundColor: color }]}>
        <Text style={styles.loanBadgeText}>{badge}</Text>
      </View>
    )}
    <View style={[styles.loanIcon, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
    </View>
    <Text style={styles.loanTitle}>{title}</Text>
    <View style={styles.rateContainer}>
      <Text style={[styles.rateValue, { color }]}>{rate}</Text>
      <Text style={styles.rateLabel}>{label}</Text>
    </View>
    <TouchableOpacity style={[styles.loanApplyBtn, { backgroundColor: color }]}>
      <Text style={styles.loanApplyText}>Apply</Text>
      <MaterialCommunityIcons name="arrow-right" size={12} color="#FFFFFF" />
    </TouchableOpacity>
  </TouchableOpacity>
);

const CollectionInfoCard = ({ icon, title, frequency, desc, color, bgColor, borderColor, iconBg }) => (
  <View style={[styles.collectionCard, { backgroundColor: bgColor, borderColor }]}>
    <View style={[styles.collectionIconContainer, { backgroundColor: iconBg }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <View style={styles.collectionContent}>
      <Text style={styles.collectionTitle}>{title}</Text>
      <Text style={[styles.collectionFrequency, { color }]}>{frequency}</Text>
      <Text style={styles.collectionDesc}>{desc}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color={color} />
  </View>
);

const FAQItem = ({ question, answer, index, expanded, onToggle }) => (
  <TouchableOpacity 
    style={[styles.faqItem, expanded && styles.faqItemExpanded]}
    onPress={onToggle}
    activeOpacity={0.6}
  >
    <View style={styles.faqHeader}>
      <View style={styles.faqIconContainer}>
        <MaterialCommunityIcons name="help-circle" size={18} color="#7C3AED" />
      </View>
      <Text style={styles.faqQuestion}>{question}</Text>
      <MaterialCommunityIcons 
        name={expanded ? "chevron-up" : "chevron-down"} 
        size={22} 
        color="#7C3AED" 
      />
    </View>
    {expanded && (
      <Text style={styles.faqAnswer}>{answer}</Text>
    )}
  </TouchableOpacity>
);

// Placeholder for Linear Gradient (since LinearGradient might not be installed)
const LinearGradientView = ({ colors, children }) => (
  <View style={{ backgroundColor: colors[1] }}>
    {children}
  </View>
);

export default Finance;
