# Mobile App Build Guide

## Prerequisites
- **iOS**: Mac with Xcode installed (free from Mac App Store)
- **Android**: Android Studio installed (free, Mac/Windows/Linux)
- Node.js installed on your computer

## Steps

### 1. Export & Clone
1. In Lovable, go to **Settings → GitHub** and export to your GitHub repo
2. On your laptop, clone the repo:
   ```bash
   git clone <your-repo-url>
   cd <your-project>
   ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Platforms
```bash
npx cap add ios      # For iPhone/iPad
npx cap add android  # For Android
```

### 4. Build & Sync
```bash
npm run build
npx cap sync
```

### 5. Run on Device/Emulator
```bash
npx cap run ios      # Opens Xcode → Run on simulator or device
npx cap run android  # Opens Android Studio → Run on emulator or device
```

## Publishing

### Apple App Store
- Requires Apple Developer account ($99/year)
- Build in Xcode → Archive → Upload to App Store Connect

### Google Play Store
- Requires Google Play Developer account ($25 one-time)
- Build signed APK/AAB in Android Studio → Upload to Play Console

## Hot Reload (Development)
The `capacitor.config.ts` is currently set to load from the Lovable preview URL.
When building for production, remove the `server` block so the app uses the local `dist/` files.

## After Code Changes
Whenever you pull new code from GitHub:
```bash
npm run build
npx cap sync
```
