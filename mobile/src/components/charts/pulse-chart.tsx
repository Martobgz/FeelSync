import { useFont } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { Brand, Chart } from '@/src/constants/theme';
import { TimestampedPulse } from '@/src/services/api/measurements-api';

interface Props {
  data: TimestampedPulse[];
}

function formatXLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function PulseChart({ data }: Props) {
  const font = useFont(null, 10);

  if (data.length === 0) {
    return (
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Pulse</Text>
        <Text className="mb-3 text-xs text-gray-400">BPM · no readings yet</Text>
        <View
          style={{ height: 200 }}
          className="items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <Text className="text-sm text-gray-400 dark:text-gray-500">No data available</Text>
        </View>
      </View>
    );
  }

  const chartData = data.map((point) => ({
    x: new Date(point.timestamp).getTime(),
    bpm: point.pulse,
  }));

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Pulse</Text>
      <Text className="mb-3 text-xs text-gray-400">BPM · {data.length} readings</Text>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['bpm']}
          axisOptions={{
            font,
            tickCount: { x: 5, y: 5 },
            formatXLabel: (v) => formatXLabel(v as number),
            lineColor: Chart.axis,
            labelColor: Chart.label,
          }}
          domain={{ y: [40, 140] }}>
          {({ points }) => (
            <Line
              points={points.bpm}
              color={Brand.primary}
              strokeWidth={2}
              animate={{ type: 'timing', duration: 400 }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
