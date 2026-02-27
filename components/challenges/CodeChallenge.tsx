import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getRandomProblem } from '../../lib/code-problems';
import type { CodeProblem } from '../../lib/code-problems';

// ─── Syntax Highlighting ────────────────────────────────────────────────
// Lightweight regex-based tokenizer — no external syntax highlighting library.
// Splits each line into colored spans for keywords, strings, numbers, and
// comments. Good enough for the short snippets in our code challenges.

const HIGHLIGHT_COLORS = {
  keyword: '#FFD600',
  string: '#00E676',
  number: '#40C4FF',
  comment: '#664A44',
  default: '#E8E8E3',
} as const;

const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'return', 'def', 'print',
  'let', 'const', 'var', 'function', 'true', 'false', 'null',
  'None', 'True', 'False',
]);

interface HighlightToken {
  text: string;
  color: string;
}

/**
 * Splits a single line of code into colored tokens for syntax highlighting.
 * Handles comments, strings, numbers, and keywords.
 */
function highlightLine(line: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // Check for single-line comment (# or //)
    const commentMatch = remaining.match(/^(#.*|\/\/.*)$/);
    if (commentMatch) {
      tokens.push({ text: commentMatch[0], color: HIGHLIGHT_COLORS.comment });
      remaining = '';
      continue;
    }

    // Check for inline comment at current position
    if (remaining.startsWith('#') || remaining.startsWith('//')) {
      tokens.push({ text: remaining, color: HIGHLIGHT_COLORS.comment });
      remaining = '';
      continue;
    }

    // Check for double-quoted string
    const doubleStringMatch = remaining.match(/^"(?:[^"\\]|\\.)*"/);
    if (doubleStringMatch) {
      tokens.push({ text: doubleStringMatch[0], color: HIGHLIGHT_COLORS.string });
      remaining = remaining.slice(doubleStringMatch[0].length);
      continue;
    }

    // Check for single-quoted string
    const singleStringMatch = remaining.match(/^'(?:[^'\\]|\\.)*'/);
    if (singleStringMatch) {
      tokens.push({ text: singleStringMatch[0], color: HIGHLIGHT_COLORS.string });
      remaining = remaining.slice(singleStringMatch[0].length);
      continue;
    }

    // Check for number (integer or float, including negative sign when preceded by operator context)
    const numberMatch = remaining.match(/^\b\d+(\.\d+)?\b/);
    if (numberMatch) {
      tokens.push({ text: numberMatch[0], color: HIGHLIGHT_COLORS.number });
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    // Check for keyword (must be a whole word)
    const wordMatch = remaining.match(/^[a-zA-Z_]\w*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const color = KEYWORDS.has(word) ? HIGHLIGHT_COLORS.keyword : HIGHLIGHT_COLORS.default;
      tokens.push({ text: word, color });
      remaining = remaining.slice(word.length);
      continue;
    }

    // Accumulate non-matching characters (operators, punctuation, whitespace)
    const otherMatch = remaining.match(/^[^a-zA-Z_"'#/\d]+|^[/](?!\/)/);
    if (otherMatch) {
      tokens.push({ text: otherMatch[0], color: HIGHLIGHT_COLORS.default });
      remaining = remaining.slice(otherMatch[0].length);
      continue;
    }

    // Fallback: consume a single character to avoid infinite loop
    tokens.push({ text: remaining[0], color: HIGHLIGHT_COLORS.default });
    remaining = remaining.slice(1);
  }

  return tokens;
}

// ─── Props ──────────────────────────────────────────────────────────────

interface CodeChallengeProps {
  onComplete: () => void;
}

// ─── Option Prefixes ────────────────────────────────────────────────────

const OPTION_PREFIXES = ['A)', 'B)', 'C)', 'D)'] as const;

// ─── Component ──────────────────────────────────────────────────────────

export function CodeChallenge({ onComplete }: CodeChallengeProps) {
  const [problem, setProblem] = useState<CodeProblem>(() => getRandomProblem());
  const [isFlashing, setIsFlashing] = useState(false);

  const usedIdsRef = useRef<string[]>([]);
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const codeLines = problem.code.split('\n');

  // ─── Handle option press ────────────────────────────────────────────

  const handleOptionPress = useCallback(
    (selectedIndex: number) => {
      if (isFlashing) return;

      if (selectedIndex === problem.correctIndex) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onComplete();
        return;
      }

      // Wrong answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

      // Flash screen white
      setIsFlashing(true);
      flashOpacity.setValue(1);
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setIsFlashing(false);
      });

      // Track used problem and load a new one
      usedIdsRef.current.push(problem.id);
      const nextProblem = getRandomProblem(usedIdsRef.current);
      setProblem(nextProblem);
    },
    [problem, isFlashing, flashOpacity, onComplete],
  );

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Code block */}
        <View style={styles.codeBlock}>
          {codeLines.map((line, lineIndex) => {
            const tokens = highlightLine(line);
            return (
              <View key={lineIndex} style={styles.codeLine}>
                <Text style={styles.lineNumber}>
                  {String(lineIndex + 1).padStart(2, ' ')}
                </Text>
                <View style={styles.lineContent}>
                  {tokens.map((token, tokenIndex) => (
                    <Text
                      key={tokenIndex}
                      style={[styles.codeText, { color: token.color }]}
                    >
                      {token.text}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Question */}
        <Text style={styles.questionText}>What is the output?</Text>

        {/* Answer grid: 2x2 */}
        <View style={styles.answerGrid}>
          {problem.options.map((option, index) => (
            <Pressable
              key={`${problem.id}-${index}`}
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => handleOptionPress(index)}
              disabled={isFlashing}
            >
              <Text style={styles.optionText}>
                {OPTION_PREFIXES[index]} {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* White flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          { opacity: flashOpacity },
        ]}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  codeBlock: {
    backgroundColor: '#1A0A08',
    borderRadius: 12,
    padding: 16,
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 24,
  },
  lineNumber: {
    fontFamily: MONO_FONT,
    fontSize: 16,
    color: '#664A44',
    width: 28,
    textAlign: 'right',
    marginRight: 12,
  },
  lineContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  codeText: {
    fontFamily: MONO_FONT,
    fontSize: 18,
    lineHeight: 24,
  },
  questionText: {
    fontSize: 20,
    color: '#E8E8E3',
    marginTop: 16,
    marginBottom: 16,
    fontWeight: '600',
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionButton: {
    width: '48%',
    height: 60,
    backgroundColor: '#1A0A08',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  optionButtonPressed: {
    opacity: 0.7,
  },
  optionText: {
    fontFamily: MONO_FONT,
    fontSize: 24,
    color: '#E8E8E3',
    textAlign: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});
