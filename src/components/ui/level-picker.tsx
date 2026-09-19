import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { SkillLevel } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';

const LEVELS: SkillLevel[] = [1, 2, 3, 4, 5];

export function LevelPicker({
  value,
  onChange,
}: {
  value: SkillLevel | null;
  onChange: (level: SkillLevel) => void;
}) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Level ${level}`}
            key={level}
            onPress={() => onChange(level)}
            style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.level}>
              <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                {level}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  press: {
    flex: 1,
  },
  level: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
