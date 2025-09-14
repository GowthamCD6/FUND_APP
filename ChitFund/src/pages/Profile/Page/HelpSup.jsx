import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';

const HelpSupport = ({ onBack }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: "How do I register in the GDK Chit Fund app?",
      questionTamil: "ஜிடிகே சிட் நிதி பயன்பாட்டில் எவ்வாறு பதிவு செய்வது?",
      answer: "Download the app from Play Store, enter your mobile number, verify OTP, complete your profile with personal details, and upload required documents for verification. Once approved, you can start participating in chit funds.",
      answerTamil: "பிளே ஸ்டோரிலிருந்து பயன்பாட்டைப் பதிவிறக்கவும், உங்கள் கைபேசி எண்ணை உள்ளிடவும், ஓடிபியை சரிபார்க்கவும், தனிப்பட்ட விவரங்களுடன் உங்கள் சுயவிவரத்தை முடிக்கவும்."
    },
    {
      id: 2,
      question: "How do I join a chit fund group?",
      questionTamil: "சிட் நிதி குழுவில் எவ்வாறு சேர்வது?",
      answer: "Browse available chit groups in the app, select based on amount and duration, pay the registration fee, and wait for group formation. You'll receive notifications about auction dates and payment schedules.",
      answerTamil: "பயன்பாட்டில் கிடைக்கும் சிட் குழுக்களை உலாவுங்கள், தொகை மற்றும் கால அளவின் அடிப்படையில் தேர்ந்தெடுக்கவும், பதிவு கட்டணம் செலுத்துங்கள்."
    },
    {
      id: 3,
      question: "How can I make payments through the app?",
      questionTamil: "பயன்பாட்டின் மூலம் எவ்வாறு பணம் செலுத்த முடியும்?",
      answer: "You can make payments using UPI, Net Banking, Debit/Credit cards, or bank transfer. Go to 'Payments' section, select your chit group, enter amount, and choose payment method. Payment history is available in your account.",
      answerTamil: "யூபிஐ, நெட் பேங்கிங், டெபிட்/கிரெடிட் கார்டுகள் அல்லது வங்கி பரிமாற்றம் மூலம் பணம் செலுத்தலாம்."
    },
    {
      id: 4,
      question: "How does the bidding process work?",
      questionTamil: "ஏல செயல்முறை எவ்வாறு செயல்படுகிறது?",
      answer: "Monthly auctions are conducted online through the app. Members can place bids, and the lowest bidder wins the chit amount. The app will notify you about auction timings and results automatically.",
      answerTamil: "மாதாந்திர ஏலங்கள் பயன்பாட்டின் மூலம் ஆன்லைனில் நடத்தப்படுகின்றன. உறுப்பினர்கள் ஏலம் விடலாம், குறைந்த ஏலதாரர் சிட் தொகையை வெல்வார்."
    },
    {
      id: 5,
      question: "Can I track my chit fund status in the app?",
      questionTamil: "பயன்பாட்டில் எனது சிட் நிதி நிலையைக் கண்காணிக்க முடியுமா?",
      answer: "Yes! The app provides complete tracking - view payment history, upcoming payments, auction results, dividend details, and group status. You'll also receive push notifications for important updates.",
      answerTamil: "ஆம்! பயன்பாடு முழுமையான கண்காணிப்பை வழங்குகிறது - பணம் செலுத்தும் வரலாறு, வரவிருக்கும் பணம் செலுத்துதல்கள், ஏல முடிவுகள் மற்றும் குழு நிலையைப் பார்க்கவும்."
    },
    {
      id: 6,
      question: "What if I miss a monthly payment?",
      questionTamil: "மாதாந்திர பணம் செலுத்த தவறினால் என்ன நடக்கும்?",
      answer: "The app will send reminder notifications before due dates. Late payments may incur penalty charges. Contact support through the app's chat feature if you face payment difficulties - we can discuss flexible options.",
      answerTamil: "பயன்பாடு காலாவधிக்கு முன் நினைவூட்டல் அறிவிப்புகளை அனுப்பும். தாமதமான பணம் செலுத்துதல் அபராத கட்டணங்களை ஏற்படுத்தலாம்."
    },
    {
      id: 7,
      question: "How can I refer friends and earn rewards?",
      questionTamil: "நண்பர்களை எவ்வாறு பரிந்துரைத்து வெகுமதிகளைப் பெறுவது?",
      answer: "Use the 'Refer & Earn' feature in the app to share your referral code. When your referred friends join and complete their first payment, both you and your friend will receive rewards as per current offer.",
      answerTamil: "உங்கள் பரிந்துரைக் குறியீட்டைப் பகிர பயன்பாட்டில் 'பரிந்துரைத்து சம்பாதிக்கவும்' அம்சத்தைப் பயன்படுத்துங்கள்."
    },
    {
      id: 8,
      question: "Is my money and data safe in this app?",
      questionTamil: "இந்த பயன்பாட்டில் எனது பணம் மற்றும் தரவு பாதுகாப்பானதா?",
      answer: "Yes, we use bank-level security with 256-bit SSL encryption. Your data is protected and payments are processed through secure gateways. We're registered with financial authorities and follow strict compliance standards.",
      answerTamil: "ஆம், நாங்கள் 256-பிட் எஸ்எஸ்எல் குறியாக்கத்துடன் வங்கி அளவிலான பாதுகாப்பைப் பயன்படுத்துகிறோம். உங்கள் தரவு பாதுகாக்கப்பட்டுள்ளது."
    }
  ];



  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Help & Support</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section with Gradient Background */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <LottieView
                source={require('../../../animation/Customer_care.json')}
                autoPlay
                loop
                style={styles.heroAnimation}
                speed={1}
              />
            </View>
            <Text style={styles.heroTitle}>We're Here to Help!</Text>
            <Text style={styles.heroSubtitle}>உதவிக்கு நாங்கள் இருக்கிறோம்!</Text>
          </View>
          <View style={styles.heroWave}>
            {/* Wave decoration */}
            <View style={styles.wave1} />
            <View style={styles.wave2} />
            <View style={styles.wave3} />
          </View>
        </View>



        {/* FAQ Section with Modern Design */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <View style={styles.faqHeaderContent}>
              <MaterialCommunityIcons 
                name="help-circle-outline" 
                size={32} 
                color="#1F2937" 
                style={styles.faqHeaderIcon}
              />
              <Text style={styles.faqHeaderTitle}>FAQ</Text>
            </View>
          </View>

          <View style={styles.faqList}>
            {faqData.map((faq, index) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity 
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestionWrapper}>
                    <Text style={styles.faqQuestionTitle}>{faq.question}</Text>
                    <MaterialCommunityIcons 
                      name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#666666" 
                    />
                  </View>
                </TouchableOpacity>
                
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    <Text style={styles.faqAnswerTextTamil}>{faq.answerTamil}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Operating Hours with Timeline Design */}
        <View style={styles.operatingSection}>
          <View style={styles.operatingHeader}>
            <View style={styles.clockIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.operatingTitle}>Operating Hours</Text>
            <Text style={styles.operatingTitleTamil}>செயல்பாட்டு நேரம்</Text>
          </View>
          
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.dayRow}>
                  <Text style={styles.dayText}>Monday - Friday</Text>
                  <Text style={styles.timeText}>9:00 AM - 6:00 PM</Text>
                </View>
                <Text style={styles.dayTextTamil}>திங்கள் - வெள்ளி • காலை 9:00 - மாலை 6:00</Text>
              </View>
            </View>
            
            <View style={styles.timelineLine} />
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.dayRow}>
                  <Text style={styles.dayText}>Saturday</Text>
                  <Text style={styles.timeText}>9:00 AM - 1:00 PM</Text>
                </View>
                <Text style={styles.dayTextTamil}>சனிக்கிழமை • காலை 9:00 - மதியம் 1:00</Text>
              </View>
            </View>
            
            <View style={styles.timelineLine} />
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotClosed]} />
              <View style={styles.timelineContent}>
                <View style={styles.dayRow}>
                  <Text style={styles.dayText}>Sunday</Text>
                  <Text style={[styles.timeText, styles.closedText]}>Closed</Text>
                </View>
                <Text style={styles.dayTextTamil}>ஞாயிற்றுக்கிழமை • மூடப்பட்டுள்ளது</Text>
              </View>
            </View>
          </View>
        </View>



        {/* Dark Theme Contact Section */}
        <View style={styles.contactSection}>
          {/* Creative Header with Large Animation */}
          <View style={styles.contactHeader}>
            <View style={styles.contactTextSection}>
              <Text style={styles.contactMainTitle}>Get in Touch</Text>
              <Text style={styles.contactMainSubtitle}>Connect with us anytime</Text>
              <View style={styles.titleUnderline} />
            </View>
            <View style={styles.contactAnimationContainer}>
              <LottieView
                source={require('../../../animation/contact_us.json')}
                autoPlay
                loop
                style={styles.contactAnimation}
                speed={1}
              />
            </View>
          </View>

          {/* Contact Methods */}
          <View style={styles.contactMethodsContainer}>
            {/* Phone */}
            <TouchableOpacity 
              style={styles.uniqueContactCard}
              onPress={() => Linking.openURL('tel:+914433445566')}
              activeOpacity={0.8}
            >
              <View style={styles.contactCardContent}>
                <View style={[styles.uniqueIconContainer, styles.phoneGradient]}>
                  <MaterialCommunityIcons name="phone" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.contactCardText}>
                  <Text style={styles.contactCardTitle}>Phone</Text>
                  <Text style={styles.contactCardValue}>+91 44 3344 5566</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity 
              style={styles.uniqueContactCard}
              onPress={() => Linking.openURL('whatsapp://send?phone=919876543210&text=Hello, I need help with GDK Chit Fund')}
              activeOpacity={0.8}
            >
              <View style={styles.contactCardContent}>
                <View style={[styles.uniqueIconContainer, styles.whatsappGradient]}>
                  <MaterialCommunityIcons name="whatsapp" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.contactCardText}>
                  <Text style={styles.contactCardTitle}>WhatsApp</Text>
                  <Text style={styles.contactCardValue}>+91 98765 43210</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Map Location */}
            <TouchableOpacity 
              style={styles.uniqueContactCard}
              activeOpacity={0.8}
            >
              <View style={styles.contactCardContent}>
                <View style={[styles.uniqueIconContainer, styles.mapGradient]}>
                  <MaterialCommunityIcons name="map-marker" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.contactCardText}>
                  <Text style={styles.contactCardTitle}>Map Location</Text>
                  <Text style={styles.contactCardValue}>View on Google Maps</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Address */}
            <View style={styles.uniqueContactCard}>
              <View style={styles.contactCardContent}>
                <View style={[styles.uniqueIconContainer, styles.addressGradient]}>
                  <MaterialCommunityIcons name="office-building" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.contactCardText}>
                  <Text style={styles.contactCardTitle}>Address</Text>
                  <Text style={styles.contactAddressText}>
                    GDK Chit Fund Pvt Ltd{'\n'}
                    No. 123, Anna Salai{'\n'}
                    Chennai - 600002, Tamil Nadu, India
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Social Media */}
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>Connect With Us</Text>
            <View style={styles.socialIconsContainer}>
              <TouchableOpacity style={styles.socialIcon}>
                <MaterialCommunityIcons name="instagram" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <MaterialCommunityIcons name="youtube" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <MaterialCommunityIcons name="linkedin" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <MaterialCommunityIcons name="twitter" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.contactFooter}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>
              Copyright © 2025 GDK Chit Fund Private Limited.
            </Text>
            <Text style={styles.footerText}>All rights reserved</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            GDK Chit Fund - Trusted Financial Solutions
          </Text>
          <Text style={styles.footerTextTamil}>
            ஜிடிகே சிட் நிதி - நம்பகமான நிதி தீர்வுகள்
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#6B46C1',
    paddingBottom: 20,
    paddingTop: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Hero Section Styles
  heroSection: {
    backgroundColor: '#6B46C1',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    zIndex: 2,
  },
  heroIconContainer: {
    width: 165,
    height: 165,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroAnimation: {
    width: 140,
    height: 140,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  heroSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  heroWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  wave1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  wave2: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  wave3: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // Section Styles
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },



  // FAQ Section Styles
  faqSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  faqHeader: {
    marginBottom: 5,
    paddingLeft: 16,
  },
  faqHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqHeaderIcon: {
    marginRight: 12,
    marginTop: 20,
  },
  faqHeaderTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  faqList: {
    paddingHorizontal: 5,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    marginHorizontal: 0,
  },
  faqQuestion: {
    paddingVertical: 24,
  },
  faqQuestionWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
    maxWidth: 330,
    flex: 1,
    paddingRight: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  faqAnswer: {
    paddingBottom: 24,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  faqAnswerText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 26,
    marginBottom: 14,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  faqAnswerTextTamil: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },

  // Operating Hours Timeline Styles
  operatingSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  operatingHeader: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  clockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  operatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  operatingTitleTamil: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 16,
    marginTop: 6,
  },
  timelineDotClosed: {
    backgroundColor: '#EF4444',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 8,
  },
  timelineContent: {
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  timeText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  closedText: {
    color: '#EF4444',
  },
  dayTextTamil: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },

  // Dark Theme Contact Section Styles
  contactSection: {
    marginTop: 40,
    backgroundColor: '#0D1A2B',
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 30,
    paddingHorizontal: 0,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 40,
    paddingTop: 10,
  },
  contactTextSection: {
    flex: 1,
    paddingRight: 20,
    paddingTop: 20,
  },
  contactMainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 1,
    lineHeight: 38,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  contactMainSubtitle: {
    fontSize: 18,
    color: '#B0B0B0',
    marginBottom: 15,
    lineHeight: 24,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  titleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: '#6B46C1',
    borderRadius: 2,
  },
  contactAnimationContainer: {
    width: 240,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
    marginRight: -15,
  },
  contactAnimation: {
    width: '100%',
    height: '100%',
  },
  contactMethodsContainer: {
    paddingHorizontal: 20,
    marginBottom: 35,
  },
  uniqueContactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6B46C1',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uniqueIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    elevation: 2,
  },
  phoneGradient: {
    backgroundColor: '#6B46C1',
  },
  whatsappGradient: {
    backgroundColor: '#25D366',
  },
  mapGradient: {
    backgroundColor: '#FF6B35',
  },
  addressGradient: {
    backgroundColor: '#8B5CF6',
  },
  contactCardText: {
    flex: 1,
  },
  contactCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  contactCardValue: {
    fontSize: 16,
    color: '#B0B0B0',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  contactAddressText: {
    fontSize: 15,
    color: '#B0B0B0',
    lineHeight: 22,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
  socialSection: {
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Bold' : 'System',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    marginHorizontal: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  contactFooter: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#3a3a3a',
    width: '100%',
    marginBottom: 20,
  },

  // Footer Styles
  footer: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
  },
  footerTextTamil: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto-Regular' : 'System',
  },
});

export default HelpSupport;
