import { Animated } from 'react-native';
import { useEffect, useRef } from 'react';

/**
 * Returns a spin style (360° rotation) and starts/stops the animation
 * based on the `active` flag. Pass the returned `spinStyle` to an Animated.View.
 */
export function useSpinAnimation(active: boolean, durationMs = 1000) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const spin = Animated.loop(
        Animated.timing(spinValue, { toValue: 1, duration: durationMs, useNativeDriver: true })
      );
      spin.start();
      return () => {
        spin.stop();
        spinValue.setValue(0);
      };
    } else {
      spinValue.setValue(0);
    }
  }, [active, durationMs, spinValue]);

  const spinStyle = {
    transform: [
      { rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
    ],
  };

  return spinStyle;
}
