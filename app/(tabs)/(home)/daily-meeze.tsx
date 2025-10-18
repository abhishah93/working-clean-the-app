
import React, { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform, Modal, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  id: string;
  text: string;
  type: 'process' | 'immersive';
  miniTasks: MiniTask[];
}

interface MiniTask {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyMeezeData {
  accomplishments: string;
  frontBurners: string;
  backBurners: string;
  wins: string;
  tasks: Task[];
}

export default function DailyMeezeScreen() {
  const params = useLocalSearchParams();
  const date = params.date as string || new Date().toISOString().split('T')[0];
  
  const [data, setData] = useState<DailyMeezeData>({
    accomplishments: '',
    frontBurners: '',
    backBurners: '',
    wins: '',
    tasks: [],
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMiniTaskModal, setShowMiniTaskModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskType, setNewTaskType] = useState<'process' | 'immersive'>('process');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newMiniTaskText, setNewMiniTaskText] = useState('');

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(`daily-meeze-${date}`);
      if (stored) {
        setData(JSON.parse(stored));
        console.log('Loaded daily meeze data for', date);
      }
    } catch (error) {
      console.error('Error loading daily meeze:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(`daily-meeze-${date}`, JSON.stringify(data));
      console.log('Saved daily meeze data for', date);
      router.back();
    } catch (error) {
      console.error('Error saving daily meeze:', error);
    }
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
    };

    setData({ ...data, tasks: [...data.tasks, newTask] });
    setNewTaskText('');
    setShowTaskModal(false);
  };

  const deleteTask = (taskId: string) => {
    setData({ ...data, tasks: data.tasks.filter(t => t.id !== taskId) });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Daily Meeze",
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
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🎯 What I Want to Accomplish</Text>
            <Text style={commonStyles.textSecondary}>
              What specific goals do you want to achieve today?
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Write your goals for today..."
              placeholderTextColor={colors.textSecondary}
              value={data.accomplishments}
              onChangeText={(text) => setData({ ...data, accomplishments: text })}
            />
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>🔥 Front Burner Projects</Text>
            <Text style={commonStyles.textSecondary}>
              What are your top priority projects today?
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
                  <View style={styles.taskContent}>
                    <Text style={styles.taskText}>{task.text}</Text>
                    <View style={[
                      styles.taskTypeBadge,
                      { backgroundColor: task.type === 'process' ? colors.primary : colors.accent }
                    ]}>
                      <Text style={styles.taskTypeText}>
                        {task.type === 'process' ? '⚙️ Process' : '🎨 Immersive'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.taskActions}>
                    <Pressable
                      style={styles.taskActionButton}
                      onPress={() => openMiniTaskModal(task)}
                    >
                      <IconSymbol name="list.bullet" color={colors.primary} size={20} />
                    </Pressable>
                    <Pressable
                      style={styles.taskActionButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <IconSymbol name="trash" color={colors.secondary} size={20} />
                    </Pressable>
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
            <Text style={commonStyles.sectionTitle}>🏆 Today&apos;s Wins</Text>
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

          <Pressable style={buttonStyles.primary} onPress={saveData}>
            <Text style={buttonStyles.text}>Save Daily Meeze</Text>
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

              <Pressable style={buttonStyles.primary} onPress={addTask}>
                <Text style={buttonStyles.text}>Add Task</Text>
              </Pressable>
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
    marginBottom: 24,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  taskTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  taskTypeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskActionButton: {
    padding: 4,
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
  },
  taskTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  taskTypeOption: {
    flex: 1,
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
