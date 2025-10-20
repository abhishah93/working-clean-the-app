
import React, { useState, useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Modal, Platform, Alert, AppState } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import { notificationService } from "@/utils/notificationService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface Timer {
  id: string;
  name: string;
  duration: number; // in seconds
  remaining: number;
  isRunning: boolean;
  notificationId?: string;
  startedAt?: number; // timestamp when timer started
}

export default function TimersScreen() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timerName, setTimerName] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('25');
  const [seconds, setSeconds] = useState('0');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    initializeNotifications();
    loadTimers();

    // Handle app state changes for background timer support
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground, sync timers
        console.log('App came to foreground, syncing timers');
        syncTimersAfterBackground();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Save timers whenever they change
    saveTimers();

    // Update running timers every second
    const interval = setInterval(() => {
      setTimers(prevTimers =>
        prevTimers.map(timer => {
          if (timer.isRunning && timer.remaining > 0) {
            const newRemaining = timer.remaining - 1;
            if (newRemaining === 0) {
              // Timer completed - play alarm sound
              console.log('Timer completed:', timer.name);
              playAlarmSound();
              return { ...timer, remaining: 0, isRunning: false, startedAt: undefined };
            }
            return { ...timer, remaining: newRemaining };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers.length]);

  const playAlarmSound = async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        // Using a system sound - you can replace this with a custom sound file
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, volume: 1.0 }
      );
      
      soundRef.current = sound;

      // Unload sound after it finishes playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });

      console.log('Playing alarm sound');
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  const loadTimers = async () => {
    try {
      const stored = await AsyncStorage.getItem('timers');
      if (stored) {
        const loadedTimers = JSON.parse(stored);
        // Sync any running timers that were running in background
        const syncedTimers = loadedTimers.map((timer: Timer) => {
          if (timer.isRunning && timer.startedAt) {
            const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
            const newRemaining = Math.max(0, timer.remaining - elapsed);
            return {
              ...timer,
              remaining: newRemaining,
              isRunning: newRemaining > 0,
            };
          }
          return timer;
        });
        setTimers(syncedTimers);
        console.log('Loaded and synced timers');
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const saveTimers = async () => {
    try {
      await AsyncStorage.setItem('timers', JSON.stringify(timers));
    } catch (error) {
      console.error('Error saving timers:', error);
    }
  };

  const syncTimersAfterBackground = () => {
    setTimers(prevTimers =>
      prevTimers.map(timer => {
        if (timer.isRunning && timer.startedAt) {
          const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
          const newRemaining = Math.max(0, timer.remaining - elapsed);
          return {
            ...timer,
            remaining: newRemaining,
            isRunning: newRemaining > 0,
            startedAt: newRemaining > 0 ? Date.now() : undefined,
          };
        }
        return timer;
      })
    );
  };

  const initializeNotifications = async () => {
    // Only initialize once
    if (hasInitialized.current) {
      console.log('Notifications already initialized');
      return;
    }

    const initialized = await notificationService.initialize();
    setNotificationsEnabled(initialized);
    hasInitialized.current = true;
    
    if (!initialized) {
      console.log('Notifications not available - timers will still work but without background alerts');
      // Don't show alert immediately - only show if user tries to use a timer
    } else {
      console.log('Notifications initialized successfully');
    }
  };

  const addTimer = () => {
    if (!timerName.trim()) {
      Alert.alert('Error', 'Please enter a timer name');
      return;
    }

    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    const secondsNum = parseInt(seconds) || 0;

    const duration = (hoursNum * 3600) + (minutesNum * 60) + secondsNum;
    
    if (duration <= 0) {
      Alert.alert('Error', 'Please set a duration greater than 0');
      return;
    }

    const newTimer: Timer = {
      id: Date.now().toString(),
      name: timerName,
      duration,
      remaining: duration,
      isRunning: false,
    };

    setTimers([...timers, newTimer]);
    setTimerName('');
    setHours('0');
    setMinutes('25');
    setSeconds('0');
    setShowAddModal(false);
  };

  const toggleTimer = async (id: string) => {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    const newIsRunning = !timer.isRunning;

    // Show notification warning only when starting a timer if notifications are disabled
    if (newIsRunning && !notificationsEnabled) {
      Alert.alert(
        'Notifications Disabled',
        'Timer will run, but you won\'t receive an alert when it completes. Enable notifications in your device settings for alerts.',
        [
          { text: 'OK', onPress: () => {
            // Continue starting the timer
            startTimer(id);
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    startTimer(id);
  };

  const startTimer = async (id: string) => {
    setTimers(prevTimers =>
      prevTimers.map(timer => {
        if (timer.id === id) {
          const newIsRunning = !timer.isRunning;
          
          if (newIsRunning && notificationsEnabled) {
            // Schedule notification for when timer completes
            notificationService.scheduleTimerNotification(timer.name, timer.remaining)
              .then(notificationId => {
                if (notificationId) {
                  console.log('Scheduled notification for timer:', timer.name);
                  setTimers(prev => prev.map(t => 
                    t.id === id ? { ...t, notificationId, startedAt: Date.now() } : t
                  ));
                }
              });
          } else if (!newIsRunning && timer.notificationId) {
            // Cancel notification if timer is paused
            notificationService.cancelNotification(timer.notificationId);
          }
          
          return { 
            ...timer, 
            isRunning: newIsRunning,
            startedAt: newIsRunning ? Date.now() : undefined,
          };
        }
        return timer;
      })
    );
  };

  const resetTimer = async (id: string) => {
    setTimers(prevTimers =>
      prevTimers.map(timer => {
        if (timer.id === id) {
          if (timer.notificationId) {
            notificationService.cancelNotification(timer.notificationId);
          }
          return {
            ...timer,
            remaining: timer.duration,
            isRunning: false,
            notificationId: undefined,
            startedAt: undefined,
          };
        }
        return timer;
      })
    );
  };

  const deleteTimer = async (id: string) => {
    const timer = timers.find(t => t.id === id);
    if (timer?.notificationId) {
      await notificationService.cancelNotification(timer.notificationId);
    }
    setTimers(timers.filter(t => t.id !== id));
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (timer: Timer): number => {
    return ((timer.duration - timer.remaining) / timer.duration) * 100;
  };

  const setPresetTime = (h: number, m: number, s: number) => {
    setHours(h.toString());
    setMinutes(m.toString());
    setSeconds(s.toString());
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Timers",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconSymbol name="timer" color={colors.secondary} size={32} />
            <Text style={commonStyles.title}>Focus Timers</Text>
            <Text style={commonStyles.textSecondary}>
              Set timers for focused work sessions
            </Text>
            {notificationsEnabled && (
              <View style={styles.notificationBadge}>
                <IconSymbol name="bell.fill" color={colors.success} size={16} />
                <Text style={styles.notificationText}>Background timers enabled</Text>
              </View>
            )}
          </View>

          <Pressable 
            style={[buttonStyles.primary, { marginBottom: 24 }]} 
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" color="#ffffff" size={20} />
            <Text style={[buttonStyles.text, { marginLeft: 8 }]}>Add New Timer</Text>
          </Pressable>

          {timers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="timer" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyStateText}>No timers yet</Text>
              <Text style={commonStyles.textSecondary}>
                Create your first focus timer
              </Text>
            </View>
          ) : (
            timers.map((timer) => (
              <View key={timer.id} style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <Text style={styles.timerName}>{timer.name}</Text>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteTimer(timer.id)}
                  >
                    <IconSymbol name="trash" color={colors.secondary} size={20} />
                  </Pressable>
                </View>

                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${getProgress(timer)}%` }
                    ]} 
                  />
                </View>

                <Text style={styles.timerDisplay}>{formatTime(timer.remaining)}</Text>

                <View style={styles.timerActions}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      timer.isRunning ? styles.pauseButton : styles.playButton
                    ]}
                    onPress={() => toggleTimer(timer.id)}
                  >
                    <IconSymbol 
                      name={timer.isRunning ? "pause.fill" : "play.fill"} 
                      color="#ffffff" 
                      size={24} 
                    />
                    <Text style={styles.actionButtonText}>
                      {timer.isRunning ? 'Pause' : 'Start'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.resetButton]}
                    onPress={() => resetTimer(timer.id)}
                  >
                    <IconSymbol name="arrow.clockwise" color="#ffffff" size={24} />
                    <Text style={styles.actionButtonText}>Reset</Text>
                  </Pressable>
                </View>

                {timer.remaining === 0 && (
                  <View style={styles.completedBanner}>
                    <IconSymbol name="checkmark.circle.fill" color="#ffffff" size={20} />
                    <Text style={styles.completedText}>Timer Complete! 🔔</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Timer Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Add Timer</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Timer Name (e.g., Focus Session)"
                  placeholderTextColor={colors.textSecondary}
                  value={timerName}
                  onChangeText={setTimerName}
                />

                <Text style={styles.inputLabel}>Set Duration:</Text>
                
                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>Hours</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={hours}
                      onChangeText={setHours}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>Minutes</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="25"
                      placeholderTextColor={colors.textSecondary}
                      value={minutes}
                      onChangeText={setMinutes}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>Seconds</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={seconds}
                      onChangeText={setSeconds}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>

                <View style={styles.presetContainer}>
                  <Text style={styles.presetLabel}>Quick Presets:</Text>
                  <View style={styles.presetButtons}>
                    <Pressable
                      style={styles.presetButton}
                      onPress={() => setPresetTime(0, 5, 0)}
                    >
                      <Text style={styles.presetButtonText}>5 min</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetButton}
                      onPress={() => setPresetTime(0, 15, 0)}
                    >
                      <Text style={styles.presetButtonText}>15 min</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetButton}
                      onPress={() => setPresetTime(0, 25, 0)}
                    >
                      <Text style={styles.presetButtonText}>25 min</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetButton}
                      onPress={() => setPresetTime(0, 0, 30)}
                    >
                      <Text style={styles.presetButtonText}>30 sec</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetButton}
                      onPress={() => setPresetTime(0, 1, 30)}
                    >
                      <Text style={styles.presetButtonText}>1:30</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetButton}
                      onPress={() => setPresetTime(1, 0, 0)}
                    >
                      <Text style={styles.presetButtonText}>1 hour</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.selectedTimeDisplay}>
                  <Text style={styles.selectedTimeLabel}>Selected Time:</Text>
                  <Text style={styles.selectedTimeValue}>
                    {parseInt(hours) > 0 && `${parseInt(hours)}h `}
                    {parseInt(minutes) > 0 && `${parseInt(minutes)}m `}
                    {parseInt(seconds) > 0 && `${parseInt(seconds)}s`}
                    {parseInt(hours) === 0 && parseInt(minutes) === 0 && parseInt(seconds) === 0 && '0s'}
                  </Text>
                </View>
              </ScrollView>

              <Pressable style={buttonStyles.primary} onPress={addTimer}>
                <Text style={buttonStyles.text}>Add Timer</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS !== 'ios' ? 100 : 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  notificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  timerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  timerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  playButton: {
    backgroundColor: colors.success,
  },
  pauseButton: {
    backgroundColor: colors.accent,
  },
  resetButton: {
    backgroundColor: colors.textSecondary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  timeInputContainer: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: colors.highlight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    minWidth: 70,
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
  },
  presetContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: colors.highlight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedTimeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
