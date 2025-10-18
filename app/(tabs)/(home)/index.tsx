
import React, { useState } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { Calendar } from 'react-native-calendars';
import { colors, commonStyles } from "@/styles/commonStyles";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Get Sunday to Saturday week dates
  const getWeekDates = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate Sunday of the week
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(sunday);
      currentDate.setDate(sunday.getDate() + i);
      weekDates.push(currentDate.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  const handleDayPress = (day: any) => {
    if (viewMode === 'day') {
      setSelectedDate(day.dateString);
      console.log('Selected date:', day.dateString);
      // Navigate to daily meeze
      router.push({
        pathname: '/(tabs)/(home)/daily-meeze',
        params: { date: day.dateString }
      });
    } else {
      const weekDates = getWeekDates(day.dateString);
      setSelectedWeek(weekDates);
      console.log('Selected week (Sun-Sat):', weekDates);
      // Navigate to weekly meeze
      router.push({
        pathname: '/(tabs)/(home)/weekly-meeze',
        params: { 
          startDate: weekDates[0], // Sunday
          endDate: weekDates[6]    // Saturday
        }
      });
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    if (viewMode === 'day' && selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: colors.primary,
      };
    } else if (viewMode === 'week' && selectedWeek.length > 0) {
      selectedWeek.forEach((date, index) => {
        marked[date] = {
          selected: true,
          color: colors.highlight,
          textColor: colors.text,
          startingDay: index === 0,
          endingDay: index === 6,
          marked: true,
          dotColor: colors.primary,
        };
      });
    }
    
    return marked;
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => router.push('/(tabs)/(home)/timers')}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="timer" color={colors.primary} size={24} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.push('/(tabs)/(home)/honesty-log')}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="book.fill" color={colors.primary} size={24} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Work Clean",
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[commonStyles.container]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={commonStyles.title}>Work Clean Productivity</Text>
            <Text style={commonStyles.textSecondary}>
              Select a day or week to plan your meeze
            </Text>
          </View>

          <View style={styles.viewModeContainer}>
            <Pressable
              style={[
                styles.viewModeButton,
                viewMode === 'day' && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === 'day' && styles.viewModeTextActive
              ]}>
                Daily View
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.viewModeButton,
                viewMode === 'week' && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === 'week' && styles.viewModeTextActive
              ]}>
                Weekly View (Sun-Sat)
              </Text>
            </Pressable>
          </View>

          <View style={commonStyles.card}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={getMarkedDates()}
              markingType={viewMode === 'week' ? 'period' : 'simple'}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.accent,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary,
                monthTextColor: colors.text,
                textMonthFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
              }}
            />
          </View>

          <View style={styles.quickAccessContainer}>
            <Text style={commonStyles.sectionTitle}>Quick Access</Text>
            
            <Pressable
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/(home)/weekly-calendar')}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: colors.primary }]}>
                <IconSymbol name="calendar" color="#ffffff" size={24} />
              </View>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Weekly Calendar</Text>
                <Text style={commonStyles.textSecondary}>
                  Schedule activities across the week with AM/PM time
                </Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>

            <Pressable
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/(home)/daily-calendar')}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#e67e22' }]}>
                <IconSymbol name="calendar" color="#ffffff" size={24} />
              </View>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Daily Calendar</Text>
                <Text style={commonStyles.textSecondary}>
                  Schedule activities in 5-minute blocks
                </Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>

            <Pressable
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/(home)/routines')}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#9b59b6' }]}>
                <IconSymbol name="repeat" color="#ffffff" size={24} />
              </View>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Routines</Text>
                <Text style={commonStyles.textSecondary}>
                  Create and manage your routines
                </Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>

            <Pressable
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/(home)/habit-tracker')}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: colors.success }]}>
                <IconSymbol name="checkmark.circle.fill" color="#ffffff" size={24} />
              </View>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Habit Tracker</Text>
                <Text style={commonStyles.textSecondary}>
                  Track your daily habits
                </Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>

            <Pressable
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/(home)/honesty-log')}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: colors.accent }]}>
                <IconSymbol name="book.fill" color="#ffffff" size={24} />
              </View>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Honesty Log</Text>
                <Text style={commonStyles.textSecondary}>
                  Track time and view weekly reports
                </Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>

            <Pressable
              style={styles.quickAccessCard}
              onPress={() => router.push('/(tabs)/(home)/timers')}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: colors.secondary }]}>
                <IconSymbol name="timer" color="#ffffff" size={24} />
              </View>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Timers</Text>
                <Text style={commonStyles.textSecondary}>
                  Schedule and manage your timers
                </Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerButtonContainer: {
    padding: 8,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: '#ffffff',
  },
  quickAccessContainer: {
    marginTop: 24,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickAccessContent: {
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
});
