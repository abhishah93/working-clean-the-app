
# EAS Development Build Setup Guide

This guide will help you set up and run your app in the EAS development environment.

## What Changed from Expo Go?

When moving from Expo Go to EAS development builds, several things work differently:

### 1. **Native Modules**
- Expo Go has pre-installed native modules
- EAS builds compile native modules specifically for your app
- This means better performance and more control

### 2. **Notifications**
- Require proper permissions configuration in app.json
- Need physical device for testing (simulators have limitations)
- Background notifications work better in EAS builds

### 3. **Audio/AV**
- Requires explicit permissions
- Better control over audio sessions
- More reliable alarm sounds

### 4. **Storage**
- AsyncStorage works the same but is more reliable
- Data persists better across app restarts

## Setup Steps

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Your Project
The app.json has been updated with:
- Notification permissions
- Audio permissions
- Android-specific permissions for alarms
- Proper plugin configurations

### 4. Build Development Client

#### For iOS:
```bash
eas build --profile development --platform ios
```

#### For Android:
```bash
eas build --profile development --platform android
```

#### For iOS Simulator (faster for testing):
```bash
eas build --profile development --platform ios --local
```

### 5. Install the Development Build
- iOS: Install via TestFlight or direct download
- Android: Install the APK directly

### 6. Start Development Server
```bash
npx expo start --dev-client
```

## Key Differences to Note

### Notifications
- **Expo Go**: Limited notification support
- **EAS Build**: Full notification support with background handling
- **Testing**: Use physical devices for best results

### DateTimePicker
- **Expo Go**: May have UI inconsistencies
- **EAS Build**: Native picker with proper styling
- **Fix Applied**: Added proper plugin configuration

### Audio/Timers
- **Expo Go**: May not play sounds reliably
- **EAS Build**: Reliable audio playback with proper permissions
- **Fix Applied**: Added audio permissions and device detection

### AsyncStorage
- **Expo Go**: Works but may clear on updates
- **EAS Build**: Persistent and reliable
- **No Changes Needed**: Works out of the box

## Troubleshooting

### Notifications Not Working
1. Check device permissions in Settings
2. Verify you're on a physical device (not simulator)
3. Check console logs for permission status
4. Try reinstalling the app

### DateTimePicker Not Showing
1. Ensure you're using the native build (not Expo Go)
2. Check that the plugin is properly configured
3. Restart the development server

### Audio Not Playing
1. Check device volume and silent mode
2. Verify audio permissions in Settings
3. Check console logs for audio errors
4. Ensure you're on a physical device

### Tasks Not Syncing
1. Check AsyncStorage permissions
2. Verify network connectivity (if using cloud sync)
3. Check console logs for storage errors
4. Clear app data and restart

## Testing Checklist

Before deploying, test these features:

- [ ] Daily Meeze task creation and editing
- [ ] Weekly Calendar event management
- [ ] Task linking between Daily Meeze and Calendar
- [ ] Task movement between days
- [ ] Timer creation and notifications
- [ ] Habit tracking and deletion
- [ ] Routine creation and management
- [ ] Honesty Log entries
- [ ] Context switching (Work/Home)
- [ ] Data persistence across app restarts

## Performance Tips

1. **Use Development Builds for Testing**
   - Faster than rebuilding for each change
   - Better debugging capabilities

2. **Test on Physical Devices**
   - Simulators don't support all features
   - Real device performance is different

3. **Monitor Console Logs**
   - Check for permission issues
   - Watch for storage errors
   - Monitor notification scheduling

4. **Clear Cache When Needed**
   ```bash
   npx expo start --clear
   ```

## Common Issues Fixed

### ✅ Icons Not Showing
- **Issue**: Icons missing in Daily Meeze task actions
- **Fix**: Verified IconSymbol component mappings
- **Status**: Working in EAS builds

### ✅ Time Picker Broken
- **Issue**: DateTimePicker not displaying
- **Fix**: Added proper plugin configuration
- **Status**: Working with native picker

### ✅ Delete Functionality
- **Issue**: Delete buttons not working in Habits/Routines
- **Fix**: Verified Alert.alert implementation
- **Status**: Working in EAS builds

### ✅ Link Button Broken
- **Issue**: Task linking not working
- **Fix**: Improved sync logic and error handling
- **Status**: Working with proper date handling

### ✅ Notifications Not Firing
- **Issue**: Timer notifications not appearing
- **Fix**: Added device detection and proper permissions
- **Status**: Working on physical devices

## Next Steps

1. **Build for Testing**
   ```bash
   eas build --profile preview --platform all
   ```

2. **Submit to Stores** (when ready)
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

3. **Set Up OTA Updates**
   ```bash
   eas update --branch production
   ```

## Support

If you encounter issues:
1. Check console logs for errors
2. Verify all permissions are granted
3. Test on a physical device
4. Review the Expo documentation: https://docs.expo.dev/
5. Check EAS Build logs: https://expo.dev/accounts/[your-account]/projects/[your-project]/builds

## Environment Variables

The app now supports environment-specific configuration:
- `EXPO_PUBLIC_ENV=development` - Development builds
- `EXPO_PUBLIC_ENV=preview` - Preview builds
- `EXPO_PUBLIC_ENV=production` - Production builds

These are automatically set based on your build profile in eas.json.
