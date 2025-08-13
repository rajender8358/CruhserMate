import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import theme from '../assets/theme';

const getDotSize = size => {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'small':
      return 6;
    case 'large':
      return 12;
    case 'medium':
    default:
      return 8;
  }
};

const Loader = ({
  size = 'medium',
  color = theme.COLORS?.primary || '#007AFF',
  variant = 'inline', // 'inline' | 'fullscreen' | 'overlay'
  style,
  dotCount = 3,
  dotSpacing,
}) => {
  const dotSize = getDotSize(size);
  const spacing = dotSpacing != null ? dotSpacing : Math.ceil(dotSize * 0.9);
  const animations = Array.from({ length: dotCount }).map(() => ({
    scale: useRef(new Animated.Value(1)).current,
    opacity: useRef(new Animated.Value(0.3)).current,
  }));

  useEffect(() => {
    const loops = animations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1.35,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ),
    );

    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = [
    styles.inline,
    variant === 'fullscreen' && styles.fullscreen,
    variant === 'overlay' && styles.overlay,
    style,
  ];

  return (
    <View style={containerStyle} pointerEvents="none">
      <View style={[styles.row, { height: dotSize }]}>
        {animations.map((anim, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                marginLeft: idx === 0 ? 0 : spacing,
                backgroundColor: color,
                transform: [{ scale: anim.scale }],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: '#007AFF',
  },
});

export default Loader;
