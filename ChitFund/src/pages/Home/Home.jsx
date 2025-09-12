import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  Dimensions 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import styles from './Homesty';

const { width } = Dimensions.get('window');

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const quickActions = [
    {
      id: 1,
      title: 'Join Group',
      icon: 'account-group-outline',
      color: '#4CAF50',
      description: 'Join a new chit group'
    },
    {
      id: 2,
      title: 'My Portfolio',
      icon: 'chart-line',
      color: '#2196F3',
      description: 'View your investments'
    },
    {
      id: 3,
      title: 'Payments',
      icon: 'credit-card-outline',
      color: '#FF9800',
      description: 'Make payments'
    },
    {
      id: 4,
      title: 'Support',
      icon: 'help-circle-outline',
      color: '#9C27B0',
      description: 'Get help & support'
    }
  ];

  const features = [
    {
      title: 'Secure Investments',
      description: 'Your money is safe with our RBI-compliant chit fund operations',
      icon: 'shield-check'
    },
    {
      title: 'Flexible Plans',
      description: 'Choose from various plans that suit your financial goals',
      icon: 'cog-outline'
    },
    {
      title: 'Easy Withdrawals',
      description: 'Quick and hassle-free withdrawal process',
      icon: 'cash-multiple'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '₹50Cr+', label: 'Funds Managed' },
    { value: '15+', label: 'Years Experience' },
    { value: '99.9%', label: 'Success Rate' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.userName}>Gowtham</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#1A2A4E" />
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
              Join thousands of satisfied customers in our trusted chit fund community
            </Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Start Investing</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroAnimation}>
            <LottieView
              source={require('../../animation/Finance.json')}
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

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <MaterialCommunityIcons 
                    name={action.icon} 
                    size={28} 
                    color={action.color} 
                  />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Investment Plans Preview */}
        <View style={styles.plansSection}>
          <View style={styles.plansSectionHeader}>
            <Text style={styles.sectionTitle}>Popular Plans</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.plansScrollView}
          >
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Gold Plan</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Popular</Text>
                </View>
              </View>
              <Text style={styles.planAmount}>₹5,000</Text>
              <Text style={styles.planDuration}>20 Months</Text>
              <Text style={styles.planReturn}>Expected Return: ₹95,000</Text>
              <TouchableOpacity style={styles.planButton}>
                <Text style={styles.planButtonText}>Join Now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Silver Plan</Text>
              </View>
              <Text style={styles.planAmount}>₹3,000</Text>
              <Text style={styles.planDuration}>15 Months</Text>
              <Text style={styles.planReturn}>Expected Return: ₹42,000</Text>
              <TouchableOpacity style={styles.planButton}>
                <Text style={styles.planButtonText}>Join Now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Diamond Plan</Text>
              </View>
              <Text style={styles.planAmount}>₹10,000</Text>
              <Text style={styles.planDuration}>24 Months</Text>
              <Text style={styles.planReturn}>Expected Return: ₹2,20,000</Text>
              <TouchableOpacity style={styles.planButton}>
                <Text style={styles.planButtonText}>Join Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>What Our Customers Say</Text>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds has been my trusted partner for over 5 years. 
              Their transparent process and timely payouts make them the best choice."
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>Rajesh Kumar</Text>
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
            <TouchableOpacity style={styles.contactCard}>
              <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
              <Text style={styles.contactText}>Call Us</Text>
              <Text style={styles.contactValue}>+91 98765 43210</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactCard}>
              <MaterialCommunityIcons name="email" size={24} color="#2196F3" />
              <Text style={styles.contactText}>Email Us</Text>
              <Text style={styles.contactValue}>info@periyachit.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Regulated by RBI | NBFC License No: XYZ123
          </Text>
          <Text style={styles.footerCopyright}>
            © 2025 ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
