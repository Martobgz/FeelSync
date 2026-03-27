# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FeelSync is a React Native mobile app for monitoring bipolar disorder patients. It tracks heart rate, sleep, and medication adherence from a smartwatch, and notifies caregivers of anomalies indicating potential depressive or manic episodes.

## Mobile App Commands

All commands run from the `mobile/` directory:

```bash
cd mobile
npm install        # Install dependencies
npm start          # Start Expo dev server
npm run android    # Launch on Android emulator
npm run ios        # Launch on iOS simulator
npm run web        # Launch web version
npm run lint       # Run ESLint
```

No test runner is configured yet.

## Architecture

### Navigation (Planned vs. Current)
The feature plan specifies a **4-tab navigator**: Home (charts), Alerts, Medications, Map. Currently only 2 placeholder tabs exist (index, explore). New screens go in `mobile/src/app/(tabs)/`.

### Routing
File-based routing via Expo Router. Files in `src/app/` map directly to routes. The `(tabs)/` group uses a bottom tab navigator defined in `src/app/(tabs)/_layout.tsx`.

### Theming
All components use `ThemedView`/`ThemedText` from `src/components/` and the `useThemeColor()` hook. Color palettes and fonts are defined in `src/constants/theme.ts`. The app supports automatic light/dark mode.

### Path Alias
`@/` maps to `mobile/` root — use `@/src/...` for imports.

## Planned Modules (from FeelSync_Feature_Plan.txt)

| Module | Key Libraries |
|--------|--------------|
| Charts (heart rate/sleep) | Backend fetch, `AsyncStorage` for offline caching |
| Episode notifications | `expo-notifications`, push tokens sent to backend |
| Medications | `expo-notifications` (scheduled local), `AsyncStorage` |
| Location | `react-native-maps`, `expo-location`, `expo-task-manager` |

**Notification architecture:** Two separate mechanisms — push notifications (server-triggered for episode alerts) vs. scheduled local notifications (medication reminders, device-only, no server needed).

**Location:** Start with foreground-only; background tracking via `expo-task-manager` added after App Store review.

## Tech Stack

- React 19 + React Native 0.81.5, Expo 54 (New Architecture enabled)
- TypeScript strict mode, Expo Router 6
- React Compiler enabled (`experiments.reactCompiler: true` in app.json)
- No CSS framework — use React Native `StyleSheet`
