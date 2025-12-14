import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../../../../components/HeaderComponent/Header';

const ChitPlans = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Handle back button with proper feedback
  const handleBack = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const plans = [
    {
      id: 1,
      name: '1 Lakh Plan',
      amount: '₹1,00,000',
      monthly: '₹5,000',
      duration: '20 Months',
      members: '20',
      description: 'Perfect for first-time investors and small businesses',
    },
    {
      id: 2,
      name: '2 Lakh Plan',
      amount: '₹2,00,000',
      monthly: '₹10,000',
      duration: '20 Months',
      members: '20',
      description: 'Ideal for medium-term savings and expansion needs',
    },
    {
      id: 3,
      name: '3 Lakh Plan',
      amount: '₹3,00,000',
      monthly: '₹15,000',
      duration: '20 Months',
      members: '20',
      description: 'Great for substantial investments and long-term goals',
    },
    {
      id: 4,
      name: '5 Lakh Plan',
      amount: '₹5,00,000',
      monthly: '₹25,000',
      duration: '20 Months',
      members: '20',
      description: 'Premium option for maximum returns and large projects',
    },
  ];

  const benefits = [
    {
      icon: 'shield-check',
      title: 'Safe & Regulated',
      description: 'Transparent process with proper documentation',
    },
    {
      icon: 'trending-up',
      title: 'Higher Returns',
      description: 'Earn more compared to traditional savings',
    },
    {
      icon: 'account-multiple',
      title: 'Community Trust',
      description: 'Build strong relationships while investing',
    },
    {
      icon: 'clock-fast',
      title: 'Quick Access',
      description: 'Get your winnings quickly after successful bid',
    },
  ];

  const faqs = [
    {
      id: 1,
      question: 'What is a Chit Fund?',
      answer:
        'A chit fund is a traditional savings method where a group contributes equal amounts monthly. Each month, the total is awarded to one member through auction.',
    },
    {
      id: 2,
      question: 'How does the auction work?',
      answer:
        'Every month, members bid for the chit amount. The lowest bidder wins and receives the amount minus their discount. The discount is distributed to other members.',
    },
    {
      id: 3,
      question: 'Is my money safe?',
      answer:
        'Yes, completely safe. All chit funds are regulated by the Chit Funds Act. Your contributions are documented and legally protected.',
    },
    {
      id: 4,
      question: 'What if I miss a payment?',
      answer:
        "Missing contributions affects your eligibility for that month's bid. Contact our team to discuss payment options and grace periods.",
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Select Your Plan',
      description: 'Choose a plan matching your financial capacity',
    },
    {
      number: '2',
      title: 'Join the Group',
      description: 'Complete registration and provide documentation',
    },
    {
      number: '3',
      title: 'Monthly Payments',
      description: 'Contribute your fixed amount every month',
    },
    {
      number: '4',
      title: 'Participate in Auction',
      description: 'Bid for the chit amount each month',
    },
  ];

  const FAQItem = ({ faq }) => (
    <TouchableOpacity
      style={styles.faqCard}
      onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <MaterialCommunityIcons
          name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#6B46C1"
        />
      </View>
      {expandedFAQ === faq.id && (
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Top Spacing */}
      <View style={styles.topSpacing} />

      {/* Header */}
      <Header
        title="Chit Plans Info"
        onBack={handleBack}
        showBackButton={true}
        backIconFill="#6B46C1"
        titleStyle={styles.headerTitle}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={48}
            color="#6B46C1"
          />
          <Text style={styles.heroTitle}>What is a Chit Fund?</Text>
          <Text style={styles.heroDescription}>
            A traditional yet modern approach to savings and investment. Join a
            community and achieve your financial goals together.
          </Text>
        </View>

        {/* Plans Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Plans</Text>
          <Text style={styles.sectionDescription}>
            Choose a plan that fits your financial goals
          </Text>

          {plans.map(plan => (
            <View key={plan.id} style={styles.planInfoCard}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              <View style={styles.planGrid}>
                <View style={styles.planGridItem}>
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={20}
                    color="#6B46C1"
                  />
                  <Text style={styles.planGridLabel}>Total</Text>
                  <Text style={styles.planGridValue}>{plan.amount}</Text>
                </View>
                <View style={styles.planGridItem}>
                  <MaterialCommunityIcons
                    name="calendar-month"
                    size={20}
                    color="#6B46C1"
                  />
                  <Text style={styles.planGridLabel}>Monthly</Text>
                  <Text style={styles.planGridValue}>{plan.monthly}</Text>
                </View>
                <View style={styles.planGridItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color="#6B46C1"
                  />
                  <Text style={styles.planGridLabel}>Duration</Text>
                  <Text style={styles.planGridValue}>{plan.duration}</Text>
                </View>
                <View style={styles.planGridItem}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={20}
                    color="#6B46C1"
                  />
                  <Text style={styles.planGridLabel}>Members</Text>
                  <Text style={styles.planGridValue}>{plan.members}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionDescription}>
            Simple steps to grow your wealth
          </Text>

          {steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={[styles.section, styles.benefitsSection]}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>

          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIconContainer}>
                  <MaterialCommunityIcons
                    name={benefit.icon}
                    size={28}
                    color="#6B46C1"
                  />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Information</Text>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color="#6B46C1"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Transparent Process</Text>
              <Text style={styles.infoText}>
                All transactions documented. Track history anytime.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="security" size={24} color="#6B46C1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Legally Regulated</Text>
              <Text style={styles.infoText}>
                Complies with Chit Funds Act and all regulations.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="handshake"
              size={24}
              color="#6B46C1"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Community Support</Text>
              <Text style={styles.infoText}>
                Join supportive community for mutual growth.
              </Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQ</Text>

          {faqs.map(faq => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Start?</Text>
          <Text style={styles.ctaDescription}>
            Join thousands building wealth through our trusted chit fund
            community.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started Now</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All chit funds are subject to applicable regulations and terms &
            conditions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  topSpacing: { height: 19 },
  heroSection: {
    backgroundColor: '#6B46C1',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 15,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: { paddingHorizontal: 20, paddingVertical: 28 },
  benefitsSection: { backgroundColor: '#F0F4FF' },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  planInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#6B46C1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  planDescription: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  planGridItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 12,
  },
  planGridLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  planGridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  stepNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  stepContent: { flex: 1 },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  benefitsGrid: { gap: 16 },
  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  benefitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoContent: { flex: 1, marginLeft: 16 },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6B46C1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: { fontSize: 13, color: '#6B7280', marginTop: 12, lineHeight: 20 },
  ctaSection: {
    backgroundColor: '#6B46C1',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaButtonText: { fontSize: 16, fontWeight: '700', color: '#6B46C1' },
  footer: { paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});

export default ChitPlans;