import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LeftArrowIcon from '../../assets/Icon/left-arrow.svg';
import { useLanguage } from '../../utils/LanguageContext';

const Header = ({
  title,
  onBack,
  showBackButton = true,
  backIconWidth = 20,
  backIconHeight = 20,
  backIconFill = '#1F2937',
  titleStyle = {},
  headerStyle = {},
  showDivider = true,
  dividerStyle = {},
  rightComponent = null
}) => {
  const { t, language } = useLanguage();
  const displayTitle = typeof title === 'string' ? t(title) : title;

  return (
    <View style={[styles.container, headerStyle]}>
      {/* Header Content */}
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.6}
          >
            <LeftArrowIcon
              width={backIconWidth}
              height={backIconHeight}
              fill={backIconFill}
              marginTop={-10}
            />
          </TouchableOpacity>
        )}

        <Text style={[styles.headerTitle, language === 'ta' && { fontSize: 19 }, titleStyle]}>
          {displayTitle}
        </Text>

        {/* Right side component (optional) */}
        {rightComponent && (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        )}
      </View>

      {/* Separator/Divider */}
      {showDivider && (
        <View style={[styles.separator, dividerStyle]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : 'System',
    marginTop: -10,
    flex: 1,
  },
  rightComponent: {
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#d7dce4ff', // Darker gray color for better visibility
  },
});

export default Header;