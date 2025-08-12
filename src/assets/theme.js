const COLORS = {
  primary: '#2C3E50', // Dark blue-gray
  secondary: '#3498DB', // Modern blue
  accent: '#E74C3C', // Modern red
  danger: '#E74C3C', // Red for delete buttons
  white: '#FFFFFF',
  black: '#000000',
  gray: '#BDC3C7', // Light gray
  lightGray: '#ECF0F1', // Very light gray
  darkGray: '#7F8C8D', // Medium gray
  text: '#2C3E50', // Dark text
  placeholder: '#7F8C8D', // Darker placeholder text color for better visibility
  background: '#F8F9FA', // Light background
  inputBorder: '#E8E8E8', // Input border color
  shadow: '#000000', // Shadow color
};

const SIZES = {
  // global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // font sizes
  largeTitle: 50,
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
};

const FONTS = {
  largeTitle: {
    fontFamily: 'Roboto-regular',
    fontSize: SIZES.largeTitle,
    lineHeight: 55,
  },
  h1: { fontFamily: 'Roboto-Black', fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: 'Roboto-Bold', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: 'Roboto-Bold', fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontFamily: 'Roboto-Bold', fontSize: SIZES.h4, lineHeight: 22 },
  body1: {
    fontFamily: 'Roboto-Regular',
    fontSize: SIZES.body1,
    lineHeight: 36,
  },
  body2: {
    fontFamily: 'Roboto-Regular',
    fontSize: SIZES.body2,
    lineHeight: 30,
  },
  body3: {
    fontFamily: 'Roboto-Regular',
    fontSize: SIZES.body3,
    lineHeight: 22,
  },
  body4: {
    fontFamily: 'Roboto-Regular',
    fontSize: SIZES.body4,
    lineHeight: 22,
  },
};

const theme = { COLORS, SIZES, FONTS };

export default theme;
