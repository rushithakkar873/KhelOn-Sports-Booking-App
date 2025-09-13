import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AnimatedLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function AnimatedLoader({ 
  message = 'Loading...', 
  size = 'medium',
  color = '#212529'
}: AnimatedLoaderProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulsing animation for the dots
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in/out animation for the text
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, [spinValue, pulseValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small':
        return { icon: 20, container: 60 };
      case 'large':
        return { icon: 40, container: 100 };
      default:
        return { icon: 28, container: 80 };
    }
  };

  const sizes = getSize();

  return (
    <View style={styles.container}>
      <View style={styles.loaderContainer}>
        {/* Outer ring */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              width: sizes.container,
              height: sizes.container,
              borderColor: `${color}20`,
              transform: [{ rotate: spin }],
            },
          ]}
        />
        
        {/* Inner spinning element */}
        <Animated.View
          style={[
            styles.innerSpinner,
            {
              width: sizes.container - 16,
              height: sizes.container - 16,
              transform: [{ rotate: spin }, { scale: pulseValue }],
            },
          ]}
        >
          <View style={[styles.spinnerDot, { backgroundColor: color }]} />
          <View style={[styles.spinnerDot, { backgroundColor: `${color}60` }]} />
          <View style={[styles.spinnerDot, { backgroundColor: `${color}30` }]} />
        </Animated.View>

        {/* Center icon */}
        <View style={[styles.centerIcon, { backgroundColor: `${color}10` }]}>
          <Ionicons name="flash" size={sizes.icon} color={color} />
        </View>
      </View>

      {/* Loading text with fade animation */}
      <Animated.Text
        style={[
          styles.loadingText,
          size === 'small' && styles.smallText,
          size === 'large' && styles.largeText,
          { color, opacity: fadeValue },
        ]}
      >
        {message}
      </Animated.Text>

      {/* Animated dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: color,
                transform: [
                  {
                    scale: pulseValue.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [0.8, 1.1],
                    }),
                  },
                ],
                opacity: fadeValue.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [0.3 + index * 0.2, 1],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6f7',
    paddingHorizontal: 40,
  },
  loaderContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 50,
    borderStyle: 'dashed',
  },
  innerSpinner: {
    position: 'relative',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 4,
  },
  centerIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 14,
    fontWeight: '500',
  },
  largeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
});