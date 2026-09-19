import { useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppAuth } from '@/hooks/use-app-auth';
import { useLoginWithEmail } from '@/hooks/use-login-with-email';
import { usePhoneLogin } from '@/hooks/use-phone-login';
import { useSocialLogin } from '@/hooks/use-social-login';
import type { SocialProvider } from '@/hooks/use-social-login.types';
import { isConvexConfigured, isPrivyConfigured } from '@/lib/env';
import { api } from '@convex/_generated/api';

export function AuthCard() {
  if (!isPrivyConfigured) {
    return <SetupCard />;
  }

  return <ConfiguredAuthCard />;
}

function SetupCard() {
  const convexStatus = useQuery(api.status.ping, isConvexConfigured ? {} : 'skip');

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Connect Privy to enable login</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Add EXPO_PUBLIC_PRIVY_APP_ID and EXPO_PUBLIC_PRIVY_CLIENT_ID to .env.local, then run npx
        convex env set PRIVY_APP_ID with the same app ID.
      </ThemedText>
      <ThemedText type="code" themeColor="textSecondary">
        Convex {convexStatus?.ok ? 'connected' : isConvexConfigured ? 'waiting' : 'not configured'}
      </ThemedText>
    </ThemedView>
  );
}

function ConfiguredAuthCard() {
  const { ready, isAuthenticated, logout } = useAppAuth();

  if (!ready) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          Restoring session…
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <ThemedView type="backgroundElement" style={styles.sessionRow}>
      <ThemedText type="small" themeColor="textSecondary">
        Signed in
      </ThemedText>
      <AppButton label="Sign out" variant="secondary" onPress={() => void logout()} />
    </ThemedView>
  );
}

function LoginForm() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailLogin = useLoginWithEmail();
  const phoneLogin = usePhoneLogin();
  const socialLogin = useSocialLogin();
  const identifier = method === 'email' ? email : phone;

  const run = (action: () => Promise<unknown>) => {
    setError(null);
    void (async () => {
      try {
        setBusy(true);
        await action();
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : 'Login failed');
      } finally {
        setBusy(false);
      }
    })();
  };

  const loginWithSocial = (provider: SocialProvider) => {
    run(() => socialLogin.loginWithProvider(provider));
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.methodRow}>
        <MethodTab
          label="Email"
          selected={method === 'email'}
          onPress={() => {
            setMethod('email');
            setCode('');
            setCodeSent(false);
            setError(null);
          }}
        />
        <MethodTab
          label="Phone"
          selected={method === 'phone'}
          onPress={() => {
            setMethod('phone');
            setCode('');
            setCodeSent(false);
            setError(null);
          }}
        />
      </View>

      {codeSent ? (
        <AppTextField
          autoComplete="one-time-code"
          keyboardType="number-pad"
          onChangeText={setCode}
          placeholder="6-digit code"
          value={code}
        />
      ) : null}
      {error ? (
        <ThemedText type="small" themeColor="textSecondary">
          {error}
        </ThemedText>
      ) : null}
      <View style={styles.socialRow}>
        <View style={styles.socialBtn}>
          <AppTextField
            autoCapitalize="none"
            autoComplete={method === 'email' ? 'email' : 'tel'}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            onChangeText={method === 'email' ? setEmail : setPhone}
            placeholder={method === 'email' ? 'you@example.com' : '+1 555 555 0100'}
            value={identifier}
          />
        </View>
        <AppButton
          disabled={busy || identifier.length === 0 || (codeSent && code.length === 0)}
          label={codeSent ? (busy ? 'Signing in…' : 'Verify') : busy ? 'Sending…' : 'Send code'}
          onPress={() => {
            run(async () => {
              if (!codeSent) {
                if (method === 'email') {
                  await emailLogin.sendCode({ email });
                } else {
                  await phoneLogin.sendCode(phone);
                }
                setCodeSent(true);
                return;
              }

              if (method === 'email') {
                await emailLogin.loginWithCode({ code, email } as { code: string; email: string });
                return;
              }

              await phoneLogin.loginWithCode(code, phone);
            });
          }}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.or}>
        or
      </ThemedText>

      <View style={styles.socialRow}>
        <View style={styles.socialBtn}>
          <AppButton
            disabled={busy || socialLogin.busy}
            label="Google"
            variant="secondary"
            onPress={() => loginWithSocial('google')}
          />
        </View>
        <View style={styles.socialBtn}>
          <AppButton
            disabled={busy || socialLogin.busy}
            label="Twitter"
            variant="secondary"
            onPress={() => loginWithSocial('twitter')}
          />
        </View>
      </View>
    </ThemedView>
  );
}

function MethodTab({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.methodTab}>
        <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  socialBtn: {
    flex: 1,
  },
  sessionRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  methodTab: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  or: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
