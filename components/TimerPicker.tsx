
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface TimerPickerProps {
  onTimeChange: (hours: number, minutes: number, seconds: number) => void;
  initialHours?: number;
  initialMinutes?: number;
  initialSeconds?: number;
}

const ITEM_HEIGHT = 60; // Increased for better touch targets
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

  // Generate arrays with correct max values
  const hoursArray = Array.from({ length: 24 }, (_, i) => i); // 0-23
  const minutesArray = Array.from({ length: 60 }, (_, i) => i); // 0-59
  const secondsArray = Array.from({ length: 60 }, (_, i) => i); // 0-59

  // Scroll to initial values on mount
  useEffect(() => {
    setTimeout(() => {
      hoursScrollRef.current?.scrollTo({ y: initialHours * ITEM_HEIGHT, animated: false });
      minutesScrollRef.current?.scrollTo({ y: initialMinutes * ITEM_HEIGHT, animated: false });
      secondsScrollRef.current?.scrollTo({ y: initialSeconds * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    type: 'hours' | 'minutes' | 'seconds'
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    
    let newHours = hours;
    let newMinutes = minutes;
    let newSeconds = seconds;

    if (type === 'hours') {
      newHours = Math.max(0, Math.min(23, index)); // Clamp to 0-23
      setHours(newHours);
    } else if (type === 'minutes') {
      newMinutes = Math.max(0, Math.min(59, index)); // Clamp to 0-59
      setMinutes(newMinutes);
    } else {
      newSeconds = Math.max(0, Math.min(59, index)); // Clamp to 0-59
      setSeconds(newSeconds);
    }
    
    onTimeChange(newHours, newMinutes, newSeconds);
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
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={(e) => handleScroll(e, type)}
          scrollEventThrottle={16} // Important: enables smooth scroll tracking
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
        {/* Selection indicator - centered on middle item */}
        <View style={styles.selectionIndicator} />
        
        {/* Top gradient overlay */}
        <View style={[styles.gradientOverlay, styles.gradientTop]} />
        
        {/* Bottom gradient overlay */}
        <View style={[styles.gradientOverlay, styles.gradientBottom]} />
        
        <View style={styles.pickersRow}>
          {renderPickerColumn(hoursArray, hours, 'hours', hoursScrollRef, 'hours')}
          <Text style={styles.separator}>:</Text>
          {renderPickerColumn(minutesArray, minutes, 'min', minutesScrollRef, 'minutes')}
          <Text style={styles.separator}>:</Text>
          {renderPickerColumn(secondsArray, seconds, 'sec', secondsScrollRef, 'seconds')}
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Swipe up or down to adjust time
        </Text>
        <Text style={styles.rangeText}>
          Hours: 0-23 • Minutes: 0-59 • Seconds: 0-59
        </Text>
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
    marginVertical: 16,
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    zIndex: 1,
    pointerEvents: 'none',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
    pointerEvents: 'none',
  },
  gradientTop: {
    top: 0,
    backgroundColor: colors.background,
    opacity: 0.8,
  },
  gradientBottom: {
    bottom: 0,
    backgroundColor: colors.background,
    opacity: 0.8,
  },
  pickersRow: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 4,
    marginTop: -8,
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
    fontSize: 32, // Enlarged from 24
    color: colors.textSecondary,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  pickerItemTextSelected: {
    fontSize: 42, // Enlarged from 28
    fontWeight: '700',
    color: colors.text,
  },
  pickerLabel: {
    position: 'absolute',
    bottom: ITEM_HEIGHT * 2 - 4,
    right: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    zIndex: 2,
    pointerEvents: 'none',
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  rangeText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
