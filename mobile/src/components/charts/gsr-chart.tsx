import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { Gsr } from '@/src/constants/theme';
import { GsrDistribution } from '@/src/services/api/measurements-api';

interface Props {
  data: GsrDistribution;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SEGMENTS: { key: keyof GsrDistribution; label: string; color: string }[] = [
  { key: 'normal',   label: 'Normal',   color: Gsr.normal },
  { key: 'calm',     label: 'Calm',     color: Gsr.calm },
  { key: 'happy',    label: 'Happy',    color: Gsr.happy },
  { key: 'tense',    label: 'Tense',    color: Gsr.tense },
  { key: 'stressed', label: 'Stressed', color: Gsr.stressed },
];

const GAP_DEG = 1.5;

function buildSlicePath(
  startDeg: number,
  sweepDeg: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): ReturnType<typeof Skia.Path.MakeFromSVGString> {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(startDeg + sweepDeg);
  const large = sweepDeg > 180 ? 1 : 0;

  const ox1 = cx + outerR * Math.cos(s);
  const oy1 = cy + outerR * Math.sin(s);
  const ox2 = cx + outerR * Math.cos(e);
  const oy2 = cy + outerR * Math.sin(e);
  const ix1 = cx + innerR * Math.cos(e);
  const iy1 = cy + innerR * Math.sin(e);
  const ix2 = cx + innerR * Math.cos(s);
  const iy2 = cy + innerR * Math.sin(s);

  const d = [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ');

  return Skia.Path.MakeFromSVGString(d);
}

export function GsrChart({ data, compact = false, style }: Props) {
  const total = SEGMENTS.reduce((sum, s) => sum + data[s.key], 0);

  const size = compact ? 110 : 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = compact ? 44 : 65;
  const innerR = compact ? 26 : 38;

  if (total === 0) {
    return (
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800" style={style}>
        <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">GSR State</Text>
        <Text className="mb-3 text-xs text-gray-400">emotional state · no data yet</Text>
        <View
          style={{ height: compact ? 110 : 160 }}
          className="items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <Text className="text-sm text-gray-400 dark:text-gray-500">No data available</Text>
        </View>
      </View>
    );
  }

  let currentDeg = -90;
  const slices = SEGMENTS.map((seg) => {
    const value = data[seg.key];
    const fullSweep = (value / total) * 360;
    const sweep = Math.max(fullSweep - GAP_DEG, 0);
    const path =
      value > 0 && sweep > 0.5
        ? buildSlicePath(currentDeg, sweep, cx, cy, outerR, innerR)
        : null;
    currentDeg += fullSweep;
    return { ...seg, value, path, percent: Math.round((value / total) * 100) };
  }).filter((s) => s.value > 0);

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800" style={style}>
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">GSR State</Text>
      <Text className="mb-3 text-xs text-gray-400">
        {compact ? `${total} readings` : `emotional state distribution · ${total} readings`}
      </Text>

      {compact ? (
        /* Compact: donut centered, legend below in 2-column grid */
        <>
          <View className="items-center">
            <Canvas style={{ width: size, height: size }}>
              {slices.map((s) =>
                s.path ? <Path key={s.key} path={s.path} color={s.color} /> : null
              )}
            </Canvas>
          </View>
          <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
            {slices.map((s) => (
              <View key={s.key} className="flex-row items-center gap-1">
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color }} />
                <Text className="text-xs text-gray-700 dark:text-gray-300">
                  {s.label} <Text className="font-semibold">{s.percent}%</Text>
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        /* Default: donut left, legend right */
        <View className="flex-row items-center">
          <Canvas style={{ width: size, height: size }}>
            {slices.map((s) =>
              s.path ? <Path key={s.key} path={s.path} color={s.color} /> : null
            )}
          </Canvas>
          <View className="flex-1 gap-2 pl-3">
            {slices.map((s) => (
              <View key={s.key} className="flex-row items-center gap-2">
                <View
                  style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }}
                />
                <Text className="flex-1 text-xs text-gray-700 dark:text-gray-300">{s.label}</Text>
                <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                  {s.percent}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
