// ─── Time Scroller ────────────────────────────────────────────────────────────
// Dual-column hour/minute picker using native ScrollView snap-to-interval.
// Each column snaps to ITEM_HEIGHT increments on momentum end, giving a
// slot-machine feel without a third-party picker dependency.

import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';

// ─── Constants ───────────────────────────────────────────────────────
const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 3;
const SCROLLER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// ─── Props ───────────────────────────────────────────────────────────
interface TimeScrollerProps {
  hour: number;
  minute: number;
  onTimeChange: (h: number, m: number) => void;
}

// ─── Column Sub-component ────────────────────────────────────────────

interface ScrollColumnProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  padZero?: boolean;
}

function ScrollColumn({ data, selectedValue, onValueChange, padZero = false }: ScrollColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(selectedValue);
  const isUserScrolling = useRef(false);

  // Scroll to initial position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedValue * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      if (clampedIndex !== currentIndexRef.current) {
        currentIndexRef.current = clampedIndex;
        onValueChange(data[clampedIndex]);
      }
      isUserScrolling.current = false;
    },
    [data, onValueChange],
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const formatValue = (val: number): string => {
    if (padZero) {
      return val.toString().padStart(2, '0');
    }
    return val.toString();
  };

  return (
    <View style={styles.columnContainer}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT} // Locks scroll to discrete time values
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT,
          paddingBottom: ITEM_HEIGHT,
        }}
      >
        {data.map((value, index) => {
          const isSelected = value === selectedValue;
          return (
            <View key={index} style={styles.itemContainer}>
              <Text
                style={[
                  styles.itemText,
                  isSelected ? styles.selectedText : styles.unselectedText,
                ]}
              >
                {formatValue(value)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── TimeScroller Main Component ─────────────────────────────────────

export function TimeScroller({ hour, minute, onTimeChange }: TimeScrollerProps) {
  const hourRef = useRef(hour);
  const minuteRef = useRef(minute);

  const handleHourChange = useCallback(
    (h: number) => {
      hourRef.current = h;
      onTimeChange(h, minuteRef.current);
    },
    [onTimeChange],
  );

  const handleMinuteChange = useCallback(
    (m: number) => {
      minuteRef.current = m;
      onTimeChange(hourRef.current, m);
    },
    [onTimeChange],
  );

  return (
    <View style={styles.container}>
      <View style={styles.scrollerRow}>
        <ScrollColumn
          data={HOURS}
          selectedValue={hour}
          onValueChange={handleHourChange}
        />
        <View style={styles.colonContainer}>
          <Text style={styles.colonText}>:</Text>
        </View>
        <ScrollColumn
          data={MINUTES}
          selectedValue={minute}
          onValueChange={handleMinuteChange}
          padZero
        />
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SCROLLER_HEIGHT,
  },
  columnContainer: {
    height: SCROLLER_HEIGHT,
    width: 90,
    overflow: 'hidden',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontWeight: '100',
    letterSpacing: -2,
  },
  selectedText: {
    fontSize: 72,
    color: '#E8E8E3',
    opacity: 1,
  },
  unselectedText: {
    fontSize: 61,
    color: '#E8E8E3',
    opacity: 0.3,
  },
  colonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: SCROLLER_HEIGHT,
  },
  colonText: {
    fontSize: 72,
    fontWeight: '100',
    color: '#E8E8E3',
    letterSpacing: -2,
    marginTop: -4,
  },
});
