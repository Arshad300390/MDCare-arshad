import React from 'react';
import {TouchableOpacity, Text, ActivityIndicator, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {globalStyles} from '../../../styles/globalStyles';
import {theme} from '../../../styles/theme';

const Button = ({
  onPress,
  title,
  loading,
  style,
  textStyle,
  width,
  disabled,
  textColor,
}) => {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          {
            width: width || 'auto',
          },
          style,
        ]}
        activeOpacity={0.9}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
          style={[
            globalStyles.buttonPrimary,
            {width: '100%', borderRadius: theme.borderRadius.large},
          ]}>
          {loading ? (
            <ActivityIndicator color={textColor || '#fff'} size={25} />
          ) : (
            <Text
              style={[
                globalStyles.buttonText,
                textStyle,
                {color: textColor || '#fff'},
              ]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default Button;
