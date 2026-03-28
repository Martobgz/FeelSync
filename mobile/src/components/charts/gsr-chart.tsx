import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';

import { GsrDistribution } from '@/src/services/api/measurements-api';

interface Props {
  data: GsrDistribution;
}

const SEGMENTS: { key: keyof GsrDistribution; label: string; color: string }[] = [
  { key: 'normal',   label: 'Normal',   color: '#1D9E75' },
  { key: 'calm',     label: 'Calm',     color: '#3B82F6' },
  { key: 'happy',    label: 'Happy',    color: '#22C55E' },
  { key: 'tense',    label: 'Tense',    color: '#F59E0B' },
  { key: 'stressed', label: 'Stressed', color: '#EF4444' },
];

const SIZE = 160;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 65;
const INNER_R = 38;
const GAP_DEG = 1.5; // visual gap between slices

function buildSlicePath(startDeg: number, sweepDeg: number): ReturnType<typeof Skia.Path.MakeFromSVGString> {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(startDeg + sweepDeg);
  const large = sweepDeg > 180 ? 1 : 0;

  const ox1 = CX + OUTER_R * Math.cos(s);
  const oy1 = CY + OUTER_R * Math.sin(s);
  const ox2 = CX + OUTER_R * Math.cos(e);
  const oy2 = CY + OUTER_R * Math.sin(e);
  const ix1 = CX + INNER_R * Math.cos(e);
  const iy1 = CY + INNER_R * Math.sin(e);
  const ix2 = CX + INNER_R * Math.cos(s);
  const iy2 = CY + INNER_R * Math.sin(s);

  const d = [
    `M ${ox1} ${oy1}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ');

  return Skia.Path.MakeFromSVGString(d);
}

export function GsrChart({ data }: Props) {
  const total = SEGMENTS.reduce((sum, s) => sum + data[s.key], 0);
  if (total === 0) return null;

  let currentDeg = -90; // start from top
  const slices = SEGMENTS.map((seg) => {
    const value = data[seg.key];
    const fullSweep = (value / total) * 360;
    const sweep = Math.max(fullSweep - GAP_DEG, 0);
    const path = value > 0 && sweep > 0.5 ? buildSlicePath(currentDeg, sweep) : null;
    currentDeg += fullSweep;
    return { ...seg, value, path, percent: Math.round((value / total) * 100) };
  }).filter((s) => s.value > 0);

  return (
    <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">GSR State</Text>
      <Text className="mb-3 text-xs text-gray-400">
        emotional state distribution · {total} readings
      </Text>

      <View className="flex-row items-center">
        <Canvas style={{ width: SIZE, height: SIZE }}>
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
    </View>
  );
}
