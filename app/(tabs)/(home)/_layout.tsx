
import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/styles/commonStyles';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Work Clean',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="daily-meeze" 
        options={{ 
          title: 'Daily Meeze',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="weekly-meeze" 
        options={{ 
          title: 'Weekly Meeze',
          headerShown: true,
        }} 
      />

      <Stack.Screen 
        name="weekly-calendar" 
        options={{ 
          title: 'Weekly Calendar',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="honesty-log" 
        options={{ 
          title: 'Honesty Log',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="timers" 
        options={{ 
          title: 'Timers',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="habit-tracker" 
        options={{ 
          title: 'Habit Tracker',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="routines" 
        options={{ 
          title: 'Routines',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}
