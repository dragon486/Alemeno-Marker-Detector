# Marker Detection & Extraction App

A high-performance Android application built with React Native for detecting and extracting custom visual markers. Developed for the Alemeno Frontend Internship Assignment.

## 🚀 Features
- **Real-time Detection**: Uses Vision Camera v3 Frame Processors + OpenCV.
- **Marker 2 Support**: Optimized for solid-border markers with corner anchor squares.
- **Orientation Correction**: Automatically rectifies and rotates markers to an upright 300x300px format.
- **Deduplication**: Prevents duplicate captures using image hashing.
- **High-Performance**: Off-thread processing ensures smooth 30fps camera preview.

## 🛠 Setup Instructions
1. **Prerequisites**:
   - Node.js 18+
   - Android Studio & SDK (minSdk 24)
   - JDK 17

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Android Configuration**:
   - Ensure USB Debugging is enabled on your device.
   - Run a clean build:
     ```bash
     cd android && ./gradlew clean && cd ..
     ```

## 📱 Running the App
```bash
npx react-native run-android --mode=release
```

## 📦 Building the APK
```bash
cd android
./gradlew assembleRelease
```
The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

## 📁 Project Structure
- `src/detection`: Core computer vision logic (worklets).
- `src/screens`: Camera and Results UI.
- `src/utils`: Hashing and deduplication logic.
- `src/components`: UI overlays and grid components.

## 📄 Documentation
See [APPROACH.md](./APPROACH.md) for a detailed technical explanation of the detection algorithm and optimizations.
