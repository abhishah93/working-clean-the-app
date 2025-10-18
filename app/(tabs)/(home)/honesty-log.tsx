
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HonestyEntry {
  id: string;
  date: string;
  content: string;
}

export default function HonestyLogScreen() {
  const [entries, setEntries] = useState<HonestyEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
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
              Track your honest reflections and thoughts
            </Text>
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>New Entry</Text>
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
              <Text style={buttonStyles.text}>Add Entry</Text>
            </Pressable>
          </View>

          <View style={styles.entriesContainer}>
            <Text style={commonStyles.sectionTitle}>Previous Entries</Text>
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="book" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyStateText}>No entries yet</Text>
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
});
