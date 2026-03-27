import { Circle, useFont } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { CartesianChart, Area, Line } from 'victory-native';

import { DailyHeartRate } from '@/src/types/biometric';

interface Props {
  data: DailyHeartRate[];
}

function xLabel(date: string, total: number): string {
  const d = new Date(date);
  if (total <= 7) return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function HeartRateChart({ data }: Props) {
  const font = useFont(null, 10); // null = system font at 10px

  if (data.length === 0) return null;

  const chartData = data.map((d, i) => ({
    x: i,
    avg: d.avg,
    min: d.min,
    max: d.max,
    anomaly: d.anomaly ? d.avg : null,
    label: xLabel(d.date, data.length),
  }));

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        Heart Rate
      </Text>
      <Text className="mb-3 text-xs text-gray-400">avg · min–max band · red = anomaly</Text>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['min', 'avg', 'max']}
          axisOptions={{
            font,
            tickCount: { x: data.length <= 7 ? data.length : 6, y: 5 },
            formatXLabel: (v) => chartData[v as number]?.label ?? '',
            lineColor: '#E5E7EB',
            labelColor: '#6B7280',
          }}
          domain={{ y: [30, 150] }}>
          {({ points, chartBounds }) => (
            <>
              {/* Min–max band */}
              <Area
                points={points.max}
                y0={({ index }) => points.min[index]?.y ?? chartBounds.bottom}
                color="#9FE1CB"
                opacity={0.3}
                animate={{ type: 'timing', duration: 400 }}
              />
              {/* Avg line */}
              <Line
                points={points.avg}
                color="#1D9E75"
                strokeWidth={2}
                animate={{ type: 'timing', duration: 400 }}
              />
              {/* Anomaly — red circle on anomaly days */}
              {points.avg.map((p, i) =>
                chartData[i]?.anomaly != null && p.y != null
                  ? <Circle key={i} cx={p.x} cy={p.y} r={5} color="#EF4444" />
                  : null
              )}
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
