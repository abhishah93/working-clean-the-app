
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Modal, Platform, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";

interface Timer {
  id: string;
  name: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  isRunning: boolean;
}

export default function TimersScreen() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [timerName, setTimerName] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('25');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.isRunning && timer.remaining > 0) {
            const newRemaining = timer.remaining - 1;
            if (newRemaining === 0) {
              Alert.alert('Timer Complete!', `${timer.name} has finished`);
              return { ...timer, remaining: 0, isRunning: false };
            }
            return { ...timer, remaining: newRemaining };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTimer = () => {
    if (!timerName.trim()) {
      Alert.alert('Error', 'Please enter a timer name');
      return;
    }

    const minutes = parseInt(timerMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    const newTimer: Timer = {
      id: Date.now().toString(),
      name: timerName,
      duration: minutes * 60,
      remaining: minutes * 60,
      isRunning: false,
    };

    setTimers([...timers, newTimer]);
    setModalVisible(false);
    setTimerName('');
    setTimerMinutes('25');
    console.log('Added new timer:', newTimer.name);
  };

  const toggleTimer = (id: string) => {
    setTimers(prevTimers =>
      prevTimers.map(timer =>
        timer.id === id ? { ...timer, isRunning: !timer.isRunning } : timer
      )
    );
  };

  const resetTimer = (id: string) => {
    setTimers(prevTimers =>
      prevTimers.map(timer =>
        timer.id === id ? { ...timer, remaining: timer.duration, isRunning: false } : timer
      )
    );
  };

  const deleteTimer = (id: string) => {
    Alert.alert(
      'Delete Timer',
      'Are you sure you want to delete this timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTimers(prevTimers => prevTimers.filter(timer => timer.id !== id));
            console.log('Deleted timer');
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (timer: Timer) => {
    return ((timer.duration - timer.remaining) / timer.duration) * 100;
  };

  const presetTimers = [
    { name: 'Pomodoro', minutes: 25 },
    { name: 'Short Break', minutes: 5 },
    { name: 'Long Break', minutes: 15 },
    { name: 'Deep Work', minutes: 90 },
  ];

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
            <Text style={commonStyles.title}>Built-in Timers</Text>
            <Text style={commonStyles.textSecondary}>
              Schedule and manage your work sessions
            </Text>
          </View>

          <Pressable 
            style={[buttonStyles.primary, styles.addButton]}
            onPress={() => setModalVisible(true)}
          >
            <IconSymbol name="plus" color="#ffffff" size={20} />
            <Text style={[buttonStyles.text, { marginLeft: 8 }]}>Add Timer</Text>
          </Pressable>

          {timers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="timer" color={colors.textSecondary} size={48} />
              <Text style={styles.emptyStateText}>No timers yet</Text>
              <Text style={commonStyles.textSecondary}>
                Add a timer to get started
              </Text>
            </View>
          ) : (
            timers.map((timer) => (
              <View key={timer.id} style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <Text style={styles.timerName}>{timer.name}</Text>
                  <Pressable onPress={() => deleteTimer(timer.id)}>
                    <IconSymbol name="trash" color={colors.secondary} size={20} />
                  </Pressable>
                </View>

                <Text style={styles.timerDisplay}>{formatTime(timer.remaining)}</Text>

                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${getProgress(timer)}%` }
                    ]} 
                  />
                </View>

                <View style={styles.timerControls}>
                  <Pressable
                    style={[styles.controlButton, { backgroundColor: timer.isRunning ? colors.accent : colors.primary }]}
                    onPress={() => toggleTimer(timer.id)}
                  >
                    <IconSymbol 
                      name={timer.isRunning ? "pause.fill" : "play.fill"} 
                      color="#ffffff" 
                      size={20} 
                    />
                  </Pressable>

                  <Pressable
                    style={[styles.controlButton, { backgroundColor: colors.textSecondary }]}
                    onPress={() => resetTimer(timer.id)}
                  >
                    <IconSymbol name="arrow.clockwise" color="#ffffff" size={20} />
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <View style={styles.presetsContainer}>
            <Text style={commonStyles.sectionTitle}>Quick Presets</Text>
            <View style={styles.presetsGrid}>
              {presetTimers.map((preset) => (
                <Pressable
                  key={preset.name}
                  style={styles.presetCard}
                  onPress={() => {
                    setTimerName(preset.name);
                    setTimerMinutes(preset.minutes.toString());
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetDuration}>{preset.minutes} min</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Add Timer</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <TextInput
                style={commonStyles.input}
                placeholder="Timer Name"
                placeholderTextColor={colors.textSecondary}
                value={timerName}
                onChangeText={setTimerName}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Duration (minutes)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={timerMinutes}
                onChangeText={setTimerMinutes}
              />

              <Pressable style={buttonStyles.primary} onPress={addTimer}>
                <Text style={buttonStyles.text}>Create Timer</Text>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  presetsContainer: {
    marginTop: 24,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  presetDuration: {
    fontSize: 14,
    color: colors.textSecondary,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
