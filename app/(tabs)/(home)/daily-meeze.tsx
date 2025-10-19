
import React, { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform, Modal, Alert, KeyboardAvoidingView } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyQuote } from "@/utils/quotes";
import DateTimePicker from '@react-native-community/datetimepicker';

interface Task {
  id: string;
  text: string;
  type: 'process' | 'immersive';
  miniTasks: MiniTask[];
  scheduledTime?: string;
  context: 'work' | 'home';
  status: 'not_started' | 'in_progress' | 'completed';
  completed: boolean;
  startTime?: string;
  endTime?: string;
  linkedEventId?: string;
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
  
  const [context, setContext] = useState<'work' | 'home'>('work');
  const [data, setData] = useState<DailyMeezeData>({
    accomplishments: '',
    frontBurners: '',
    backBurners: '',
    wins: '',
    tasks: [],
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMiniTaskModal, setShowMiniTaskModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMoveTaskModal, setShowMoveTaskModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskType, setNewTaskType] = useState<'process' | 'immersive'>('process');
  const [newTaskStatus, setNewTaskStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newMiniTaskText, setNewMiniTaskText] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [taskStartTime, setTaskStartTime] = useState('');
  const [taskEndTime, setTaskEndTime] = useState('');
  const [quote, setQuote] = useState('');
  
  // Move task modal states
  const [moveTaskDate, setMoveTaskDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [moveTaskStartTime, setMoveTaskStartTime] = useState(new Date());
  const [moveTaskEndTime, setMoveTaskEndTime] = useState(new Date());
  const [showMoveStartTimePicker, setShowMoveStartTimePicker] = useState(false);
  const [showMoveEndTimePicker, setShowMoveEndTimePicker] = useState(false);

  useEffect(() => {
    loadData();
    setQuote(getDailyQuote(date));
    syncWithCalendar();
  }, [date, context]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(`daily-meeze-${context}-${date}`);
      if (stored) {
        setData(JSON.parse(stored));
        console.log('Loaded daily meeze data for', context, date);
      } else {
        setData({
          accomplishments: '',
          frontBurners: '',
          backBurners: '',
          wins: '',
          tasks: [],
        });
      }
    } catch (error) {
      console.error('Error loading daily meeze:', error);
    }
  };

  const saveData = async (updatedData?: DailyMeezeData) => {
    try {
      const dataToSave = updatedData || data;
      await AsyncStorage.setItem(`daily-meeze-${context}-${date}`, JSON.stringify(dataToSave));
      console.log('Saved daily meeze data for', context, date);
      
      // Sync changes to calendar
      await syncTasksToCalendar(dataToSave.tasks);
      
      router.back();
    } catch (error) {
      console.error('Error saving daily meeze:', error);
    }
  };

  const syncWithCalendar = async () => {
    try {
      // Get the day of week for this date
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      
      // Calculate which week this date belongs to
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dayOfWeek);
      const weekOffset = 0; // Current week
      
      // Load calendar events for this week
      const calendarData = await AsyncStorage.getItem(`weekly-calendar-${context}-week${weekOffset}`);
      if (!calendarData) return;
      
      const events = JSON.parse(calendarData);
      
      // Find events linked to tasks from this day
      const linkedEvents = events.filter((event: any) => 
        event.linkedTaskId && event.linkedTaskDate === date
      );
      
      if (linkedEvents.length === 0) return;
      
      // Update tasks with changes from calendar
      const updatedTasks = data.tasks.map(task => {
        const linkedEvent = linkedEvents.find((e: any) => e.linkedTaskId === task.id);
        if (linkedEvent) {
          return {
            ...task,
            text: linkedEvent.title,
            status: linkedEvent.status,
            type: linkedEvent.type || task.type,
            startTime: convertTo12Hour(linkedEvent.startTime),
            endTime: convertTo12Hour(linkedEvent.endTime),
            linkedEventId: linkedEvent.id,
          };
        }
        return task;
      });
      
      setData({ ...data, tasks: updatedTasks });
    } catch (error) {
      console.error('Error syncing with calendar:', error);
    }
  };

  const syncTasksToCalendar = async (tasks: Task[]) => {
    try {
      // Get the day of week for this date
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      
      // Calculate which week this date belongs to
      const weekOffset = 0; // Current week
      
      // Load calendar events for this week
      const calendarData = await AsyncStorage.getItem(`weekly-calendar-${context}-week${weekOffset}`);
      if (!calendarData) return;
      
      const events = JSON.parse(calendarData);
      
      // Update linked events with task changes
      const updatedEvents = events.map((event: any) => {
        const linkedTask = tasks.find(t => t.id === event.linkedTaskId && event.linkedTaskDate === date);
        if (linkedTask) {
          return {
            ...event,
            title: linkedTask.text,
            status: linkedTask.status,
            type: linkedTask.type,
          };
        }
        return event;
      });
      
      await AsyncStorage.setItem(`weekly-calendar-${context}-week${weekOffset}`, JSON.stringify(updatedEvents));
      console.log('Synced tasks to calendar');
    } catch (error) {
      console.error('Error syncing tasks to calendar:', error);
    }
  };

  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const parseManualTime = (timeStr: string): { hours: number; minutes: number } | null => {
    try {
      const cleaned = timeStr.trim().toLowerCase().replace(/\s+/g, ' ');
      
      const isPM = cleaned.includes('pm');
      const isAM = cleaned.includes('am');
      
      const timeOnly = cleaned.replace(/am|pm/g, '').trim();
      
      let hours = 0;
      let minutes = 0;
      
      if (timeOnly.includes(':')) {
        const parts = timeOnly.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      } else {
        const num = parseInt(timeOnly, 10);
        if (num < 100) {
          hours = num;
          minutes = 0;
        } else {
          hours = Math.floor(num / 100);
          minutes = num % 100;
        }
      }
      
      if (isNaN(hours) || isNaN(minutes) || minutes >= 60 || minutes < 0) {
        return null;
      }
      
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }
      
      if (hours >= 24 || hours < 0) {
        return null;
      }
      
      return { hours, minutes };
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  };

  const openMoveTaskModal = (task: Task) => {
    setSelectedTask(task);
    
    // Set default date to current date
    const currentDate = new Date(date + 'T00:00:00');
    setMoveTaskDate(currentDate);
    
    // Set default times based on task's current times or defaults
    if (task.startTime && task.endTime) {
      const parsedStart = parseManualTime(task.startTime);
      const parsedEnd = parseManualTime(task.endTime);
      
      if (parsedStart) {
        const startDate = new Date();
        startDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);
        setMoveTaskStartTime(startDate);
      }
      
      if (parsedEnd) {
        const endDate = new Date();
        endDate.setHours(parsedEnd.hours, parsedEnd.minutes, 0, 0);
        setMoveTaskEndTime(endDate);
      }
    } else {
      const start = new Date();
      start.setHours(9, 0, 0, 0);
      const end = new Date();
      end.setHours(10, 0, 0, 0);
      setMoveTaskStartTime(start);
      setMoveTaskEndTime(end);
    }
    
    setShowMoveTaskModal(true);
  };

  const moveTaskToSelectedDate = async () => {
    if (!selectedTask) return;
    
    const targetDateStr = moveTaskDate.toISOString().split('T')[0];
    
    // Convert times to 24-hour format
    const startHours = moveTaskStartTime.getHours();
    const startMinutes = moveTaskStartTime.getMinutes();
    const startTime24 = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    
    const endHours = moveTaskEndTime.getHours();
    const endMinutes = moveTaskEndTime.getMinutes();
    const endTime24 = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    Alert.alert(
      'Move Task',
      `Move "${selectedTask.text}" to ${formatDate(targetDateStr)} at ${convertTo12Hour(startTime24)} - ${convertTo12Hour(endTime24)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: async () => {
            try {
              // Remove from current day
              const updatedCurrentTasks = data.tasks.filter(t => t.id !== selectedTask.id);
              const updatedCurrentData = { ...data, tasks: updatedCurrentTasks };
              await AsyncStorage.setItem(`daily-meeze-${context}-${date}`, JSON.stringify(updatedCurrentData));
              setData(updatedCurrentData);
              
              // Add to target day
              const targetDayData = await AsyncStorage.getItem(`daily-meeze-${context}-${targetDateStr}`);
              let targetDayMeeze: DailyMeezeData;
              
              if (targetDayData) {
                targetDayMeeze = JSON.parse(targetDayData);
              } else {
                targetDayMeeze = {
                  accomplishments: '',
                  frontBurners: '',
                  backBurners: '',
                  wins: '',
                  tasks: [],
                };
              }
              
              // Create a new task with updated times
              const movedTask = {
                ...selectedTask,
                id: Date.now().toString(),
                startTime: convertTo12Hour(startTime24),
                endTime: convertTo12Hour(endTime24),
                linkedEventId: undefined, // Clear the linked event ID
              };
              
              targetDayMeeze.tasks.push(movedTask);
              await AsyncStorage.setItem(`daily-meeze-${context}-${targetDateStr}`, JSON.stringify(targetDayMeeze));
              
              // Remove old linked calendar event if exists
              if (selectedTask.linkedEventId) {
                await removeLinkedCalendarEvent(selectedTask.linkedEventId);
              }
              
              // Create new calendar event for the moved task
              await createCalendarEventForMovedTask(movedTask, targetDateStr, startTime24, endTime24);
              
              setShowMoveTaskModal(false);
              Alert.alert('Success', `Task moved to ${formatDate(targetDateStr)}`);
            } catch (error) {
              console.error('Error moving task:', error);
              Alert.alert('Error', 'Failed to move task');
            }
          },
        },
      ]
    );
  };

  const createCalendarEventForMovedTask = async (task: Task, targetDate: string, startTime24: string, endTime24: string) => {
    try {
      const dateObj = new Date(targetDate + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      
      const weekOffset = 0;
      const calendarData = await AsyncStorage.getItem(`weekly-calendar-${context}-week${weekOffset}`);
      
      let events = [];
      if (calendarData) {
        events = JSON.parse(calendarData);
      }
      
      const newEvent = {
        id: `linked-daily-${targetDate}-${task.id}`,
        dayOfWeek: dayOfWeek,
        startTime: startTime24,
        endTime: endTime24,
        title: task.text,
        description: `Moved from ${date}`,
        type: task.type,
        context: context,
        linkedTaskId: task.id,
        linkedTaskDate: targetDate,
        status: task.status,
      };
      
      events.push(newEvent);
      await AsyncStorage.setItem(`weekly-calendar-${context}-week${weekOffset}`, JSON.stringify(events));
      
      // Update task with new linked event ID
      const targetDayData = await AsyncStorage.getItem(`daily-meeze-${context}-${targetDate}`);
      if (targetDayData) {
        const targetDayMeeze = JSON.parse(targetDayData);
        targetDayMeeze.tasks = targetDayMeeze.tasks.map((t: Task) => 
          t.id === task.id ? { ...t, linkedEventId: newEvent.id } : t
        );
        await AsyncStorage.setItem(`daily-meeze-${context}-${targetDate}`, JSON.stringify(targetDayMeeze));
      }
      
      console.log('Created calendar event for moved task');
    } catch (error) {
      console.error('Error creating calendar event for moved task:', error);
    }
  };

  const moveTaskToNextDay = async (taskId: string) => {
    try {
      const task = data.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Calculate next day
      const currentDate = new Date(date + 'T00:00:00');
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      Alert.alert(
        'Move Task to Next Day',
        `Move "${task.text}" to ${formatDate(nextDateStr)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move',
            onPress: async () => {
              // Remove from current day
              const updatedCurrentTasks = data.tasks.filter(t => t.id !== taskId);
              const updatedCurrentData = { ...data, tasks: updatedCurrentTasks };
              await AsyncStorage.setItem(`daily-meeze-${context}-${date}`, JSON.stringify(updatedCurrentData));
              setData(updatedCurrentData);
              
              // Add to next day
              const nextDayData = await AsyncStorage.getItem(`daily-meeze-${context}-${nextDateStr}`);
              let nextDayMeeze: DailyMeezeData;
              
              if (nextDayData) {
                nextDayMeeze = JSON.parse(nextDayData);
              } else {
                nextDayMeeze = {
                  accomplishments: '',
                  frontBurners: '',
                  backBurners: '',
                  wins: '',
                  tasks: [],
                };
              }
              
              // Create a new task with a new ID for the next day
              const movedTask = {
                ...task,
                id: Date.now().toString(),
                linkedEventId: undefined, // Clear the linked event ID
              };
              
              nextDayMeeze.tasks.push(movedTask);
              await AsyncStorage.setItem(`daily-meeze-${context}-${nextDateStr}`, JSON.stringify(nextDayMeeze));
              
              // Remove linked calendar event if exists
              if (task.linkedEventId) {
                await removeLinkedCalendarEvent(task.linkedEventId);
              }
              
              Alert.alert('Success', `Task moved to ${formatDate(nextDateStr)}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error moving task to next day:', error);
      Alert.alert('Error', 'Failed to move task to next day');
    }
  };

  const moveTaskToPreviousDay = async (taskId: string) => {
    try {
      const task = data.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Calculate previous day
      const currentDate = new Date(date + 'T00:00:00');
      const prevDate = new Date(currentDate);
      prevDate.setDate(currentDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      
      Alert.alert(
        'Move Task to Previous Day',
        `Move "${task.text}" to ${formatDate(prevDateStr)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move',
            onPress: async () => {
              // Remove from current day
              const updatedCurrentTasks = data.tasks.filter(t => t.id !== taskId);
              const updatedCurrentData = { ...data, tasks: updatedCurrentTasks };
              await AsyncStorage.setItem(`daily-meeze-${context}-${date}`, JSON.stringify(updatedCurrentData));
              setData(updatedCurrentData);
              
              // Add to previous day
              const prevDayData = await AsyncStorage.getItem(`daily-meeze-${context}-${prevDateStr}`);
              let prevDayMeeze: DailyMeezeData;
              
              if (prevDayData) {
                prevDayMeeze = JSON.parse(prevDayData);
              } else {
                prevDayMeeze = {
                  accomplishments: '',
                  frontBurners: '',
                  backBurners: '',
                  wins: '',
                  tasks: [],
                };
              }
              
              // Create a new task with a new ID for the previous day
              const movedTask = {
                ...task,
                id: Date.now().toString(),
                linkedEventId: undefined, // Clear the linked event ID
              };
              
              prevDayMeeze.tasks.push(movedTask);
              await AsyncStorage.setItem(`daily-meeze-${context}-${prevDateStr}`, JSON.stringify(prevDayMeeze));
              
              // Remove linked calendar event if exists
              if (task.linkedEventId) {
                await removeLinkedCalendarEvent(task.linkedEventId);
              }
              
              Alert.alert('Success', `Task moved to ${formatDate(prevDateStr)}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error moving task to previous day:', error);
      Alert.alert('Error', 'Failed to move task to previous day');
    }
  };

  const removeLinkedCalendarEvent = async (eventId: string) => {
    try {
      const weekOffset = 0;
      const calendarData = await AsyncStorage.getItem(`weekly-calendar-${context}-week${weekOffset}`);
      if (!calendarData) return;
      
      const events = JSON.parse(calendarData);
      const updatedEvents = events.filter((e: any) => e.id !== eventId);
      await AsyncStorage.setItem(`weekly-calendar-${context}-week${weekOffset}`, JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Error removing linked calendar event:', error);
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
      scheduledTime: scheduledTime || undefined,
      context: context,
      status: newTaskStatus,
      completed: false,
      startTime: taskStartTime || undefined,
      endTime: taskEndTime || undefined,
    };

    const updatedData = { ...data, tasks: [...data.tasks, newTask] };
    setData(updatedData);
    setNewTaskText('');
    setScheduledTime('');
    setTaskStartTime('');
    setTaskEndTime('');
    setNewTaskStatus('not_started');
    setShowTaskModal(false);
  };

  const deleteTask = async (taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Remove linked calendar event if exists
            if (task?.linkedEventId) {
              await removeLinkedCalendarEvent(task.linkedEventId);
            }
            
            const updatedData = { ...data, tasks: data.tasks.filter(t => t.id !== taskId) };
            setData(updatedData);
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

  const openMiniTaskModal = (task: Task) => {
    setSelectedTask(task);
    setShowMiniTaskModal(true);
  };

  const openScheduleModal = (task: Task) => {
    setSelectedTask(task);
    setScheduledTime(task.scheduledTime || '');
    setTaskStartTime(task.startTime || '');
    setTaskEndTime(task.endTime || '');
    setShowScheduleModal(true);
  };

  const saveScheduledTime = () => {
    if (!selectedTask) return;

    const updatedTasks = data.tasks.map(t => {
      if (t.id === selectedTask.id) {
        return { 
          ...t, 
          scheduledTime: scheduledTime || undefined,
          startTime: taskStartTime || undefined,
          endTime: taskEndTime || undefined,
        };
      }
      return t;
    });

    setData({ ...data, tasks: updatedTasks });
    setShowScheduleModal(false);
    setSelectedTask(null);
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
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          title: "Daily Meeze",
          headerBackTitle: "Back",
        }}
      />
      <KeyboardAvoidingView 
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.dateHeader}>
            <IconSymbol name="calendar" color={colors.primary} size={24} />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </View>

          {/* Quote of the Day */}
          <View style={styles.quoteCard}>
            <IconSymbol name="quote.bubble" color={colors.accent} size={28} />
            <Text style={styles.quoteText}>{quote}</Text>
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
              Add tasks and schedule them on your calendar
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
                      {task.linkedEventId && (
                        <View style={[styles.taskTypeBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.taskTypeText}>
                            🔗 Linked
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
                        onPress={() => moveTaskToPreviousDay(task.id)}
                      >
                        <IconSymbol name="arrow.left.circle.fill" color={colors.accent} size={24} />
                        <Text style={styles.taskActionLabel}>Prev Day</Text>
                      </Pressable>
                      <Pressable
                        style={styles.taskActionButtonWithLabel}
                        onPress={() => moveTaskToNextDay(task.id)}
                      >
                        <IconSymbol name="arrow.right.circle.fill" color={colors.accent} size={24} />
                        <Text style={styles.taskActionLabel}>Next Day</Text>
                      </Pressable>
                      <Pressable
                        style={styles.taskActionButtonWithLabel}
                        onPress={() => openMoveTaskModal(task)}
                      >
                        <IconSymbol name="calendar.badge.clock" color={colors.primary} size={24} />
                        <Text style={styles.taskActionLabel}>Move</Text>
                      </Pressable>
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

          <Pressable style={buttonStyles.primary} onPress={() => saveData()}>
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
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
          </KeyboardAvoidingView>
        </Modal>

        {/* Move Task Modal */}
        <Modal
          visible={showMoveTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMoveTaskModal(false)}
        >
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={commonStyles.title}>Move Task</Text>
                  <Pressable onPress={() => setShowMoveTaskModal(false)}>
                    <IconSymbol name="xmark" color={colors.text} size={24} />
                  </Pressable>
                </View>

                {selectedTask && (
                  <Text style={styles.selectedTaskText}>{selectedTask.text}</Text>
                )}

                <Text style={styles.modalLabel}>Select Date:</Text>
                <Pressable
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <IconSymbol name="calendar" color={colors.primary} size={20} />
                  <Text style={styles.datePickerText}>
                    {formatDate(moveTaskDate.toISOString().split('T')[0])}
                  </Text>
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={moveTaskDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) {
                        setMoveTaskDate(date);
                      }
                    }}
                  />
                )}

                <Text style={styles.modalLabel}>Start Time:</Text>
                <Pressable
                  style={styles.timePickerButton}
                  onPress={() => setShowMoveStartTimePicker(true)}
                >
                  <IconSymbol name="clock" color={colors.primary} size={20} />
                  <Text style={styles.timePickerText}>
                    {convertTo12Hour(`${moveTaskStartTime.getHours().toString().padStart(2, '0')}:${moveTaskStartTime.getMinutes().toString().padStart(2, '0')}`)}
                  </Text>
                </Pressable>

                {showMoveStartTimePicker && (
                  <DateTimePicker
                    value={moveTaskStartTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      setShowMoveStartTimePicker(Platform.OS === 'ios');
                      if (date) {
                        setMoveTaskStartTime(date);
                      }
                    }}
                  />
                )}

                <Text style={styles.modalLabel}>End Time:</Text>
                <Pressable
                  style={styles.timePickerButton}
                  onPress={() => setShowMoveEndTimePicker(true)}
                >
                  <IconSymbol name="clock" color={colors.primary} size={20} />
                  <Text style={styles.timePickerText}>
                    {convertTo12Hour(`${moveTaskEndTime.getHours().toString().padStart(2, '0')}:${moveTaskEndTime.getMinutes().toString().padStart(2, '0')}`)}
                  </Text>
                </Pressable>

                {showMoveEndTimePicker && (
                  <DateTimePicker
                    value={moveTaskEndTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      setShowMoveEndTimePicker(Platform.OS === 'ios');
                      if (date) {
                        setMoveTaskEndTime(date);
                      }
                    }}
                  />
                )}

                <Pressable style={buttonStyles.primary} onPress={moveTaskToSelectedDate}>
                  <Text style={buttonStyles.text}>Move Task</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Mini Tasks Modal */}
        <Modal
          visible={showMiniTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMiniTaskModal(false)}
        >
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
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
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
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
  quoteCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quoteText: {
    flex: 1,
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 24,
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  timePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
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
