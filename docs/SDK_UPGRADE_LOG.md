# Expo SDK Upgrade Log

A running record of every SDK upgrade done on this project — what changed, why, and any issues encountered.

---

## Why This File Exists

Expo Go on iOS auto-updates to the latest SDK. You cannot install older versions on iOS.
This means whenever Expo releases a new SDK, your project **must be upgraded** to match, or you'll get:

```
ERROR: Project is incompatible with this version of Expo Go
The installed version of Expo Go is for SDK XX. The project uses SDK YY.
```

**The fix every time:**
```powershell
npx expo install expo@^<new-sdk>.0.0
npx expo install --fix -- --legacy-peer-deps
```

---

## Upgrade History

---

### SDK 54 → SDK 57
**Date:** September 14, 2026
**Triggered by:** Expo Go on iOS auto-updated to SDK 57, project was on SDK 54

**Root cause of install error:**
`react-native-windows` was pulled in as an optional peer of `@react-native-community/datetimepicker@9.1.0`,
demanding `react-native@0.84.1` which conflicted with SDK 57's required `react-native@0.86.3`.

**Fix applied:**
```powershell
npx expo install expo@^57.0.0
npx expo install --fix -- --legacy-peer-deps
```

The `--legacy-peer-deps` flag bypasses the `react-native-windows` peer conflict.

**Packages updated (39 total):**

| Package | From | To |
|---|---|---|
| expo | ~54.0.0 | ^57.0.0 |
| react | 19.1.0 | 19.2.3 |
| react-dom | 19.1.0 | 19.2.3 |
| react-native | 0.81.5 | 0.86.3 |
| expo-router | ~6.0.24 | ~57.0.21 |
| expo-asset | ~12.0.13 | ~57.0.17 |
| expo-blur | ~15.0.8 | ~57.0.3 |
| expo-constants | ~18.0.14 | ~57.0.18 |
| expo-dev-client | ~6.0.21 | ~57.0.19 |
| expo-font | ~14.0.12 | ~57.0.4 |
| expo-gl | ~16.0.10 | ~57.0.2 |
| expo-haptics | ~15.0.8 | ~57.0.3 |
| expo-image | ~3.0.11 | ~57.0.5 |
| expo-image-picker | ~17.0.11 | ~57.0.17 |
| expo-linear-gradient | ~15.0.8 | ~57.0.2 |
| expo-linking | ~8.0.12 | ~57.0.10 |
| expo-location | ~19.0.8 | ~57.0.17 |
| expo-notifications | ~0.32.17 | ~57.0.18 |
| expo-sensors | ~15.0.8 | ~57.0.3 |
| expo-splash-screen | ~31.0.13 | ~57.0.9 |
| expo-sqlite | ~16.0.10 | ~57.0.3 |
| expo-status-bar | ~3.0.9 | ~57.0.1 |
| expo-symbols | ~1.0.8 | ~57.0.3 |
| expo-system-ui | ~6.0.9 | ~57.0.4 |
| expo-task-manager | ~14.0.9 | ~57.0.17 |
| expo-web-browser | ~15.0.11 | ~57.0.3 |
| @expo/vector-icons | ^14.0.0 | ^15.0.2 |
| @react-native-async-storage/async-storage | 2.1.2 | 2.2.0 |
| @react-native-community/datetimepicker | 8.4.4 | 9.1.0 |
| react-native-gesture-handler | ~2.28.0 | ~2.32.0 |
| react-native-maps | 1.20.1 | 1.27.2 |
| react-native-reanimated | ~4.1.1 | 4.5.1 |
| react-native-safe-area-context | ~5.6.0 | ~5.7.0 |
| react-native-screens | ~4.16.0 | ~4.26.0 |
| react-native-svg | 15.12.1 | 15.15.4 |
| react-native-web | ~0.20.0 | ^0.21.2 |
| react-native-worklets | 0.5.1 | 0.10.1 |
| @types/react | ~19.1.10 | ~19.2.4 |
| eslint-config-expo | ~10.0.0 | ~57.0.2 |
| typescript | ~5.9.2 | ~6.0.3 |

**Known warnings after upgrade (safe to ignore):**
- `DEP0151` — `react-native-worklets` has a missing file extension in its `main` field. Known issue, doesn't affect runtime.
- `npm audit` shows 17 vulnerabilities (15 moderate, 2 high) — all in indirect dependencies, not project code. Do NOT run `npm audit fix --force`.

---

## Upgrade Template (copy for next time)

```
### SDK XX → SDK YY
**Date:** 
**Triggered by:** 

**Root cause of install error (if any):**

**Fix applied:**
\`\`\`powershell
npx expo install expo@^YY.0.0
npx expo install --fix -- --legacy-peer-deps
\`\`\`

**Packages updated:**
(run `git diff package.json` before and after to capture this)

**Known warnings after upgrade:**

**Breaking changes / things that broke:**
```
