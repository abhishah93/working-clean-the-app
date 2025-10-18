
import React, { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyMeezeData {
  frontBurners: string;
  backBurners: string;
  accomplishments: string;
  wins: string;
  challenges: string;
  changes: string;
}

export default function DailyMeezeScreen() {
  const params = useLocalSearchParams();
  const date = params.date as string || new Date().toISOString().split('T')[0];
  
  const [data, setData] = useState<DailyMeezeData>({
    frontBurners: '',
    backBurners: '',
    accomplishments: '',
    wins: '',
    challenges: '',
    changes: '',
  });

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

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>⚠️ Challenges Faced</Text>
            <Text style={commonStyles.textSecondary}>
              What obstacles did you encounter today?
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
              What adjustments do you need to make moving forward?
            </Text>
            <TextInput
              style={commonStyles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Note any changes you need to make..."
              placeholderTextColor={colors.textSecondary}
              value={data.changes}
              onChangeText={(text) => setData({ ...data, changes: text })}
            />
          </View>

          <Pressable style={buttonStyles.primary} onPress={saveData}>
            <Text style={buttonStyles.text}>Save Daily Meeze</Text>
          </Pressable>
        </ScrollView>
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
});
