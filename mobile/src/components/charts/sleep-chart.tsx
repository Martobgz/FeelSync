import { useFont } from '@shopify/react-native-skia';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Bar, CartesianChart, Line } from 'victory-native';

import { Brand, Chart, Status } from '@/src/constants/theme';
import { NightlySleep } from '@/src/types/biometric';

interface Props {
  data: NightlySleep[];
  chartHeight?: number;
  style?: StyleProp<ViewStyle>;
}

function xLabel(date: string, total: number): string {
  const d = new Date(date);
  if (total <= 7) return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const NORMAL_HOURS = 7;

export function SleepChart({ data, chartHeight = 200, style }: Props) {
  const font = useFont(null, 10);

  if (data.length === 0) {
    return (
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800" style={style}>
        <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Sleep</Text>
        <Text className="mb-3 text-xs text-gray-400">hours · no data yet</Text>
        <View
          style={{ height: chartHeight }}
          className="items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <Text className="text-sm text-gray-400 dark:text-gray-500">No data available</Text>
        </View>
      </View>
    );
  }

  // Split into two series so each Bar gets a static color (avoids Reanimated recorder crash)
  const chartData = data.map((d, i) => ({
    x: i,
    hoursOk: d.anomaly ? 0 : d.hours,
    hoursAnomaly: d.anomaly ? d.hours : 0,
    normal: NORMAL_HOURS,
    label: xLabel(d.date, data.length),
  }));

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800" style={style}>
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Sleep</Text>
      <Text className="mb-3 text-xs text-gray-400">hours · dashed = 7h norm</Text>

      <View style={{ height: chartHeight }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['hoursOk', 'hoursAnomaly', 'normal']}
          axisOptions={{
            font,
            tickCount: { x: data.length <= 7 ? data.length : 6, y: 5 },
            formatXLabel: (v) => chartData[v as number]?.label ?? '',
            lineColor: Chart.axis,
            labelColor: Chart.label,
          }}
          domain={{ y: [0, 12] }}>
          {({ points, chartBounds }) => (
            <>
              <Bar
                points={points.hoursOk}
                chartBounds={chartBounds}
                color={Brand.primary}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                animate={{ type: 'timing', duration: 400 }}
              />
              <Bar
                points={points.hoursAnomaly}
                chartBounds={chartBounds}
                color={Status.disconnected}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                animate={{ type: 'timing', duration: 400 }}
              />
              <Line
                points={points.normal}
                color={Chart.gridLine}
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
