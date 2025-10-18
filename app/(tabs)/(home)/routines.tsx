
import React, { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, TextInput, Platform, Modal, Alert } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles, buttonStyles } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Routine {
  id: string;
  name: string;
  description: string;
  context: 'work' | 'home';
  steps: string[];
  createdAt: string;
}

export default function RoutinesScreen() {
  const [context, setContext] = useState<'work' | 'home'>('work');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineSteps, setRoutineSteps] = useState<string[]>(['']);

  useEffect(() => {
    loadRoutines();
  }, [context]);

  const loadRoutines = async () => {
    try {
      const stored = await AsyncStorage.getItem(`routines-${context}`);
      if (stored) {
        setRoutines(JSON.parse(stored));
        console.log('Loaded routines for', context);
      } else {
        setRoutines([]);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  };

  const saveRoutines = async (updatedRoutines: Routine[]) => {
    try {
      await AsyncStorage.setItem(`routines-${context}`, JSON.stringify(updatedRoutines));
      setRoutines(updatedRoutines);
      console.log('Saved routines for', context);
    } catch (error) {
      console.error('Error saving routines:', error);
    }
  };

  const addRoutine = () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    const filteredSteps = routineSteps.filter(step => step.trim() !== '');
    if (filteredSteps.length === 0) {
      Alert.alert('Error', 'Please add at least one step');
      return;
    }

    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: routineName,
      description: routineDescription,
      context: context,
      steps: filteredSteps,
      createdAt: new Date().toISOString(),
    };

    const updatedRoutines = [...routines, newRoutine];
    saveRoutines(updatedRoutines);
    
    setRoutineName('');
    setRoutineDescription('');
    setRoutineSteps(['']);
    setShowAddModal(false);
  };

  const deleteRoutine = (routineId: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedRoutines = routines.filter(r => r.id !== routineId);
            saveRoutines(updatedRoutines);
          },
        },
      ]
    );
  };

  const viewRoutineDetails = (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowDetailModal(true);
  };

  const addStepField = () => {
    setRoutineSteps([...routineSteps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...routineSteps];
    updated[index] = value;
    setRoutineSteps(updated);
  };

  const removeStep = (index: number) => {
    const updated = routineSteps.filter((_, i) => i !== index);
    setRoutineSteps(updated.length > 0 ? updated : ['']);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Routines",
          headerBackTitle: "Back",
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconSymbol name="repeat" color="#9b59b6" size={32} />
            <Text style={commonStyles.title}>My Routines</Text>
            <Text style={commonStyles.textSecondary}>
              Create and manage your daily routines
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

          <Pressable 
            style={[buttonStyles.primary, { marginBottom: 24 }]} 
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" color="#ffffff" size={20} />
            <Text style={[buttonStyles.text, { marginLeft: 8 }]}>Create New Routine</Text>
          </Pressable>

          {routines.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="repeat" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyStateText}>No routines yet</Text>
              <Text style={commonStyles.textSecondary}>
                Create your first routine to get started
              </Text>
            </View>
          ) : (
            routines.map((routine) => (
              <Pressable
                key={routine.id}
                style={styles.routineCard}
                onPress={() => viewRoutineDetails(routine)}
              >
                <View style={styles.routineHeader}>
                  <View style={styles.routineIcon}>
                    <IconSymbol name="repeat" color="#9b59b6" size={24} />
                  </View>
                  <View style={styles.routineContent}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineStepCount}>
                      {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteRoutine(routine.id)}
                  >
                    <IconSymbol name="trash" color={colors.secondary} size={20} />
                  </Pressable>
                </View>
                {routine.description ? (
                  <Text style={styles.routineDescription} numberOfLines={2}>
                    {routine.description}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>

        {/* Add Routine Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Create Routine</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Routine Name"
                  placeholderTextColor={colors.textSecondary}
                  value={routineName}
                  onChangeText={setRoutineName}
                />

                <TextInput
                  style={commonStyles.textArea}
                  multiline
                  numberOfLines={3}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={routineDescription}
                  onChangeText={setRoutineDescription}
                />

                <Text style={styles.modalLabel}>Steps:</Text>
                {routineSteps.map((step, index) => (
                  <View key={index} style={styles.stepInputRow}>
                    <Text style={styles.stepNumber}>{index + 1}.</Text>
                    <TextInput
                      style={[commonStyles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Step description"
                      placeholderTextColor={colors.textSecondary}
                      value={step}
                      onChangeText={(text) => updateStep(index, text)}
                    />
                    {routineSteps.length > 1 && (
                      <Pressable
                        style={styles.removeStepButton}
                        onPress={() => removeStep(index)}
                      >
                        <IconSymbol name="xmark" color={colors.secondary} size={20} />
                      </Pressable>
                    )}
                  </View>
                ))}

                <Pressable
                  style={styles.addStepButton}
                  onPress={addStepField}
                >
                  <IconSymbol name="plus" color={colors.primary} size={20} />
                  <Text style={styles.addStepText}>Add Step</Text>
                </Pressable>
              </ScrollView>

              <Pressable style={buttonStyles.primary} onPress={addRoutine}>
                <Text style={buttonStyles.text}>Create Routine</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Routine Detail Modal */}
        <Modal
          visible={showDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={commonStyles.title}>Routine Details</Text>
                <Pressable onPress={() => setShowDetailModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              {selectedRoutine && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailName}>{selectedRoutine.name}</Text>
                    {selectedRoutine.description ? (
                      <Text style={styles.detailDescription}>
                        {selectedRoutine.description}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.modalLabel}>Steps:</Text>
                  {selectedRoutine.steps.map((step, index) => (
                    <View key={index} style={styles.stepDetailRow}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepDetailText}>{step}</Text>
                    </View>
                  ))}
                </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  routineCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routineContent: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  routineStepCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  routineDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
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
    maxHeight: '85%',
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
    marginBottom: 12,
    marginTop: 8,
  },
  stepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    width: 24,
  },
  removeStepButton: {
    padding: 8,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
    gap: 8,
  },
  addStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  detailCard: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  stepDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepDetailText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    paddingTop: 4,
  },
});
