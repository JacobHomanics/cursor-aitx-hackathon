import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppTextField } from '@/components/ui/app-text-field';
import { ENTER_OWN_VALUE, MAX_INTEREST_LENGTH, type InterestOption } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppSelectProps = {
  options: readonly InterestOption[];
  value: string | null;
  customValue?: string;
  placeholder: string;
  customPlaceholder?: string;
  searchable?: boolean;
  allowCustom?: boolean;
  onChange: (value: string) => void;
  onCustomChange?: (value: string) => void;
};

export function AppSelect({
  options,
  value,
  customValue = '',
  placeholder,
  customPlaceholder = 'Type your own',
  searchable = false,
  allowCustom = true,
  onChange,
  onCustomChange,
}: AppSelectProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isCustom = allowCustom && value === ENTER_OWN_VALUE;
  const selectedLabel = isCustom
    ? 'Enter your own'
    : options.find((option) => option.value === value)?.label;
  const filtered = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const select = (next: string) => {
    onChange(next);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selectedLabel ?? placeholder}
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundSelected" style={styles.trigger}>
          <ThemedText type="small" themeColor={selectedLabel ? 'text' : 'textSecondary'}>
            {selectedLabel ?? placeholder}
          </ThemedText>
          <SymbolView
            name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
            size={16}
            tintColor={theme.textSecondary}
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
          />
        </ThemedView>
      </Pressable>

      {isOpen ? (
        <ThemedView type="backgroundElement" style={styles.menu}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.menuScroll}>
          {searchable ? (
            <View style={styles.search}>
              <AppTextField
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search"
                value={query}
              />
            </View>
          ) : null}
          {filtered.map((option) => {
            const selected = value === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={option.label}
                key={option.value}
                onPress={() => select(option.value)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView
                  type={selected ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.option}>
                  <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                    {option.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
          {allowCustom ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enter your own"
              onPress={() => select(ENTER_OWN_VALUE)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView
                type={isCustom ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.option}>
                <ThemedText type="smallBold" themeColor={isCustom ? 'text' : 'textSecondary'}>
                  Enter your own
                </ThemedText>
              </ThemedView>
            </Pressable>
          ) : null}
          </ScrollView>
        </ThemedView>
      ) : null}

      {isCustom ? (
        <AppTextField
          autoFocus
          maxLength={MAX_INTEREST_LENGTH}
          onChangeText={(text) => onCustomChange?.(text)}
          placeholder={customPlaceholder}
          value={customValue}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  trigger: {
    minHeight: 40,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  menu: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  menuScroll: {
    maxHeight: 160,
  },
  search: {
    padding: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
