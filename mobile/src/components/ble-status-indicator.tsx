import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { Status } from '@/src/constants/theme';
import { BleConnectionState } from '@/src/services/ble/ble-types';

const STATE_COLORS: Record<BleConnectionState, string> = {
  connected: Status.connected,
  connecting: Status.connecting,
  scanning: Status.connecting,
  disconnected: Status.disconnected,
};

interface Props {
  status: BleConnectionState;
  size?: number;
}

export function BleStatusIndicator({ status, size = 12 }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'connecting' || status === 'scanning') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      opacity.setValue(1);
    }
  }, [status, opacity]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: STATE_COLORS[status],
        opacity,
      }}
    />
  );
}
