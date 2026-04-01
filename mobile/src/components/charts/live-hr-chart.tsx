import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { Brand } from '@/src/constants/theme';

interface Props {
  readings: { x: number; bpm: number }[];
}

export function LiveHrChart({ readings }: Props) {
  return (
    <View style={{ height: 160 }}>
      <CartesianChart
        data={readings}
        xKey="x"
        yKeys={['bpm']}
        domain={{ y: [40, 150] }}>
        {({ points }) => (
          <Line
            points={points.bpm}
            color={Brand.primary}
            strokeWidth={2}
            animate={{ type: 'timing', duration: 300 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}
