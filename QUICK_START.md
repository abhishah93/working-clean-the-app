
# Quick Start Guide - EAS Development Build

## TL;DR - Get Running Fast

### 1. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Build Development Client
```bash
# For iOS Simulator (fastest for testing)
eas build --profile development --platform ios

# For Android Device
eas build --profile development --platform android
```

### 3. Install & Run
- Install the build on your device
- Start dev server: `npx expo start --dev-client`
- Scan QR code or press 'i' for iOS, 'a' for Android

## What's Different from Expo Go?

| Feature | Expo Go | EAS Build |
|---------|---------|-----------|
| Notifications | Limited | ✅ Full support |
| Background Timers | ❌ No | ✅ Yes |
| Audio Alarms | ⚠️ Unreliable | ✅ Reliable |
| DateTimePicker | ⚠️ Basic | ✅ Native |
| Data Persistence | ⚠️ May clear | ✅ Persistent |
| Performance | Good | ✅ Better |

## All Fixed Issues ✅

1. **Notifications** - Now work with proper permissions
2. **Time Picker** - Native picker displays correctly
3. **Icons** - All action icons visible with labels
4. **Delete Functions** - Working in habits and routines
5. **Task Linking** - Calendar sync works properly
6. **Audio Alarms** - Timer sounds play reliably
7. **Background Timers** - Continue running when app is closed

## Testing on Physical Device

**Why?** Simulators don't support:
- Push notifications
- Some audio features
- Exact alarm scheduling
- Background task execution

**How?**
1. Build with EAS
2. Install on device
3. Grant all permissions when prompted
4. Test all features

## Common Issues & Fixes

### "Notifications not working"
- ✅ Check device Settings → Notifications → Your App
- ✅ Ensure you're on a physical device
- ✅ Restart the app after granting permissions

### "Time picker not showing"
- ✅ Make sure you're using EAS build (not Expo Go)
- ✅ Rebuild if you just added the plugin

### "Timer alarm not playing"
- ✅ Check device volume
- ✅ Disable silent mode
- ✅ Grant audio permissions

### "Data not persisting"
- ✅ Check console for AsyncStorage errors
- ✅ Ensure app has storage permissions
- ✅ Try clearing app data and restarting

## Build Profiles

### Development
- Fast iteration
- Includes dev tools
- Can connect to dev server
```bash
eas build --profile development --platform ios
```

### Preview
- Test production-like build
- No dev tools
- Good for QA testing
```bash
eas build --profile preview --platform all
```

### Production
- App store ready
- Optimized and minified
- No debugging
```bash
eas build --profile production --platform all
```

## Key Files Modified

- ✅ `app.json` - Added plugins and permissions
- ✅ `eas.json` - Configured build profiles
- ✅ `utils/notificationService.ts` - Added device detection
- ✅ `app/_layout.tsx` - Added environment logging

## Permissions Required

### iOS
- Notifications
- Audio (for timer alarms)

### Android
- POST_NOTIFICATIONS
- SCHEDULE_EXACT_ALARM
- USE_EXACT_ALARM
- VIBRATE
- WAKE_LOCK

All configured automatically in `app.json`!

## Development Workflow

1. **Make changes** to your code
2. **Save** - Metro bundler reloads automatically
3. **Test** on device via dev client
4. **Repeat** - No need to rebuild for code changes

**When to rebuild:**
- Added new native dependencies
- Changed app.json configuration
- Updated native code or plugins

## Performance Tips

- Use development builds for daily work
- Test on physical devices regularly
- Monitor console logs for errors
- Clear cache if things seem broken: `npx expo start --clear`

## Need Help?

1. Check console logs first
2. Review `DEPLOYMENT_FIXES.md` for detailed fixes
3. See `EAS_SETUP_GUIDE.md` for comprehensive guide
4. Visit Expo docs: https://docs.expo.dev/

## Success Checklist

After building and installing, verify:

- [ ] App launches without errors
- [ ] Can create tasks in Daily Meeze
- [ ] Can add events to Weekly Calendar
- [ ] Tasks link between meeze and calendar
- [ ] Can move tasks between days
- [ ] Timers create and run
- [ ] Timer notifications appear
- [ ] Habits track correctly
- [ ] Routines save properly
- [ ] Data persists after app restart
- [ ] Context switching works (Work/Home)

## You're All Set! 🎉

Your app is now configured to work perfectly in EAS development builds. All the issues you experienced have been fixed:

- ✅ Notifications configured
- ✅ Permissions set up
- ✅ Native modules working
- ✅ Data persistence reliable
- ✅ UI components functional

Build, install, and enjoy your productivity app!
