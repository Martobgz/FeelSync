import { useFont } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { Bar, CartesianChart, Line } from 'victory-native';

import { NightlySleep } from '@/src/types/biometric';

interface Props {
  data: NightlySleep[];
}

function xLabel(date: string, total: number): string {
  const d = new Date(date);
  if (total <= 7) return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const NORMAL_HOURS = 7;

export function SleepChart({ data }: Props) {
  const font = useFont(null, 10);

  if (data.length === 0) return null;

  // Split into two series so each Bar gets a static color (avoids Reanimated recorder crash)
  const chartData = data.map((d, i) => ({
    x: i,
    hoursOk: d.anomaly ? 0 : d.hours,
    hoursAnomaly: d.anomaly ? d.hours : 0,
    normal: NORMAL_HOURS,
    label: xLabel(d.date, data.length),
  }));

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Sleep</Text>
      <Text className="mb-3 text-xs text-gray-400">hours per night · dashed = 7h norm · red = anomaly</Text>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['hoursOk', 'hoursAnomaly', 'normal']}
          axisOptions={{
            font,
            tickCount: { x: data.length <= 7 ? data.length : 6, y: 5 },
            formatXLabel: (v) => chartData[v as number]?.label ?? '',
            lineColor: '#E5E7EB',
            labelColor: '#6B7280',
          }}
          domain={{ y: [0, 12] }}>
          {({ points, chartBounds }) => (
            <>
              <Bar
                points={points.hoursOk}
                chartBounds={chartBounds}
                color="#1D9E75"
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                animate={{ type: 'timing', duration: 400 }}
              />
              <Bar
                points={points.hoursAnomaly}
                chartBounds={chartBounds}
                color="#EF4444"
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                animate={{ type: 'timing', duration: 400 }}
              />
              <Line
                points={points.normal}
                color="#9CA3AF"
                strokeWidth={1.5}
                strokeDashArray={[4, 4]}
              />
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
