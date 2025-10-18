
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
  startTime: string; // HH:mm format (24-hour)
  endTime: string; // HH:mm format (24-hour)
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
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState<'process' | 'immersive'>('process');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Generate time slots in 15-minute increments
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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

  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const checkOverlaps = (newEvent: CalendarEvent, excludeId?: string): CalendarEvent[] => {
    const overlapping: CalendarEvent[] = [];
    const newStart = timeToMinutes(newEvent.startTime);
    const newEnd = timeToMinutes(newEvent.endTime);

    events.forEach(event => {
      if (event.id === excludeId) return;
      if (event.dayOfWeek !== newEvent.dayOfWeek) return;

      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime);

      // Check if times overlap
      if (
        (newStart >= eventStart && newStart < eventEnd) ||
        (newEnd > eventStart && newEnd <= eventEnd) ||
        (newStart <= eventStart && newEnd >= eventEnd)
      ) {
        overlapping.push(event);
      }
    });

    return overlapping;
  };

  const openAddEventModal = (day: number, timeSlot: string) => {
    setSelectedDay(day);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(hours + 1, minutes, 0, 0); // Default 1 hour duration
    
    setStartTime(start);
    setEndTime(end);
    setEventTitle('');
    setEventDescription('');
    setEventType('process');
    setEditingEvent(null);
    setModalVisible(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedDay(event.dayOfWeek);
    
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);
    
    setStartTime(start);
    setEndTime(end);
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventType(event.type || 'process');
    setEditingEvent(event);
    setModalVisible(true);
  };

  const saveEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    const startHours = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const startTime24 = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;

    const endHours = endTime.getHours();
    const endMinutes = endTime.getMinutes();
    const endTime24 = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    // Validate that end time is after start time
    if (timeToMinutes(endTime24) <= timeToMinutes(startTime24)) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    const newEvent: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      dayOfWeek: selectedDay,
      startTime: startTime24,
      endTime: endTime24,
      title: eventTitle,
      description: eventDescription,
      type: eventType,
      context: context,
    };

    // Check for overlaps
    const overlaps = checkOverlaps(newEvent, editingEvent?.id);
    
    if (overlaps.length > 0) {
      const overlapTitles = overlaps.map(e => `"${e.title}" (${convertTo12Hour(e.startTime)} - ${convertTo12Hour(e.endTime)})`).join('\n');
      Alert.alert(
        'Overlap Detected',
        `This event overlaps with:\n\n${overlapTitles}\n\nDo you want to continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              saveEventConfirmed(newEvent);
            },
          },
        ]
      );
    } else {
      saveEventConfirmed(newEvent);
    }
  };

  const saveEventConfirmed = (newEvent: CalendarEvent) => {
    let updatedEvents: CalendarEvent[];
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === editingEvent.id ? newEvent : e);
    } else {
      updatedEvents = [...events, newEvent].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
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
      const duration = timeToMinutes(draggedEvent.endTime) - timeToMinutes(draggedEvent.startTime);
      const newStartMinutes = timeToMinutes(timeSlot);
      const newEndMinutes = newStartMinutes + duration;
      
      const newEndHours = Math.floor(newEndMinutes / 60);
      const newEndMins = newEndMinutes % 60;
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}`;
      
      const updatedEvents = events.map(e => 
        e.id === draggedEvent.id ? { ...e, dayOfWeek: day, startTime: timeSlot, endTime: newEndTime } : e
      ).sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
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
    const slotMinutes = timeToMinutes(timeSlot);
    
    return events.find(e => {
      if (e.dayOfWeek !== day) return false;
      
      const eventStartMinutes = timeToMinutes(e.startTime);
      const eventEndMinutes = timeToMinutes(e.endTime);
      
      return slotMinutes >= eventStartMinutes && slotMinutes < eventEndMinutes;
    });
  };

  const isEventStart = (event: CalendarEvent, timeSlot: string): boolean => {
    return event.startTime === timeSlot;
  };

  const getEventHeight = (event: CalendarEvent): number => {
    const duration = timeToMinutes(event.endTime) - timeToMinutes(event.startTime);
    const slots = duration / 15; // 15-minute slots
    return slots * 60; // 60px per slot
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
                startTime: '09:00',
                endTime: '10:00',
                title: task.text,
                description: task.type === 'process' ? 'Process Task' : 'Immersive Task',
                type: task.type,
                context: context,
                linkedTaskId: task.id,
              }));
              
              const updatedEvents = [...events, ...newEvents].sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                return a.startTime.localeCompare(b.startTime);
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
          style={styles.horizontalScroll}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.verticalScroll}
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
                    <Text style={styles.timeText}>{convertTo12Hour(timeSlot)}</Text>
                  </View>
                  {daysOfWeek.map((day, dayIndex) => {
                    const event = getEventForTimeSlot(dayIndex, timeSlot);
                    const isBeingMoved = draggedEvent?.id === event?.id;
                    const isStart = event && isEventStart(event, timeSlot);
                    const isOccupied = event !== undefined;
                    
                    return (
                      <Pressable
                        key={dayIndex}
                        style={[
                          styles.dayColumn,
                          isOccupied && styles.dayColumnOccupied,
                          isBeingMoved && styles.dayColumnBeingMoved,
                          draggedEvent && !isOccupied && styles.dayColumnDropTarget,
                        ]}
                        onPress={() => handleTimeSlotPress(dayIndex, timeSlot)}
                        onLongPress={() => event && isStart && handleLongPress(event)}
                      >
                        {event && isStart ? (
                          <View style={[styles.eventCard, { height: getEventHeight(event) }]}>
                            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                            <Text style={styles.eventTime}>
                              {convertTo12Hour(event.startTime)} - {convertTo12Hour(event.endTime)}
                            </Text>
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
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
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
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={commonStyles.title}>
                    {editingEvent ? 'Edit Event' : 'Add Event'}
                  </Text>
                  <Pressable onPress={() => setModalVisible(false)}>
                    <IconSymbol name="xmark" color={colors.text} size={24} />
                  </Pressable>
                </View>

                <Text style={styles.modalLabel}>Day: {daysOfWeek[selectedDay]}</Text>
                
                <Text style={styles.modalLabel}>Start Time:</Text>
                <Pressable
                  style={styles.timePickerButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.timePickerText}>
                    {convertTo12Hour(`${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`)}
                  </Text>
                </Pressable>

                {showStartTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      setShowStartTimePicker(Platform.OS === 'ios');
                      if (date) setStartTime(date);
                    }}
                  />
                )}

                <Text style={styles.modalLabel}>End Time:</Text>
                <Pressable
                  style={styles.timePickerButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.timePickerText}>
                    {convertTo12Hour(`${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`)}
                  </Text>
                </Pressable>

                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, date) => {
                      setShowEndTimePicker(Platform.OS === 'ios');
                      if (date) setEndTime(date);
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
              </ScrollView>
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
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  calendarGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    fontSize: 11,
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
    position: 'relative',
  },
  dayColumnOccupied: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.highlight,
    borderRadius: 6,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    minHeight: 60,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
    bottom: 4,
    right: 4,
    padding: 2,
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
    marginTop: 8,
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
