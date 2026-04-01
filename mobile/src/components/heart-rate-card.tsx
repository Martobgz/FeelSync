import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Status } from '@/src/constants/theme';

interface Props {
  bpm: number | null;
}

function getColor(bpm: number | null): { bg: string; text: string } {
  if (bpm === null) return { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-400' };
  if (bpm > 120) return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-500' };
  if (bpm > 100) return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-500' };
  return { bg: 'bg-brand-light/30 dark:bg-brand-primary/20', text: 'text-brand-primary' };
}

export function HeartRateCard({ bpm }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { bg, text } = getColor(bpm);

  useEffect(() => {
    if (bpm !== null) {
      const pulse = Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]);
      pulse.start();
    }
  }, [bpm, scale]);

  return (
    <View className={`flex-1 rounded-2xl p-4 shadow-sm ${bg}`}>
      <View className="mb-1 flex-row items-center gap-1.5">
        <IconSymbol name="heart.fill" size={14} color={Status.disconnected} />
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">Heart Rate</Text>
      </View>
      <Animated.Text
        style={{ transform: [{ scale }] }}
        className={`text-5xl font-bold ${text}`}>
        {bpm ?? '--'}
      </Animated.Text>
      <Text className="mt-0.5 text-xs text-gray-400">BPM</Text>
    </View>
  );
}
