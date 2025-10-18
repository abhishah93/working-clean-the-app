
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Modal, Platform, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CalendarEvent {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  time: string; // HH:mm format
  duration: number; // in minutes
  title: string;
  description: string;
  type?: 'process' | 'immersive';
  context: 'work' | 'home';
  linkedTaskId?: string;
}

export default function WeeklyCalendarScreen() {
  const [context, setContext] = useState<'work' | 'home'>('work');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState<'process' | 'immersive'>('process');
  const [eventDuration, setEventDuration] = useState(30);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Generate time slots in 30-minute increments with AM/PM
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadEvents();
  }, [context, selectedWeek]);

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem(`weekly-calendar-${context}-week${selectedWeek}`);
      if (stored) {
        setEvents(JSON.parse(stored));
        console.log('Loaded weekly calendar events for', context, 'week', selectedWeek);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading weekly calendar events:', error);
    }
  };

  const saveEvents = async (updatedEvents: CalendarEvent[]) => {
    try {
      await AsyncStorage.setItem(`weekly-calendar-${context}-week${selectedWeek}`, JSON.stringify(updatedEvents));
      console.log('Saved weekly calendar events for', context, 'week', selectedWeek);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving weekly calendar events:', error);
    }
  };

  const convertTo24Hour = (time12h: string): string => {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const openAddEventModal = (day: number, timeSlot: string) => {
    setSelectedDay(day);
    const time24 = convertTo24Hour(timeSlot);
    const [hours, minutes] = time24.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setSelectedTime(date);
    setEventTitle('');
    setEventDescription('');
    setEventType('process');
    setEventDuration(30);
    setEditingEvent(null);
    setModalVisible(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedDay(event.dayOfWeek);
    const [hours, minutes] = event.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setSelectedTime(date);
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventType(event.type || 'process');
    setEventDuration(event.duration);
    setEditingEvent(event);
    setModalVisible(true);
  };

  const saveEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const newEvent: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      dayOfWeek: selectedDay,
      time: time24,
      duration: eventDuration,
      title: eventTitle,
      description: eventDescription,
      type: eventType,
      context: context,
    };

    let updatedEvents: CalendarEvent[];
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === editingEvent.id ? newEvent : e);
    } else {
      updatedEvents = [...events, newEvent].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.time.localeCompare(b.time);
      });
    }

    saveEvents(updatedEvents);
    setModalVisible(false);
  };

  const deleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedEvents = events.filter(e => e.id !== eventId);
            saveEvents(updatedEvents);
          },
        },
      ]
    );
  };

  const handleLongPress = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleTimeSlotPress = (day: number, timeSlot: string) => {
    if (draggedEvent) {
      // Move the event to the new time and day
      const time24 = convertTo24Hour(timeSlot);
      const updatedEvents = events.map(e => 
        e.id === draggedEvent.id ? { ...e, dayOfWeek: day, time: time24 } : e
      ).sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.time.localeCompare(b.time);
      });
      
      saveEvents(updatedEvents);
      setDraggedEvent(null);
    } else {
      const event = getEventForTimeSlot(day, timeSlot);
      if (event) {
        openEditEventModal(event);
      } else {
        openAddEventModal(day, timeSlot);
      }
    }
  };

  const getEventForTimeSlot = (day: number, timeSlot: string): CalendarEvent | undefined => {
    const time24 = convertTo24Hour(timeSlot);
    return events.find(e => {
      if (e.dayOfWeek !== day) return false;
      
      const [eventHours, eventMinutes] = e.time.split(':').map(Number);
      const eventStartMinutes = eventHours * 60 + eventMinutes;
      
      const [slotHours, slotMinutes] = time24.split(':').map(Number);
      const slotMinutes_total = slotHours * 60 + slotMinutes;
      
      return slotMinutes_total >= eventStartMinutes && 
             slotMinutes_total < eventStartMinutes + e.duration;
    });
  };

  const isTimeSlotOccupied = (day: number, timeSlot: string): boolean => {
    return getEventForTimeSlot(day, timeSlot) !== undefined;
  };

  const linkTasksFromMeezes = async () => {
    try {
      // Load tasks from daily and weekly meezes
      const dailyMeezeData = await AsyncStorage.getItem(`daily-meeze-${context}-${new Date().toISOString().split('T')[0]}`);
      const weeklyMeezeData = await AsyncStorage.getItem(`weekly-meeze-${context}-${new Date().toISOString().split('T')[0]}`);
      
      const tasks: any[] = [];
      
      if (dailyMeezeData) {
        const dailyData = JSON.parse(dailyMeezeData);
        tasks.push(...(dailyData.tasks || []));
      }
      
      if (weeklyMeezeData) {
        const weeklyData = JSON.parse(weeklyMeezeData);
        tasks.push(...(weeklyData.tasks || []));
      }
      
      if (tasks.length === 0) {
        Alert.alert('No Tasks', 'No tasks found in your meezes to link.');
        return;
      }
      
      Alert.alert(
        'Link Tasks',
        `Found ${tasks.length} task(s). These will be added to your calendar. You can then drag them to schedule them.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Link',
            onPress: () => {
              const newEvents: CalendarEvent[] = tasks.map((task, index) => ({
                id: `linked-${Date.now()}-${index}`,
                dayOfWeek: 1, // Default to Monday
                time: '09:00',
                duration: 60,
                title: task.text,
                description: task.type === 'process' ? 'Process Task' : 'Immersive Task',
                type: task.type,
                context: context,
                linkedTaskId: task.id,
              }));
              
              const updatedEvents = [...events, ...newEvents].sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                return a.time.localeCompare(b.time);
              });
              
              saveEvents(updatedEvents);
              Alert.alert('Success', 'Tasks linked to calendar. Drag them to schedule!');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error linking tasks:', error);
      Alert.alert('Error', 'Failed to link tasks from meezes.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Weekly Calendar",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <Text style={commonStyles.title}>Weekly Schedule</Text>
          <Text style={commonStyles.textSecondary}>
            Tap to add/edit • Long press to drag and rearrange
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

        {/* Link Tasks Button */}
        <Pressable 
          style={[buttonStyles.primary, { marginHorizontal: 16, marginBottom: 16 }]} 
          onPress={linkTasksFromMeezes}
        >
          <IconSymbol name="link" color="#ffffff" size={20} />
          <Text style={[buttonStyles.text, { marginLeft: 8 }]}>Link Tasks from Meezes</Text>
        </Pressable>

        {draggedEvent && (
          <View style={styles.movingBanner}>
            <IconSymbol name="arrow.up.arrow.down" color="#ffffff" size={20} />
            <Text style={styles.movingBannerText}>
              Moving: {draggedEvent.title} - Tap a time slot to place it
            </Text>
          </View>
        )}

        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.calendarGrid}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.headerText}>Time</Text>
              </View>
              {daysOfWeek.map((day, index) => (
                <View key={index} style={styles.dayHeaderColumn}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Time Slots */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <View key={timeIndex} style={styles.timeRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{timeSlot}</Text>
                </View>
                {daysOfWeek.map((day, dayIndex) => {
                  const event = getEventForTimeSlot(dayIndex, timeSlot);
                  const isBeingMoved = draggedEvent?.id === event?.id;
                  const isOccupied = isTimeSlotOccupied(dayIndex, timeSlot);
                  const isEventStart = event && convertTo12Hour(event.time) === timeSlot;
                  
                  return (
                    <Pressable
                      key={dayIndex}
                      style={[
                        styles.dayColumn,
                        isEventStart && styles.dayColumnWithEvent,
                        isBeingMoved && styles.dayColumnBeingMoved,
                        draggedEvent && !isOccupied && styles.dayColumnDropTarget,
                      ]}
                      onPress={() => handleTimeSlotPress(dayIndex, timeSlot)}
                      onLongPress={() => event && isEventStart && handleLongPress(event)}
                    >
                      {event && isEventStart ? (
                        <View style={styles.eventCard}>
                          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                          <Text style={styles.eventDuration}>{event.duration} min</Text>
                          {event.type && (
                            <View style={[
                              styles.eventTypeBadge,
                              { backgroundColor: event.type === 'process' ? colors.primary : colors.accent }
                            ]}>
                              <Text style={styles.eventTypeText}>
                                {event.type === 'process' ? '⚙️' : '🎨'}
                              </Text>
                            </View>
                          )}
                          <Pressable
                            style={styles.deleteButton}
                            onPress={() => deleteEvent(event.id)}
                          >
                            <IconSymbol name="trash" color={colors.secondary} size={14} />
                          </Pressable>
                        </View>
                      ) : isOccupied ? (
                        <View style={styles.occupiedSlot} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add/Edit Event Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>
                  {editingEvent ? 'Edit Event' : 'Add Event'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>Day: {daysOfWeek[selectedDay]}</Text>
              
              <Text style={styles.modalLabel}>Time:</Text>
              <Pressable
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timePickerText}>
                  {convertTo12Hour(`${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`)}
                </Text>
              </Pressable>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, date) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (date) setSelectedTime(date);
                  }}
                />
              )}

              <TextInput
                style={commonStyles.input}
                placeholder="Event Title"
                placeholderTextColor={colors.textSecondary}
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              <TextInput
                style={commonStyles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={eventDescription}
                onChangeText={setEventDescription}
              />

              <Text style={styles.modalLabel}>Duration (minutes):</Text>
              <View style={styles.durationSelector}>
                {[15, 30, 45, 60, 90, 120].map((duration) => (
                  <Pressable
                    key={duration}
                    style={[
                      styles.durationOption,
                      eventDuration === duration && styles.durationOptionActive
                    ]}
                    onPress={() => setEventDuration(duration)}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      eventDuration === duration && styles.durationOptionTextActive
                    ]}>
                      {duration}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Task Type:</Text>
              <View style={styles.typeSelector}>
                <Pressable
                  style={[
                    styles.typeOption,
                    eventType === 'process' && styles.typeOptionActive
                  ]}
                  onPress={() => setEventType('process')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    eventType === 'process' && styles.typeOptionTextActive
                  ]}>
                    ⚙️ Process
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeOption,
                    eventType === 'immersive' && styles.typeOptionActive
                  ]}
                  onPress={() => setEventType('immersive')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    eventType === 'immersive' && styles.typeOptionTextActive
                  ]}>
                    🎨 Immersive
                  </Text>
                </Pressable>
              </View>

              <Pressable style={buttonStyles.primary} onPress={saveEvent}>
                <Text style={buttonStyles.text}>
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Text>
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
    padding: 16,
    alignItems: 'center',
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
  movingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  movingBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  calendarGrid: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  timeColumn: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderColumn: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dayColumn: {
    width: 120,
    height: 60,
    backgroundColor: colors.card,
    borderRadius: 6,
    marginRight: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayColumnWithEvent: {
    backgroundColor: colors.highlight,
    borderColor: colors.accent,
  },
  dayColumnBeingMoved: {
    opacity: 0.5,
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  dayColumnDropTarget: {
    borderColor: colors.success,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  eventCard: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  eventDuration: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTypeText: {
    fontSize: 10,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    padding: 2,
  },
  occupiedSlot: {
    flex: 1,
    backgroundColor: colors.highlight,
    opacity: 0.3,
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
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timePickerButton: {
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  durationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  durationOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  durationOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  durationOptionTextActive: {
    color: colors.primary,
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
});
