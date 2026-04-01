// Single source of truth for brand and status colors.
// Imported by both theme.ts (via TypeScript) and tailwind.config.js (via require).
const brand = { primary: '#1D9E75', mid: '#5DCAA5', light: '#9FE1CB' };
const status = { connected: '#22C55E', connecting: '#F59E0B', disconnected: '#EF4444' };

module.exports = { brand, status };
