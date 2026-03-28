import { useFont } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

interface Props {
  data: number[];
}

export function Spo2Chart({ data }: Props) {
  const font = useFont(null, 10);

  if (data.length === 0) return null;

  const chartData = data.map((value, i) => ({ x: i, spo2: value }));

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        SpO₂
      </Text>
      <Text className="mb-3 text-xs text-gray-400">
        % · {data.length} readings
      </Text>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['spo2']}
          axisOptions={{
            font,
            tickCount: { x: 0, y: 5 },
            lineColor: '#E5E7EB',
            labelColor: '#6B7280',
          }}
          domain={{ y: [88, 100] }}>
          {({ points }) => (
            <Line
              points={points.spo2}
              color="#3B82F6"
              strokeWidth={2}
              animate={{ type: 'timing', duration: 400 }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
