
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform, Modal, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TaskLog {
  id: string;
  date: string;
  taskName: string;
  timeSpent: number; // in minutes
  type: 'task' | 'break';
}

interface HonestyEntry {
  id: string;
  date: string;
  content: string;
}

interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  context: 'work' | 'home';
}

export default function HonestyLogScreen() {
  const [entries, setEntries] = useState<HonestyEntry[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  
  const [showTaskLogModal, setShowTaskLogModal] = useState(false);
  const [logType, setLogType] = useState<'task' | 'break'>('task');
  const [taskName, setTaskName] = useState('');
  const [timeSpent, setTimeSpent] = useState('');

  useEffect(() => {
    loadEntries();
    loadTaskLogs();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem('honesty-log');
      if (stored) {
        setEntries(JSON.parse(stored));
        console.log('Loaded honesty log entries');
      }
    } catch (error) {
      console.error('Error loading honesty log:', error);
    }
  };

  const loadTaskLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem('task-logs');
      if (stored) {
        setTaskLogs(JSON.parse(stored));
        console.log('Loaded task logs');
      }
    } catch (error) {
      console.error('Error loading task logs:', error);
    }
  };

  const saveEntry = async () => {
    if (!newEntry.trim()) {
      return;
    }

    const entry: HonestyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newEntry,
    };

    const updatedEntries = [entry, ...entries];
    
    try {
      await AsyncStorage.setItem('honesty-log', JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      setNewEntry('');
      console.log('Saved honesty log entry');
    } catch (error) {
      console.error('Error saving honesty log:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    
    try {
      await AsyncStorage.setItem('honesty-log', JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      console.log('Deleted honesty log entry');
    } catch (error) {
      console.error('Error deleting honesty log:', error);
    }
  };

  const saveTaskLog = async () => {
    if (!taskName.trim() || !timeSpent.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const minutes = parseInt(timeSpent);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Error', 'Please enter a valid time in minutes');
      return;
    }

    const log: TaskLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      taskName: taskName,
      timeSpent: minutes,
      type: logType,
    };

    const updatedLogs = [log, ...taskLogs];
    
    try {
      await AsyncStorage.setItem('task-logs', JSON.stringify(updatedLogs));
      setTaskLogs(updatedLogs);
      setTaskName('');
      setTimeSpent('');
      setShowTaskLogModal(false);
      console.log('Saved task log');
    } catch (error) {
      console.error('Error saving task log:', error);
    }
  };

  const deleteTaskLog = async (id: string) => {
    const updatedLogs = taskLogs.filter(l => l.id !== id);
    
    try {
      await AsyncStorage.setItem('task-logs', JSON.stringify(updatedLogs));
      setTaskLogs(updatedLogs);
      console.log('Deleted task log');
    } catch (error) {
      console.error('Error deleting task log:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTotalTimeToday = () => {
    const today = new Date().toDateString();
    const todayLogs = taskLogs.filter(log => {
      const logDate = new Date(log.date).toDateString();
      return logDate === today && log.type === 'task';
    });
    return todayLogs.reduce((sum, log) => sum + log.timeSpent, 0);
  };

  const getTotalBreaksToday = () => {
    const today = new Date().toDateString();
    const todayBreaks = taskLogs.filter(log => {
      const logDate = new Date(log.date).toDateString();
      return logDate === today && log.type === 'break';
    });
    return todayBreaks.reduce((sum, log) => sum + log.timeSpent, 0);
  };

  const getWeeklyStats = async () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekLogs = taskLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekAgo && logDate <= today;
    });

    const workTime = weekLogs
      .filter(log => log.type === 'task')
      .reduce((sum, log) => sum + log.timeSpent, 0);
    
    const breakTime = weekLogs
      .filter(log => log.type === 'break')
      .reduce((sum, log) => sum + log.timeSpent, 0);

    // Load habit data
    const workHabits = await loadHabitsForContext('work');
    const homeHabits = await loadHabitsForContext('home');
    const workHabitLogs = await loadHabitLogsForContext('work');
    const homeHabitLogs = await loadHabitLogsForContext('home');

    const allHabits = [...workHabits, ...homeHabits];
    const allHabitLogs = [...workHabitLogs, ...homeHabitLogs];

    const habitStats = allHabits.map(habit => {
      const weekCompletions = allHabitLogs.filter(log => {
        const logDate = new Date(log.date);
        return log.habitId === habit.id && 
               log.completed && 
               logDate >= weekAgo && 
               logDate <= today;
      }).length;

      return {
        name: habit.name,
        completions: weekCompletions,
        rate: Math.round((weekCompletions / 7) * 100)
      };
    });

    return {
      workTime,
      breakTime,
      totalTime: workTime + breakTime,
      habitStats,
      daysTracked: 7
    };
  };

  const loadHabitsForContext = async (context: 'work' | 'home'): Promise<Habit[]> => {
    try {
      const stored = await AsyncStorage.getItem(`habits-${context}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  };

  const loadHabitLogsForContext = async (context: 'work' | 'home'): Promise<HabitLog[]> => {
    try {
      const stored = await AsyncStorage.getItem(`habit-logs-${context}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading habit logs:', error);
      return [];
    }
  };

  const WeeklyReportModal = () => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
      if (showWeeklyReport) {
        getWeeklyStats().then(setStats);
      }
    }, [showWeeklyReport]);

    if (!stats) return null;

    return (
      <Modal
        visible={showWeeklyReport}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWeeklyReport(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.modalHeader}>
              <Text style={commonStyles.title}>Weekly Report</Text>
              <Pressable onPress={() => setShowWeeklyReport(false)}>
                <IconSymbol name="xmark" color={colors.text} size={24} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.reportCard}>
                <Text style={styles.reportSectionTitle}>⏱️ Time Tracking</Text>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Work Time:</Text>
                  <Text style={styles.reportValue}>{formatTime(stats.workTime)}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Break Time:</Text>
                  <Text style={styles.reportValue}>{formatTime(stats.breakTime)}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Total Time:</Text>
                  <Text style={[styles.reportValue, styles.reportValueBold]}>
                    {formatTime(stats.totalTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.reportCard}>
                <Text style={styles.reportSectionTitle}>✅ Habit Completion</Text>
                {stats.habitStats.length === 0 ? (
                  <Text style={commonStyles.textSecondary}>No habits tracked this week</Text>
                ) : (
                  stats.habitStats.map((habit: any, index: number) => (
                    <View key={index} style={styles.habitReportRow}>
                      <View style={styles.habitReportInfo}>
                        <Text style={styles.habitReportName}>{habit.name}</Text>
                        <Text style={styles.habitReportCount}>
                          {habit.completions}/7 days
                        </Text>
                      </View>
                      <View style={styles.habitReportProgress}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${habit.rate}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.habitReportRate}>{habit.rate}%</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.reportCard}>
                <Text style={styles.reportSectionTitle}>📊 Summary</Text>
                <Text style={commonStyles.text}>
                  This week you logged {formatTime(stats.workTime)} of focused work time
                  {stats.habitStats.length > 0 && ` and completed ${stats.habitStats.reduce((sum: number, h: any) => sum + h.completions, 0)} habit check-ins`}.
                  Keep up the great work!
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Honesty Log",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconSymbol name="book.fill" color={colors.accent} size={32} />
            <Text style={commonStyles.title}>Honesty Log</Text>
            <Text style={commonStyles.textSecondary}>
              Track time on tasks, breaks, and reflections
            </Text>
          </View>

          {/* Weekly Report Button */}
          <Pressable 
            style={[buttonStyles.accent, { marginBottom: 16 }]} 
            onPress={() => setShowWeeklyReport(true)}
          >
            <IconSymbol name="chart.bar.fill" color="#ffffff" size={20} />
            <Text style={[buttonStyles.text, { marginLeft: 8 }]}>View Weekly Report</Text>
          </Pressable>

          {/* Today's Summary */}
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>📊 Today&apos;s Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Work Time</Text>
                <Text style={styles.summaryValue}>{formatTime(getTotalTimeToday())}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Break Time</Text>
                <Text style={styles.summaryValue}>{formatTime(getTotalBreaksToday())}</Text>
              </View>
            </View>
          </View>

          {/* Task/Break Logging */}
          <View style={commonStyles.card}>
            <View style={styles.sectionHeader}>
              <Text style={commonStyles.sectionTitle}>⏱️ Time Tracking</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => setShowTaskLogModal(true)}
              >
                <IconSymbol name="plus" color="#ffffff" size={20} />
              </Pressable>
            </View>
            
            {taskLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="clock" color={colors.textSecondary} size={32} />
                <Text style={styles.emptyStateText}>No time logs yet</Text>
              </View>
            ) : (
              taskLogs.slice(0, 5).map((log) => (
                <View key={log.id} style={styles.taskLogCard}>
                  <View style={styles.taskLogHeader}>
                    <View style={[
                      styles.taskLogBadge,
                      { backgroundColor: log.type === 'task' ? colors.primary : colors.success }
                    ]}>
                      <Text style={styles.taskLogBadgeText}>
                        {log.type === 'task' ? '💼 Task' : '☕ Break'}
                      </Text>
                    </View>
                    <Pressable onPress={() => deleteTaskLog(log.id)}>
                      <IconSymbol name="trash" color={colors.secondary} size={18} />
                    </Pressable>
                  </View>
                  <Text style={styles.taskLogName}>{log.taskName}</Text>
                  <View style={styles.taskLogFooter}>
                    <Text style={styles.taskLogTime}>{formatTime(log.timeSpent)}</Text>
                    <Text style={styles.taskLogDate}>{formatDate(log.date)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Reflection Entry */}
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>📝 New Reflection</Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={6}
              placeholder="Write your honest reflection..."
              placeholderTextColor={colors.textSecondary}
              value={newEntry}
              onChangeText={setNewEntry}
            />
            <Pressable style={buttonStyles.primary} onPress={saveEntry}>
              <Text style={buttonStyles.text}>Add Reflection</Text>
            </Pressable>
          </View>

          {/* Previous Reflections */}
          <View style={styles.entriesContainer}>
            <Text style={commonStyles.sectionTitle}>Previous Reflections</Text>
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="book" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyStateText}>No reflections yet</Text>
                <Text style={commonStyles.textSecondary}>
                  Start by adding your first honest reflection
                </Text>
              </View>
            ) : (
              entries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                    <Pressable onPress={() => deleteEntry(entry.id)}>
                      <IconSymbol name="trash" color={colors.secondary} size={20} />
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  >
                    <Text 
                      style={styles.entryContent}
                      numberOfLines={expandedEntry === entry.id ? undefined : 3}
                    >
                      {entry.content}
                    </Text>
                    {entry.content.length > 150 && (
                      <Text style={styles.readMoreText}>
                        {expandedEntry === entry.id ? 'Show less' : 'Read more'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Task Log Modal */}
        <Modal
          visible={showTaskLogModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTaskLogModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Log Time</Text>
                <Pressable onPress={() => setShowTaskLogModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>Type:</Text>
              <View style={styles.typeSelector}>
                <Pressable
                  style={[
                    styles.typeOption,
                    logType === 'task' && styles.typeOptionActive
                  ]}
                  onPress={() => setLogType('task')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    logType === 'task' && styles.typeOptionTextActive
                  ]}>
                    💼 Task
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeOption,
                    logType === 'break' && styles.typeOptionActive
                  ]}
                  onPress={() => setLogType('break')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    logType === 'break' && styles.typeOptionTextActive
                  ]}>
                    ☕ Break
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={commonStyles.input}
                placeholder={logType === 'task' ? "Task name" : "Break activity"}
                placeholderTextColor={colors.textSecondary}
                value={taskName}
                onChangeText={setTaskName}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Time spent (minutes)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={timeSpent}
                onChangeText={setTimeSpent}
              />

              <Pressable style={buttonStyles.primary} onPress={saveTaskLog}>
                <Text style={buttonStyles.text}>Log Time</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <WeeklyReportModal />
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskLogCard: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskLogBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskLogBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  taskLogName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  taskLogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLogTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  taskLogDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  entriesContainer: {
    marginTop: 24,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  entryContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  readMoreText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '600',
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
  reportModalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.primary,
  },
  reportCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reportSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportLabel: {
    fontSize: 16,
    color: colors.text,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  reportValueBold: {
    fontSize: 18,
    fontWeight: '700',
  },
  habitReportRow: {
    marginBottom: 16,
  },
  habitReportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitReportName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  habitReportCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  habitReportProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  habitReportRate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    width: 45,
    textAlign: 'right',
  },
});
