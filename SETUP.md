# Farm Spray — Setup Guide

## Phone login: Firebase PNV (Phone Number Verification)

This app uses **[Firebase Phone Number Verification (PNV)](https://firebase.google.com/docs/phone-number-verification)** on Android — one-tap carrier verification without SMS codes ([codelab](https://firebase.google.com/codelabs/firebase-pnv-android)).

- **Android + supported carrier:** One-tap PNV consent dialog
- **iOS / unsupported carrier:** Falls back to Firebase Auth SMS OTP

PNV requires a **development build** (not Expo Go). See [React Native Firebase PNV docs](https://rnfirebase.io/phone-number-verification/usage).

---

## Setup steps

### 1. Firebase Console

1. **Security → Phone Verification** — enable and set up **Testing** or **Production**
2. **Authentication → Phone** — enable (for SMS fallback)
3. Download **`google-services.json`** → place in `my-spray/google-services.json`
4. Register Android app with package: `com.farmspray.app`
5. Add **SHA-256** fingerprint (required for production PNV)

### 2. Test mode (no SIM / emulator)

1. Firebase Console → **Security → Phone Verification → Testing**
2. Generate a **test token** (valid 7 days)
3. Add to `.env`:
   ```
   EXPO_PUBLIC_FPNV_TEST_TOKEN=your_test_token_here
   ```
4. On test device: enroll in [Google system services beta](https://firebase.google.com/codelabs/firebase-pnv-android#3)

### 3. Deploy Cloud Function (verifies PNV JWT)

```bash
cd functions
npm install
firebase use my-spray-ad2aa
firebase deploy --only functions:verifyPnvToken
firebase deploy --only firestore:rules,storage
```

### 4. Build Android dev client

```bash
cd my-spray
npm install
npx expo prebuild --platform android
npx expo run:android
```

Or with EAS:

```bash
eas build --profile development --platform android
```

---

## Environment (`.env`)

Copy `.env.example` to `.env` and fill Firebase web config + optional `EXPO_PUBLIC_FPNV_TEST_TOKEN`.

---

## Architecture

```
Android app → getVerifiedPhoneNumber() [firebase-pnv module]
           → JWT token → Cloud Function verifyPnvToken
           → Firebase custom token → signInWithCustomToken
           → Firestore / Storage (JS SDK)
```

Token verification follows [Firebase PNV verify tokens guide](https://firebase.google.com/docs/phone-number-verification/verify-tokens).
