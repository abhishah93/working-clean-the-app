
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

interface DailyStats {
  date: string;
  workTime: number;
  breakTime: number;
  taskCount: number;
  breakCount: number;
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

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
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

  // Group logs by day
  const getLogsByDay = () => {
    const grouped: { [key: string]: TaskLog[] } = {};
    
    taskLogs.forEach(log => {
      const dateKey = new Date(log.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });

    return grouped;
  };

  // Get daily stats for the past week
  const getDailyStatsForWeek = (): DailyStats[] => {
    const today = new Date();
    const stats: DailyStats[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toDateString();

      const dayLogs = taskLogs.filter(log => {
        const logDate = new Date(log.date).toDateString();
        return logDate === dateKey;
      });

      const workTime = dayLogs
        .filter(log => log.type === 'task')
        .reduce((sum, log) => sum + log.timeSpent, 0);
      
      const breakTime = dayLogs
        .filter(log => log.type === 'break')
        .reduce((sum, log) => sum + log.timeSpent, 0);

      stats.push({
        date: dateKey,
        workTime,
        breakTime,
        taskCount: dayLogs.filter(log => log.type === 'task').length,
        breakCount: dayLogs.filter(log => log.type === 'break').length,
      });
    }

    return stats;
  };

  const getWeeklyStats = async () => {
    const dailyStats = getDailyStatsForWeek();
    
    const totalWorkTime = dailyStats.reduce((sum, day) => sum + day.workTime, 0);
    const totalBreakTime = dailyStats.reduce((sum, day) => sum + day.breakTime, 0);

    // Load habit data
    const workHabits = await loadHabitsForContext('work');
    const homeHabits = await loadHabitsForContext('home');
    const workHabitLogs = await loadHabitLogsForContext('work');
    const homeHabitLogs = await loadHabitLogsForContext('home');

    const allHabits = [...workHabits, ...homeHabits];
    const allHabitLogs = [...workHabitLogs, ...homeHabitLogs];

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

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
      dailyStats,
      totalWorkTime,
      totalBreakTime,
      totalTime: totalWorkTime + totalBreakTime,
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
              {/* Daily Breakdown */}
              <View style={styles.reportCard}>
                <Text style={styles.reportSectionTitle}>📅 Daily Breakdown</Text>
                {stats.dailyStats.map((day: DailyStats, index: number) => (
                  <View key={index} style={styles.dailyStatRow}>
                    <View style={styles.dailyStatHeader}>
                      <Text style={styles.dailyStatDate}>
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                      <Text style={styles.dailyStatTotal}>
                        {formatTime(day.workTime + day.breakTime)}
                      </Text>
                    </View>
                    <View style={styles.dailyStatDetails}>
                      <View style={styles.dailyStatItem}>
                        <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                        <Text style={styles.dailyStatLabel}>
                          Work: {formatTime(day.workTime)} ({day.taskCount} tasks)
                        </Text>
                      </View>
                      <View style={styles.dailyStatItem}>
                        <View style={[styles.statDot, { backgroundColor: colors.success }]} />
                        <Text style={styles.dailyStatLabel}>
                          Break: {formatTime(day.breakTime)} ({day.breakCount} breaks)
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Weekly Summary */}
              <View style={styles.reportCard}>
                <Text style={styles.reportSectionTitle}>⏱️ Weekly Summary</Text>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Total Work Time:</Text>
                  <Text style={styles.reportValue}>{formatTime(stats.totalWorkTime)}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Total Break Time:</Text>
                  <Text style={styles.reportValue}>{formatTime(stats.totalBreakTime)}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Total Time:</Text>
                  <Text style={[styles.reportValue, styles.reportValueBold]}>
                    {formatTime(stats.totalTime)}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Daily Average:</Text>
                  <Text style={styles.reportValue}>
                    {formatTime(Math.round(stats.totalWorkTime / 7))}
                  </Text>
                </View>
              </View>

              {/* Habit Completion */}
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

              {/* Summary */}
              <View style={styles.reportCard}>
                <Text style={styles.reportSectionTitle}>📊 Insights</Text>
                <Text style={commonStyles.text}>
                  This week you logged {formatTime(stats.totalWorkTime)} of focused work time
                  {stats.habitStats.length > 0 && ` and completed ${stats.habitStats.reduce((sum: number, h: any) => sum + h.completions, 0)} habit check-ins`}.
                  {'\n\n'}
                  Your most productive day was {stats.dailyStats.reduce((max: DailyStats, day: DailyStats) => 
                    day.workTime > max.workTime ? day : max
                  ).date && new Date(stats.dailyStats.reduce((max: DailyStats, day: DailyStats) => 
                    day.workTime > max.workTime ? day : max
                  ).date).toLocaleDateString('en-US', { weekday: 'long' })}.
                  {'\n\n'}
                  Keep up the great work!
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const logsByDay = getLogsByDay();
  const sortedDays = Object.keys(logsByDay).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

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
              <Text style={commonStyles.sectionTitle}>⏱️ Time Tracking by Day</Text>
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
              sortedDays.slice(0, 7).map((dateKey) => {
                const dayLogs = logsByDay[dateKey];
                const dayWorkTime = dayLogs
                  .filter(log => log.type === 'task')
                  .reduce((sum, log) => sum + log.timeSpent, 0);
                const dayBreakTime = dayLogs
                  .filter(log => log.type === 'break')
                  .reduce((sum, log) => sum + log.timeSpent, 0);

                return (
                  <View key={dateKey} style={styles.daySection}>
                    <View style={styles.daySectionHeader}>
                      <Text style={styles.daySectionDate}>{formatDateOnly(dayLogs[0].date)}</Text>
                      <View style={styles.daySectionStats}>
                        <Text style={styles.daySectionStatText}>
                          💼 {formatTime(dayWorkTime)}
                        </Text>
                        <Text style={styles.daySectionStatText}>
                          ☕ {formatTime(dayBreakTime)}
                        </Text>
                      </View>
                    </View>
                    {dayLogs.map((log) => (
                      <View key={log.id} style={styles.taskLogCard}>
                        <View style={styles.taskLogHeader}>
                          <View style={[
                            styles.taskLogBadge,
                            { backgroundColor: log.type === 'task' ? colors.primary : colors.success }
                          ]}>
                            <Text style={styles.taskLogBadgeText}>
                              {log.type === 'task' ? '💼' : '☕'}
                            </Text>
                          </View>
                          <Text style={styles.taskLogName}>{log.taskName}</Text>
                          <Text style={styles.taskLogTime}>{formatTime(log.timeSpent)}</Text>
                          <Pressable onPress={() => deleteTaskLog(log.id)}>
                            <IconSymbol name="trash" color={colors.secondary} size={18} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })
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
  daySection: {
    marginBottom: 20,
  },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  daySectionDate: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  daySectionStats: {
    flexDirection: 'row',
    gap: 12,
  },
  daySectionStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
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
    alignItems: 'center',
    gap: 12,
  },
  taskLogBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskLogBadgeText: {
    fontSize: 16,
  },
  taskLogName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  taskLogTime: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
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
  dailyStatRow: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dailyStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyStatDate: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dailyStatTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  dailyStatDetails: {
    gap: 4,
  },
  dailyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailyStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
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
