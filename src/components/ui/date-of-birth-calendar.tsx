import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { parseDateOfBirth } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function yearBounds() {
  const now = new Date().getFullYear();
  return { min: now - 80, max: now - 13 };
}

function defaultMonth() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function DateOfBirthCalendar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const selected = value && parseDateOfBirth(value) ? value : null;
  const initial = selected
    ? { year: Number(selected.slice(0, 4)), month: Number(selected.slice(5, 7)) }
    : defaultMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const days = useMemo(() => {
    const first = new Date(year, month - 1, 1).getDay();
    const count = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [year, month]);

  const shiftMonth = (delta: number) => {
    const { min, max } = yearBounds();
    const next = new Date(year, month - 1 + delta, 1);
    const nextYear = Math.min(max, Math.max(min, next.getFullYear()));
    setYear(nextYear);
    setMonth(nextYear === next.getFullYear() ? next.getMonth() + 1 : nextYear === max ? 12 : 1);
  };

  const shiftYear = (delta: number) => {
    const { min, max } = yearBounds();
    setYear((current) => Math.min(max, Math.max(min, current + delta)));
  };

  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Select a date';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <HeaderButton label="‹" onPress={() => shiftMonth(-1)} />
        <ThemedText type="smallBold">
          {MONTHS[month - 1]} {year}
        </ThemedText>
        <HeaderButton label="›" onPress={() => shiftMonth(1)} />
        <HeaderButton label="−" onPress={() => shiftYear(-1)} />
        <HeaderButton label="+" onPress={() => shiftYear(1)} />
      </View>
      <View style={styles.week}>
        {WEEKDAYS.map((day) => (
          <ThemedText key={day} type="code" themeColor="textSecondary" style={styles.weekday}>
            {day}
          </ThemedText>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day, index) => {
          if (day == null) {
            return <View key={`empty-${index}`} style={styles.day} />;
          }
          const iso = toIso(year, month, day);
          const allowed = parseDateOfBirth(iso) != null;
          const isSelected = selected === iso;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={iso}
              disabled={!allowed}
              key={iso}
              onPress={() => onChange(iso)}
              style={({ pressed }) => [styles.day, pressed && allowed && styles.pressed]}>
              <ThemedView
                type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.dayInner}>
                <ThemedText
                  type="smallBold"
                  themeColor={allowed ? (isSelected ? 'text' : 'textSecondary') : 'textSecondary'}
                  style={!allowed ? styles.disabled : undefined}>
                  {day}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
      <ThemedText type="code" themeColor="textSecondary">
        {selectedLabel}
      </ThemedText>
    </ThemedView>
  );
}

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <ThemedView type="backgroundSelected" style={styles.headerButton}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    height: 28,
    padding: 1,
  },
  dayInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.one,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
