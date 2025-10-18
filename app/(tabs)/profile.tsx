
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native";
import { colors, commonStyles } from "@/styles/commonStyles";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={[commonStyles.container]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" color="#ffffff" size={48} />
          </View>
          <Text style={commonStyles.title}>Your Profile</Text>
          <Text style={commonStyles.textSecondary}>
            Manage your Work Clean settings
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>About Work Clean</Text>
          <Text style={commonStyles.text}>
            This app is based on the principles from &quot;Work Clean&quot; by Dan Charnas, 
            which teaches the organizational and mental practices of professional chefs 
            to help you work more efficiently and mindfully.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Key Concepts</Text>
          
          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>🔥</Text>
            <View style={styles.conceptContent}>
              <Text style={styles.conceptTitle}>Front Burner</Text>
              <Text style={commonStyles.textSecondary}>
                Active projects requiring immediate attention
              </Text>
            </View>
          </View>

          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>🔙</Text>
            <View style={styles.conceptContent}>
              <Text style={styles.conceptTitle}>Back Burner</Text>
              <Text style={commonStyles.textSecondary}>
                Projects on hold but not forgotten
              </Text>
            </View>
          </View>

          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>📝</Text>
            <View style={styles.conceptContent}>
              <Text style={styles.conceptTitle}>Meeze</Text>
              <Text style={commonStyles.textSecondary}>
                Mise en place - everything in its place
              </Text>
            </View>
          </View>

          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>📖</Text>
            <View style={styles.conceptContent}>
              <Text style={styles.conceptTitle}>Honesty Log</Text>
              <Text style={commonStyles.textSecondary}>
                Daily reflections and honest self-assessment
              </Text>
            </View>
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>App Features</Text>
          <Text style={commonStyles.text}>
            - Daily and Weekly Meeze planning{'\n'}
            - 30-minute block calendar scheduling{'\n'}
            - Honesty log for reflections{'\n'}
            - Built-in timers for focused work{'\n'}
            - Front and back burner project tracking
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  conceptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conceptEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  conceptContent: {
    flex: 1,
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
});
