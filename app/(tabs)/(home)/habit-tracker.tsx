
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform, Modal, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Habit {
  id: string;
  name: string;
  description: string;
  context: 'work' | 'home';
  createdAt: string;
}

interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

export default function HabitTrackerScreen() {
  const [context, setContext] = useState<'work' | 'home'>('work');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week

  useEffect(() => {
    loadHabits();
    loadHabitLogs();
  }, [context]);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem(`habits-${context}`);
      if (stored) {
        setHabits(JSON.parse(stored));
        console.log('Loaded habits for', context);
      } else {
        setHabits([]);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadHabitLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(`habit-logs-${context}`);
      if (stored) {
        setHabitLogs(JSON.parse(stored));
        console.log('Loaded habit logs for', context);
      } else {
        setHabitLogs([]);
      }
    } catch (error) {
      console.error('Error loading habit logs:', error);
    }
  };

  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem(`habits-${context}`, JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
      console.log('Saved habits for', context);
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const saveHabitLogs = async (updatedLogs: HabitLog[]) => {
    try {
      await AsyncStorage.setItem(`habit-logs-${context}`, JSON.stringify(updatedLogs));
      setHabitLogs(updatedLogs);
      console.log('Saved habit logs for', context);
    } catch (error) {
      console.error('Error saving habit logs:', error);
    }
  };

  const addHabit = () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName,
      description: habitDescription,
      context: context,
      createdAt: new Date().toISOString(),
    };

    const updatedHabits = [...habits, newHabit];
    saveHabits(updatedHabits);
    
    setHabitName('');
    setHabitDescription('');
    setShowAddModal(false);
  };

  const deleteHabit = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedHabits = habits.filter(h => h.id !== habitId);
            saveHabits(updatedHabits);
            
            // Also remove logs for this habit
            const updatedLogs = habitLogs.filter(log => log.habitId !== habitId);
            saveHabitLogs(updatedLogs);
          },
        },
      ]
    );
  };

  const toggleHabit = (habitId: string, date: string) => {
    const existingLog = habitLogs.find(
      log => log.habitId === habitId && log.date === date
    );

    let updatedLogs: HabitLog[];
    if (existingLog) {
      updatedLogs = habitLogs.map(log =>
        log.habitId === habitId && log.date === date
          ? { ...log, completed: !log.completed }
          : log
      );
    } else {
      updatedLogs = [
        ...habitLogs,
        { habitId, date, completed: true }
      ];
    }

    saveHabitLogs(updatedLogs);
  };

  const isHabitCompleted = (habitId: string, date: string): boolean => {
    const log = habitLogs.find(
      log => log.habitId === habitId && log.date === date
    );
    return log?.completed || false;
  };

  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (weekOffset * 7);
    
    const sunday = new Date(today.setDate(diff));
    const dates: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDayLabel = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDateLabel = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getHabitStreak = (habitId: string): number => {
    const sortedLogs = habitLogs
      .filter(log => log.habitId === habitId && log.completed)
      .map(log => new Date(log.date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedLogs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i]);
      logDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);
      
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getCompletionRate = (habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const completedDays = habitLogs.filter(
      log => log.habitId === habitId && log.completed
    ).length;

    return Math.round((completedDays / daysSinceCreation) * 100);
  };

  const weekDates = getWeekDates(selectedWeek);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Habit Tracker",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <IconSymbol name="checkmark.circle.fill" color={colors.success} size={32} />
          <Text style={commonStyles.title}>Habit Tracker</Text>
          <Text style={commonStyles.textSecondary}>
            Build consistency and track your progress
          </Text>
        </View>

        {/* Context Tabs */}
        <View style={styles.contextTabs}>
          <Pressable
            style={[
              styles.contextTab,
              context === 'work' && styles.contextTabActive
            ]}
            onPress={() => setContext('work')}
          >
            <IconSymbol 
              name="briefcase.fill" 
              color={context === 'work' ? '#ffffff' : colors.textSecondary} 
              size={20} 
            />
            <Text style={[
              styles.contextTabText,
              context === 'work' && styles.contextTabTextActive
            ]}>
              Work
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.contextTab,
              context === 'home' && styles.contextTabActive
            ]}
            onPress={() => setContext('home')}
          >
            <IconSymbol 
              name="house.fill" 
              color={context === 'home' ? '#ffffff' : colors.textSecondary} 
              size={20} 
            />
            <Text style={[
              styles.contextTabText,
              context === 'home' && styles.contextTabTextActive
            ]}>
              Home
            </Text>
          </Pressable>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <Pressable
            style={styles.weekNavButton}
            onPress={() => setSelectedWeek(selectedWeek - 1)}
          >
            <IconSymbol name="chevron.left" color={colors.primary} size={24} />
          </Pressable>
          <Text style={styles.weekLabel}>
            {selectedWeek === 0 ? 'This Week' : `${Math.abs(selectedWeek)} week${Math.abs(selectedWeek) !== 1 ? 's' : ''} ${selectedWeek < 0 ? 'ago' : 'ahead'}`}
          </Text>
          <Pressable
            style={styles.weekNavButton}
            onPress={() => setSelectedWeek(selectedWeek + 1)}
            disabled={selectedWeek >= 0}
          >
            <IconSymbol 
              name="chevron.right" 
              color={selectedWeek >= 0 ? colors.textSecondary : colors.primary} 
              size={24} 
            />
          </Pressable>
        </View>

        <Pressable 
          style={[buttonStyles.primary, { marginHorizontal: 16, marginBottom: 16 }]} 
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus" color="#ffffff" size={20} />
          <Text style={[buttonStyles.text, { marginLeft: 8 }]}>Add New Habit</Text>
        </Pressable>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="checkmark.circle" color={colors.textSecondary} size={64} />
            <Text style={styles.emptyStateText}>No habits yet</Text>
            <Text style={commonStyles.textSecondary}>
              Start tracking your first habit today
            </Text>
          </View>
        ) : (
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.tableContainer}>
              {/* Week Header */}
              <View style={styles.weekHeader}>
                <View style={styles.habitNameColumn}>
                  <Text style={styles.weekHeaderText}>Habit</Text>
                </View>
                {weekDates.map((date, index) => (
                  <View key={index} style={styles.dayColumn}>
                    <Text style={styles.dayLabel}>{formatDayLabel(date)}</Text>
                    <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
                  </View>
                ))}
              </View>

              {/* Habits Grid */}
              {habits.map((habit) => (
                <View key={habit.id} style={styles.habitRow}>
                  <View style={styles.habitNameColumn}>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <View style={styles.habitStats}>
                        <View style={styles.statBadge}>
                          <IconSymbol name="flame.fill" color={colors.accent} size={14} />
                          <Text style={styles.statText}>{getHabitStreak(habit.id)}</Text>
                        </View>
                        <View style={styles.statBadge}>
                          <Text style={styles.statText}>{getCompletionRate(habit.id)}%</Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={styles.habitDeleteButton}
                      onPress={() => deleteHabit(habit.id)}
                    >
                      <IconSymbol name="trash" color={colors.secondary} size={16} />
                    </Pressable>
                  </View>
                  {weekDates.map((date, index) => {
                    const dateString = formatDate(date);
                    const isCompleted = isHabitCompleted(habit.id, dateString);
                    const isToday = formatDate(new Date()) === dateString;
                    
                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.dayColumn,
                          styles.habitCheckbox,
                          isCompleted && styles.habitCheckboxCompleted,
                          isToday && styles.habitCheckboxToday,
                        ]}
                        onPress={() => toggleHabit(habit.id, dateString)}
                      >
                        {isCompleted && (
                          <IconSymbol name="checkmark" color="#ffffff" size={20} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Add Habit Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Add Habit</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <TextInput
                style={commonStyles.input}
                placeholder="Habit Name"
                placeholderTextColor={colors.textSecondary}
                value={habitName}
                onChangeText={setHabitName}
              />

              <TextInput
                style={commonStyles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={habitDescription}
                onChangeText={setHabitDescription}
              />

              <Pressable style={buttonStyles.primary} onPress={addHabit}>
                <Text style={buttonStyles.text}>Add Habit</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  contextTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  contextTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  contextTabActive: {
    backgroundColor: colors.primary,
  },
  contextTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  contextTabTextActive: {
    color: '#ffffff',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  weekNavButton: {
    padding: 8,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tableContainer: {
    minWidth: '100%',
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  weekHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  habitNameColumn: {
    width: 140,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dateLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  habitRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  habitStats: {
    flexDirection: 'row',
    gap: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  habitDeleteButton: {
    padding: 4,
  },
  habitCheckbox: {
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  habitCheckboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  habitCheckboxToday: {
    borderColor: colors.primary,
    borderWidth: 3,
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
