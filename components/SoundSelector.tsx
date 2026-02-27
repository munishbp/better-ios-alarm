// ─── Sound Selector ───────────────────────────────────────────────────────────
// Presents the current sound choice as a tappable label. On tap, opens a
// slide-up modal bottom sheet with the full list of alarm sounds. Uses RN's
// built-in Modal + transparent backdrop instead of a third-party bottom sheet.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import type { SoundKey } from '../lib/types';

// ─── Constants ───────────────────────────────────────────────────────
const SOUND_OPTIONS: SoundKey[] = ['SIREN', 'PULSE', 'GLASS', 'DRILL', 'HORN'];

// ─── Props ───────────────────────────────────────────────────────────
interface SoundSelectorProps {
  selected: SoundKey;
  onSelect: (key: SoundKey) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function SoundSelector({ selected, onSelect }: SoundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: SoundKey) => {
    onSelect(key);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => setIsOpen(true)}
        style={styles.trigger}
      >
        <Text style={styles.triggerText}>{selected || 'SIREN'}</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {SOUND_OPTIONS.map((sound) => {
              const isSelected = sound === selected;
              return (
                <TouchableOpacity
                  key={sound}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(sound)}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{sound}</Text>
                  {isSelected && <View style={styles.dot} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  triggerText: {
    fontSize: 15,
    color: '#9999A1',
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  option: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 17,
    color: '#E8E8E3',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E8E3',
  },
});
