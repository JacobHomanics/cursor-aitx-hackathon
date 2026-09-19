import { useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { collegeYearLabel, INDUSTRY_INTERESTS, interestLabel, locationLabel, PREFERRED_COMPANIES, ROLE_INTERESTS, type CollegeYear } from '@/constants/onboarding';
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
  const { ready, isAuthenticated, displayName, userId, logout } = useAppAuth();
  const convexUser = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const convexStatus = useQuery(api.status.ping, isConvexConfigured ? {} : 'skip');

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
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Signed in with Privy</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {displayName ?? userId}
      </ThemedText>
      {convexUser ? (
        <OnboardingSummary
          collegeYear={convexUser.collegeYear}
          city={convexUser.city}
          state={convexUser.state}
          industryInterest={convexUser.industryInterest}
          roleInterest={convexUser.roleInterest}
          preferredCompany={convexUser.preferredCompany}
        />
      ) : null}
      <ThemedText type="code" themeColor="textSecondary">
        Convex {convexStatus?.ok ? 'connected' : 'waiting'}
        {convexUser ? ` · ${convexUser.privyDid}` : ''}
      </ThemedText>
      <AppButton label="Sign out" variant="secondary" onPress={() => void logout()} />
    </ThemedView>
  );
}

function OnboardingSummary({
  collegeYear,
  city,
  state,
  industryInterest,
  roleInterest,
  preferredCompany,
}: {
  collegeYear?: CollegeYear;
  city?: string;
  state?: string;
  industryInterest?: string;
  roleInterest?: string;
  preferredCompany?: string;
}) {
  const summary = [
    collegeYearLabel(collegeYear),
    locationLabel(city, state),
    interestLabel(INDUSTRY_INTERESTS, industryInterest),
    interestLabel(ROLE_INTERESTS, roleInterest),
    interestLabel(PREFERRED_COMPANIES, preferredCompany),
  ].filter(Boolean);

  if (summary.length === 0) {
    return null;
  }

  return (
    <ThemedText type="small" themeColor="textSecondary">
      {summary.join(' · ')}
    </ThemedText>
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
      <ThemedText type="smallBold">Sign in</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Email, phone, Google, or Twitter. Convex stores the user after login.
      </ThemedText>

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

      <AppTextField
        autoCapitalize="none"
        autoComplete={method === 'email' ? 'email' : 'tel'}
        keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
        onChangeText={method === 'email' ? setEmail : setPhone}
        placeholder={method === 'email' ? 'you@example.com' : '+1 555 555 0100'}
        value={identifier}
      />
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
      <AppButton
        disabled={busy || identifier.length === 0 || (codeSent && code.length === 0)}
        label={codeSent ? (busy ? 'Signing in…' : 'Verify code') : busy ? 'Sending…' : 'Send code'}
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

      <ThemedText type="small" themeColor="textSecondary" style={styles.or}>
        or
      </ThemedText>

      <AppButton
        disabled={busy || socialLogin.busy}
        label="Continue with Google"
        variant="secondary"
        onPress={() => loginWithSocial('google')}
      />
      <AppButton
        disabled={busy || socialLogin.busy}
        label="Continue with Twitter"
        variant="secondary"
        onPress={() => loginWithSocial('twitter')}
      />
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
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
