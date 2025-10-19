
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface TimerPickerProps {
  onTimeChange: (hours: number, minutes: number, seconds: number) => void;
  initialHours?: number;
  initialMinutes?: number;
  initialSeconds?: number;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function TimerPicker({ 
  onTimeChange, 
  initialHours = 0, 
  initialMinutes = 25, 
  initialSeconds = 0 
}: TimerPickerProps) {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  const hoursScrollRef = useRef<ScrollView>(null);
  const minutesScrollRef = useRef<ScrollView>(null);
  const secondsScrollRef = useRef<ScrollView>(null);

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);
  const secondsArray = Array.from({ length: 60 }, (_, i) => i);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    type: 'hours' | 'minutes' | 'seconds'
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    
    if (type === 'hours') {
      setHours(index);
      onTimeChange(index, minutes, seconds);
    } else if (type === 'minutes') {
      setMinutes(index);
      onTimeChange(hours, index, seconds);
    } else {
      setSeconds(index);
      onTimeChange(hours, minutes, index);
    }
  };

  const renderPickerColumn = (
    data: number[],
    selectedValue: number,
    label: string,
    scrollRef: React.RefObject<ScrollView>,
    type: 'hours' | 'minutes' | 'seconds'
  ) => {
    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => handleScroll(e, type)}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {/* Top padding */}
          <View style={{ height: ITEM_HEIGHT * 2 }} />
          
          {data.map((value) => (
            <View key={value} style={styles.pickerItem}>
              <Text
                style={[
                  styles.pickerItemText,
                  value === selectedValue && styles.pickerItemTextSelected
                ]}
              >
                {value.toString().padStart(2, '0')}
              </Text>
            </View>
          ))}
          
          {/* Bottom padding */}
          <View style={{ height: ITEM_HEIGHT * 2 }} />
        </ScrollView>
        <Text style={styles.pickerLabel}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        {/* Selection indicator */}
        <View style={styles.selectionIndicator} />
        
        <View style={styles.pickersRow}>
          {renderPickerColumn(hoursArray, hours, 'hours', hoursScrollRef, 'hours')}
          {renderPickerColumn(minutesArray, minutes, 'min', minutesScrollRef, 'minutes')}
          {renderPickerColumn(secondsArray, seconds, 'sec', secondsScrollRef, 'seconds')}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickersRow: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    gap: 8,
  },
  pickerColumn: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    height: PICKER_HEIGHT,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  pickerItemTextSelected: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  pickerLabel: {
    position: 'absolute',
    bottom: ITEM_HEIGHT * 2 - 8,
    right: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    zIndex: 2,
    pointerEvents: 'none',
  },
});
