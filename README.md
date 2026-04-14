# SalaryNet — Mobile

AI-powered personal expense tracker. React Native app built with Expo Router, talking to the SalaryNet backend.

## Stack

- **Framework:** Expo SDK 54, React Native 0.81, React 19
- **Navigation:** Expo Router (file-based, `app/` directory)
- **Styling:** NativeWind (Tailwind CSS for RN)
- **State:** Zustand + React Query (`@tanstack/react-query`)
- **Forms / validation:** React Hook Form + Zod
- **HTTP:** Axios
- **Storage:** AsyncStorage + Expo SecureStore
- **i18n:** i18next + react-i18next + expo-localization
- **Auth UX:** expo-local-authentication (biometrics), OTP flows
- **Charts:** `react-native-svg` (Expo Go compatible)

> Runs in Expo Go — no custom native modules, no MMKV/Skia.

## Project layout

```
app/                    # Expo Router screens
├── (auth)/             # sign-in, sign-up, forgot-password
├── (tabs)/             # index, stats, chat, profile
├── _layout.tsx
├── modal.tsx
└── onboarding.tsx

src/
├── components/
├── config/             # env / API URL resolution
├── constants/
├── hooks/
├── lib/
├── locales/            # i18n resources
├── services/           # api client, auth, expense, chat, upload
├── stores/             # zustand stores
├── types/
└── utils/

assets/                 # icons, images, fonts
```

## Prerequisites

- Node.js ≥ 20
- Yarn
- Expo Go app on your phone, or an iOS/Android simulator
- SalaryNet **server** running (see `../server/README.md`)

## Setup

```bash
# 1. Install dependencies
yarn install

# 2. Start the dev server
yarn start
```

Then:

- Scan the QR code with **Expo Go** on a physical device, **or**
- Press `i` for iOS simulator, `a` for Android emulator, `w` for web.

## Connecting to the backend

The API URL is resolved in `src/config/env.ts` with the following priority:

1. `EXPO_PUBLIC_API_URL` environment variable
2. `extra.API_URL` from `app.json`
3. Auto-detected Expo dev-server host → `http://<your-lan-ip>:4000/api/v1` (works in Expo Go on physical devices)
4. Platform fallback: `http://10.0.2.2:4000/api/v1` on Android emulator, `http://localhost:4000/api/v1` elsewhere

To point at a different backend, export the env var before starting:

```bash
EXPO_PUBLIC_API_URL=https://api.example.com/api/v1 yarn start
```

## Scripts

| Command | Description |
|---|---|
| `yarn start` | Start the Expo dev server |
| `yarn ios` | Open in iOS simulator |
| `yarn android` | Open in Android emulator |
| `yarn web` | Run as a web app |
| `yarn lint` | Run `expo lint` |
| `yarn reset-project` | Move starter code to `app-example/` and scaffold a blank `app/` |

## Features

- Email / phone signup with OTP verification
- Biometric unlock (Face ID / Touch ID / fingerprint)
- Expense tracking with categories and budgets
- Statistics dashboard with SVG charts
- AI chat assistant (Gemini-powered, via backend)
- Image / receipt uploads
- Multi-language support (i18next)
- Light / dark theme, edge-to-edge on Android

## Notes

- This app is designed to run inside **Expo Go**, so native-only libraries like `react-native-mmkv` or `@shopify/react-native-skia` are intentionally avoided. Use `AsyncStorage` for persistence and `react-native-svg` for charts.
- Secrets (JWT tokens) are stored in Expo SecureStore, not AsyncStorage.
