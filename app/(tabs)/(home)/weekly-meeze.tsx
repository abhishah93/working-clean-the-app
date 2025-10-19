
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform, Modal, Alert } from "react-native";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";

interface Task {
  id: string;
  text: string;
  type: 'process' | 'immersive';
  miniTasks: MiniTask[];
  context: 'work' | 'home';
  status: 'not_started' | 'in_progress' | 'completed';
  completed: boolean;
  startTime?: string;
  endTime?: string;
}

interface MiniTask {
  id: string;
  text: string;
  completed: boolean;
}

interface WeeklyMeezeData {
  topGoals: string[];
  frontBurners: string;
  backBurners: string;
  wins: string;
  challenges: string;
  changes: string;
  tasks: Task[];
}

export default function WeeklyMeezeScreen() {
  const params = useLocalSearchParams();
  const startDate = params.startDate as string || new Date().toISOString().split('T')[0];
  const endDate = params.endDate as string || new Date().toISOString().split('T')[0];
  
  const [context, setContext] = useState<'work' | 'home'>('work');
  const [data, setData] = useState<WeeklyMeezeData>({
    topGoals: ['', '', ''],
    frontBurners: '',
    backBurners: '',
    wins: '',
    challenges: '',
    changes: '',
    tasks: [],
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMiniTaskModal, setShowMiniTaskModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskType, setNewTaskType] = useState<'process' | 'immersive'>('process');
  const [newTaskStatus, setNewTaskStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newMiniTaskText, setNewMiniTaskText] = useState('');
  const [taskStartTime, setTaskStartTime] = useState('');
  const [taskEndTime, setTaskEndTime] = useState('');

  useEffect(() => {
    loadData();
  }, [startDate, context]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(`weekly-meeze-${context}-${startDate}`);
      if (stored) {
        setData(JSON.parse(stored));
        console.log('Loaded weekly meeze data for', context, startDate);
      } else {
        setData({
          topGoals: ['', '', ''],
          frontBurners: '',
          backBurners: '',
          wins: '',
          challenges: '',
          changes: '',
          tasks: [],
        });
      }
    } catch (error) {
      console.error('Error loading weekly meeze:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(`weekly-meeze-${context}-${startDate}`, JSON.stringify(data));
      console.log('Saved weekly meeze data for', context, startDate);
      router.back();
    } catch (error) {
      console.error('Error saving weekly meeze:', error);
    }
  };

  const updateTopGoal = (index: number, value: string) => {
    const updatedGoals = [...data.topGoals];
    updatedGoals[index] = value;
    setData({ ...data, topGoals: updatedGoals });
  };

  const addTask = () => {
    if (!newTaskText.trim()) {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      type: newTaskType,
      miniTasks: [],
      context: context,
      status: newTaskStatus,
      completed: false,
      startTime: taskStartTime || undefined,
      endTime: taskEndTime || undefined,
    };

    setData({ ...data, tasks: [...data.tasks, newTask] });
    setNewTaskText('');
    setNewTaskStatus('not_started');
    setTaskStartTime('');
    setTaskEndTime('');
    setShowTaskModal(false);
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setData({ ...data, tasks: data.tasks.filter(t => t.id !== taskId) });
          },
        },
      ]
    );
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = data.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    setData({ ...data, tasks: updatedTasks });
  };

  const updateTaskStatus = (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    const updatedTasks = data.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status };
      }
      return t;
    });

    setData({ ...data, tasks: updatedTasks });
  };

  const openMiniTaskModal = (task: Task) => {
    setSelectedTask(task);
    setShowMiniTaskModal(true);
  };

  const addMiniTask = () => {
    if (!newMiniTaskText.trim() || !selectedTask) {
      Alert.alert('Error', 'Please enter an action');
      return;
    }

    const miniTask: MiniTask = {
      id: Date.now().toString(),
      text: newMiniTaskText,
      completed: false,
    };

    const updatedTasks = data.tasks.map(t => {
      if (t.id === selectedTask.id) {
        return { ...t, miniTasks: [...t.miniTasks, miniTask] };
      }
      return t;
    });

    setData({ ...data, tasks: updatedTasks });
    setNewMiniTaskText('');
  };

  const toggleMiniTask = (taskId: string, miniTaskId: string) => {
    const updatedTasks = data.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          miniTasks: t.miniTasks.map(mt => 
            mt.id === miniTaskId ? { ...mt, completed: !mt.completed } : mt
          ),
        };
      }
      return t;
    });

    setData({ ...data, tasks: updatedTasks });
  };

  const deleteMiniTask = (taskId: string, miniTaskId: string) => {
    const updatedTasks = data.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          miniTasks: t.miniTasks.filter(mt => mt.id !== miniTaskId),
        };
      }
      return t;
    });

    setData({ ...data, tasks: updatedTasks });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  };

  const getStatusColor = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'not_started':
        return colors.textSecondary;
      case 'in_progress':
        return colors.accent;
      case 'completed':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Not Started';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Weekly Meeze",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateHeader}>
            <IconSymbol name="calendar" color={colors.primary} size={24} />
            <Text style={styles.dateText}>{formatDateRange(startDate, endDate)}</Text>
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

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🏆 Top 3 Goals for the Week</Text>
            <Text style={commonStyles.textSecondary}>
              Focus on your three most important objectives
            </Text>
            {data.topGoals.map((goal, index) => (
              <View key={index} style={styles.goalInputRow}>
                <Text style={styles.goalNumber}>{index + 1}.</Text>
                <TextInput
                  style={[commonStyles.input, { flex: 1, marginBottom: 8 }]}
                  placeholder={`Goal ${index + 1}`}
                  placeholderTextColor={colors.textSecondary}
                  value={goal}
                  onChangeText={(text) => updateTopGoal(index, text)}
                />
              </View>
            ))}
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🔥 Front Burner Projects</Text>
            <Text style={commonStyles.textSecondary}>
              What are your top priority projects this week?
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="List your front burner projects..."
              placeholderTextColor={colors.textSecondary}
              value={data.frontBurners}
              onChangeText={(text) => setData({ ...data, frontBurners: text })}
            />
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🔙 Back Burner Projects</Text>
            <Text style={commonStyles.textSecondary}>
              What projects are on hold but need attention later?
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="List your back burner projects..."
              placeholderTextColor={colors.textSecondary}
              value={data.backBurners}
              onChangeText={(text) => setData({ ...data, backBurners: text })}
            />
          </View>

          <View style={commonStyles.card}>
            <View style={styles.taskHeader}>
              <Text style={commonStyles.sectionTitle}>📋 Tasks</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => setShowTaskModal(true)}
              >
                <IconSymbol name="plus" color="#ffffff" size={20} />
              </Pressable>
            </View>
            <Text style={commonStyles.textSecondary}>
              Add tasks and categorize them as process or immersive
            </Text>
            
            {data.tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskMainRow}>
                  {/* Completion Checkbox */}
                  <Pressable
                    style={[
                      styles.completionCheckbox,
                      task.completed && styles.completionCheckboxChecked
                    ]}
                    onPress={() => toggleTaskCompletion(task.id)}
                  >
                    {task.completed && (
                      <IconSymbol name="checkmark" color="#ffffff" size={18} />
                    )}
                  </Pressable>

                  <View style={styles.taskContent}>
                    <Text style={[
                      styles.taskText,
                      task.completed && styles.taskTextCompleted
                    ]}>
                      {task.text}
                    </Text>
                    <View style={styles.taskBadges}>
                      <View style={[
                        styles.taskTypeBadge,
                        { backgroundColor: task.type === 'process' ? colors.primary : colors.accent }
                      ]}>
                        <Text style={styles.taskTypeText}>
                          {task.type === 'process' ? '⚙️ Process' : '🎨 Immersive'}
                        </Text>
                      </View>
                      <View style={[
                        styles.taskTypeBadge,
                        { backgroundColor: getStatusColor(task.status || 'not_started') }
                      ]}>
                        <Text style={styles.taskTypeText}>
                          {getStatusLabel(task.status || 'not_started')}
                        </Text>
                      </View>
                      {(task.startTime || task.endTime) && (
                        <View style={[styles.taskTypeBadge, { backgroundColor: colors.success }]}>
                          <Text style={styles.taskTypeText}>
                            🕐 {task.startTime || '?'} - {task.endTime || '?'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Status Selector */}
                    <View style={styles.statusSelectorInline}>
                      <Pressable
                        style={[
                          styles.statusButtonInline,
                          task.status === 'not_started' && styles.statusButtonInlineActive
                        ]}
                        onPress={() => updateTaskStatus(task.id, 'not_started')}
                      >
                        <Text style={styles.statusButtonTextInline}>Not Started</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.statusButtonInline,
                          task.status === 'in_progress' && styles.statusButtonInlineActive
                        ]}
                        onPress={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        <Text style={styles.statusButtonTextInline}>In Progress</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.statusButtonInline,
                          task.status === 'completed' && styles.statusButtonInlineActive
                        ]}
                        onPress={() => updateTaskStatus(task.id, 'completed')}
                      >
                        <Text style={styles.statusButtonTextInline}>Completed</Text>
                      </Pressable>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.taskActionsRow}>
                      <Pressable
                        style={styles.taskActionButtonWithLabel}
                        onPress={() => openMiniTaskModal(task)}
                      >
                        <IconSymbol name="list.bullet" color={colors.primary} size={24} />
                        <Text style={styles.taskActionLabel}>Breakdown</Text>
                      </Pressable>
                      <Pressable
                        style={styles.taskActionButtonWithLabel}
                        onPress={() => deleteTask(task.id)}
                      >
                        <IconSymbol name="trash.fill" color={colors.secondary} size={24} />
                        <Text style={styles.taskActionLabel}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                
                {task.miniTasks.length > 0 && (
                  <View style={styles.miniTasksContainer}>
                    <Text style={styles.miniTasksTitle}>Actions:</Text>
                    {task.miniTasks.map((miniTask) => (
                      <View key={miniTask.id} style={styles.miniTaskRow}>
                        <Pressable
                          style={styles.miniTaskCheckbox}
                          onPress={() => toggleMiniTask(task.id, miniTask.id)}
                        >
                          {miniTask.completed && (
                            <IconSymbol name="checkmark" color={colors.success} size={16} />
                          )}
                        </Pressable>
                        <Text style={[
                          styles.miniTaskText,
                          miniTask.completed && styles.miniTaskTextCompleted
                        ]}>
                          {miniTask.text}
                        </Text>
                        <Pressable
                          onPress={() => deleteMiniTask(task.id, miniTask.id)}
                        >
                          <IconSymbol name="xmark" color={colors.textSecondary} size={16} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🏆 This Week&apos;s Wins</Text>
            <Text style={commonStyles.textSecondary}>
              What did you accomplish? Celebrate your victories!
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Record your wins..."
              placeholderTextColor={colors.textSecondary}
              value={data.wins}
              onChangeText={(text) => setData({ ...data, wins: text })}
            />
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>⚠️ Challenges</Text>
            <Text style={commonStyles.textSecondary}>
              What obstacles did you face this week?
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Describe your challenges..."
              placeholderTextColor={colors.textSecondary}
              value={data.challenges}
              onChangeText={(text) => setData({ ...data, challenges: text })}
            />
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🔄 Changes Needed</Text>
            <Text style={commonStyles.textSecondary}>
              What adjustments will you make for next week?
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Plan your improvements..."
              placeholderTextColor={colors.textSecondary}
              value={data.changes}
              onChangeText={(text) => setData({ ...data, changes: text })}
            />
          </View>

          <Pressable style={buttonStyles.primary} onPress={saveData}>
            <Text style={buttonStyles.text}>Save Weekly Meeze</Text>
          </Pressable>
        </ScrollView>

        {/* Add Task Modal */}
        <Modal
          visible={showTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTaskModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={commonStyles.title}>Add Task</Text>
                  <Pressable onPress={() => setShowTaskModal(false)}>
                    <IconSymbol name="xmark" color={colors.text} size={24} />
                  </Pressable>
                </View>

                <TextInput
                  style={commonStyles.input}
                  placeholder="Task description"
                  placeholderTextColor={colors.textSecondary}
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                />

                <Text style={styles.modalLabel}>Task Type:</Text>
                <View style={styles.taskTypeSelector}>
                  <Pressable
                    style={[
                      styles.taskTypeOption,
                      newTaskType === 'process' && styles.taskTypeOptionActive
                    ]}
                    onPress={() => setNewTaskType('process')}
                  >
                    <Text style={[
                      styles.taskTypeOptionText,
                      newTaskType === 'process' && styles.taskTypeOptionTextActive
                    ]}>
                      ⚙️ Process
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.taskTypeOption,
                      newTaskType === 'immersive' && styles.taskTypeOptionActive
                    ]}
                    onPress={() => setNewTaskType('immersive')}
                  >
                    <Text style={[
                      styles.taskTypeOptionText,
                      newTaskType === 'immersive' && styles.taskTypeOptionTextActive
                    ]}>
                      🎨 Immersive
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.modalLabel}>Status:</Text>
                <View style={styles.taskTypeSelector}>
                  <Pressable
                    style={[
                      styles.taskTypeOption,
                      newTaskStatus === 'not_started' && styles.taskTypeOptionActive
                    ]}
                    onPress={() => setNewTaskStatus('not_started')}
                  >
                    <Text style={[
                      styles.taskTypeOptionText,
                      newTaskStatus === 'not_started' && styles.taskTypeOptionTextActive
                    ]}>
                      Not Started
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.taskTypeOption,
                      newTaskStatus === 'in_progress' && styles.taskTypeOptionActive
                    ]}
                    onPress={() => setNewTaskStatus('in_progress')}
                  >
                    <Text style={[
                      styles.taskTypeOptionText,
                      newTaskStatus === 'in_progress' && styles.taskTypeOptionTextActive
                    ]}>
                      In Progress
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.taskTypeOption,
                      newTaskStatus === 'completed' && styles.taskTypeOptionActive
                    ]}
                    onPress={() => setNewTaskStatus('completed')}
                  >
                    <Text style={[
                      styles.taskTypeOptionText,
                      newTaskStatus === 'completed' && styles.taskTypeOptionTextActive
                    ]}>
                      Completed
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.modalLabel}>Time Range (Optional):</Text>
                <Text style={styles.helpText}>
                  Enter times like: 1 PM, 3:30 PM, 9 AM, etc.
                </Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>Start</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="1 PM"
                      placeholderTextColor={colors.textSecondary}
                      value={taskStartTime}
                      onChangeText={setTaskStartTime}
                    />
                  </View>
                  <Text style={styles.timeSeparator}>-</Text>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>End</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="3 PM"
                      placeholderTextColor={colors.textSecondary}
                      value={taskEndTime}
                      onChangeText={setTaskEndTime}
                    />
                  </View>
                </View>

                <Pressable style={buttonStyles.primary} onPress={addTask}>
                  <Text style={buttonStyles.text}>Add Task</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Mini Tasks Modal */}
        <Modal
          visible={showMiniTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMiniTaskModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Break Down Task</Text>
                <Pressable onPress={() => setShowMiniTaskModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              {selectedTask && (
                <>
                  <Text style={styles.selectedTaskText}>{selectedTask.text}</Text>
                  
                  <View style={styles.miniTaskInputRow}>
                    <TextInput
                      style={[commonStyles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="First action / Next action..."
                      placeholderTextColor={colors.textSecondary}
                      value={newMiniTaskText}
                      onChangeText={setNewMiniTaskText}
                    />
                    <Pressable
                      style={styles.addMiniTaskButton}
                      onPress={addMiniTask}
                    >
                      <IconSymbol name="plus" color="#ffffff" size={20} />
                    </Pressable>
                  </View>

                  <ScrollView style={styles.miniTasksList}>
                    {selectedTask.miniTasks.map((miniTask, index) => (
                      <View key={miniTask.id} style={styles.miniTaskModalRow}>
                        <Text style={styles.miniTaskNumber}>{index + 1}.</Text>
                        <Text style={styles.miniTaskModalText}>{miniTask.text}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
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
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  contextTabs: {
    flexDirection: 'row',
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
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    width: 24,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCard: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  completionCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  completionCheckboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  taskTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskTypeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  statusSelectorInline: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statusButtonInline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statusButtonInlineActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonTextInline: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  taskActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  taskActionButtonWithLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 60,
  },
  taskActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  miniTasksContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  miniTasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  miniTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  miniTaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniTaskText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  miniTaskTextCompleted: {
    textDecorationLine: 'line-through',
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
    maxHeight: '80%',
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
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  taskTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  taskTypeOption: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  taskTypeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  taskTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  taskTypeOptionTextActive: {
    color: colors.primary,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
  },
  selectedTaskText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  miniTaskInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addMiniTaskButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniTasksList: {
    maxHeight: 200,
  },
  miniTaskModalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  miniTaskNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  miniTaskModalText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
});
