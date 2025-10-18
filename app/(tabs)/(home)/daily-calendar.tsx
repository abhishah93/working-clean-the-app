
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Modal, Platform, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  description: string;
}

export default function DailyCalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem(`calendar-${selectedDate}`);
      if (stored) {
        setEvents(JSON.parse(stored));
        console.log('Loaded calendar events for', selectedDate);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const saveEvents = async (updatedEvents: CalendarEvent[]) => {
    try {
      await AsyncStorage.setItem(`calendar-${selectedDate}`, JSON.stringify(updatedEvents));
      console.log('Saved calendar events for', selectedDate);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  };

  const openAddEventModal = (time: string) => {
    setSelectedTime(time);
    setEventTitle('');
    setEventDescription('');
    setEditingEvent(null);
    setModalVisible(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedTime(event.time);
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEditingEvent(event);
    setModalVisible(true);
  };

  const saveEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    const newEvent: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      time: selectedTime,
      title: eventTitle,
      description: eventDescription,
    };

    let updatedEvents: CalendarEvent[];
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === editingEvent.id ? newEvent : e);
    } else {
      updatedEvents = [...events, newEvent].sort((a, b) => a.time.localeCompare(b.time));
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

  const getEventForTime = (time: string) => {
    return events.find(e => e.time === time);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Daily Calendar",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={commonStyles.title}>30-Minute Time Blocks</Text>
            <Text style={commonStyles.textSecondary}>
              Tap a time slot to add or edit an event
            </Text>
          </View>

          {timeSlots.map((time) => {
            const event = getEventForTime(time);
            return (
              <Pressable
                key={time}
                style={[
                  styles.timeSlot,
                  event && styles.timeSlotWithEvent
                ]}
                onPress={() => event ? openEditEventModal(event) : openAddEventModal(time)}
              >
                <View style={styles.timeSlotTime}>
                  <Text style={styles.timeText}>{time}</Text>
                </View>
                <View style={styles.timeSlotContent}>
                  {event ? (
                    <>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.description ? (
                        <Text style={styles.eventDescription}>{event.description}</Text>
                      ) : null}
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => deleteEvent(event.id)}
                      >
                        <IconSymbol name="trash" color={colors.secondary} size={18} />
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.emptySlotText}>Tap to add event</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
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
                <Text style={commonStyles.title}>
                  {editingEvent ? 'Edit Event' : 'Add Event'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <Text style={styles.modalTimeText}>Time: {selectedTime}</Text>

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
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS !== 'ios' ? 100 : 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  timeSlot: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSlotWithEvent: {
    backgroundColor: colors.highlight,
    borderColor: colors.accent,
  },
  timeSlotTime: {
    width: 80,
    padding: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeSlotContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
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
  modalTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
});
