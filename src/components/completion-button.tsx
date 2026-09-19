import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Spacing } from '@/constants/theme';

type CompletionButtonProps = {
  done: boolean;
  todoLabel: string;
  doneLabel: string;
  onChange: (done: boolean) => Promise<unknown>;
};

export function CompletionButton({ done, todoLabel, doneLabel, onChange }: CompletionButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <AppButton
        variant={done ? 'primary' : 'secondary'}
        disabled={pending}
        label={done ? `✓ ${doneLabel} · tap to undo` : todoLabel}
        onPress={() => {
          setError(null);
          setPending(true);
          void onChange(!done)
            .catch((changeError: unknown) => {
              setError(changeError instanceof Error ? changeError.message : 'Could not save');
            })
            .finally(() => {
              setPending(false);
            });
        }}
      />
      {error ? (
        <ThemedText type="small" themeColor="textSecondary">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
});
