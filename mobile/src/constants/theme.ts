import { Platform } from 'react-native';

import { brand, status } from './colors';

export const Brand = brand;
export const Status = status;

// Semantic colors for GSR emotional-state segments
export const Gsr = {
  normal:   Brand.primary,       // #1D9E75
  calm:     '#3B82F6',
  happy:    Status.connected,    // #22C55E
  tense:    Status.connecting,   // #F59E0B
  stressed: Status.disconnected, // #EF4444
};

// Neutral colors used in chart axes and grid lines
export const Chart = {
  axis:     '#E5E7EB', // gray-200
  label:    '#6B7280', // gray-500
  gridLine: '#9CA3AF', // gray-400
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: Brand.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: Brand.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: Brand.mid,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Brand.mid,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
