import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { APP_NAME } from '@/constants/app';
import { Colors, MaxContentWidth, Spacing, WebTabBarHeight } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';

const TAB_ICONS = {
  home: { ios: 'map', web: 'map' },
  profile: { ios: 'person', web: 'person' },
  planner: { ios: 'calendar', web: 'calendar_month' },
} as const;

type TabIconName = (typeof TAB_ICONS)[keyof typeof TAB_ICONS];

export default function AppTabs() {
  const { isDesktopWeb } = useBreakpoint();
  const iconOnly = !isDesktopWeb;

  return (
    <Tabs>
      <TabSlot style={[styles.slot, isDesktopWeb && styles.slotDesktop]} />
      <TabList asChild>
        <CustomTabList placement={isDesktopWeb ? 'top' : 'bottom'}>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={TAB_ICONS.home} iconOnly={iconOnly}>
              Home
            </TabButton>
          </TabTrigger>
          <TabTrigger name="weekly-planner" href="/weekly-planner" asChild>
            <TabButton icon={TAB_ICONS.planner} iconOnly={iconOnly}>
              Weekly Planner
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={TAB_ICONS.profile} iconOnly={iconOnly}>
              Profile
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  iconOnly = false,
  ...props
}: TabTriggerSlotProps & { icon: TabIconName; iconOnly?: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const label = typeof children === 'string' ? children : undefined;

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, iconOnly && styles.tabButtonIconOnly]}>
        <SymbolView
          name={icon}
          size={18}
          tintColor={isFocused ? colors.text : colors.textSecondary}
        />
        {iconOnly ? null : (
          <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
            {children}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

type CustomTabListProps = TabListProps & {
  placement: 'top' | 'bottom';
};

export function CustomTabList({ placement, ...props }: CustomTabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const insets = useSafeAreaInsets();
  const isDesktop = placement === 'top';

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        isDesktop ? styles.tabListTop : styles.tabListBottom,
        !isDesktop && { paddingBottom: Math.max(insets.bottom, Spacing.two) },
      ]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {isDesktop ? (
          <ThemedText type="smallBold" style={styles.brandText}>
            {APP_NAME}
          </ThemedText>
        ) : null}

        {props.children}

        {isDesktop ? (
          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={styles.externalPressable}>
              <ThemedText type="link">Docs</ThemedText>
              <SymbolView
                tintColor={colors.text}
                name={{ ios: 'arrow.up.right.square', web: 'link' }}
                size={12}
              />
            </Pressable>
          </ExternalLink>
        ) : null}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  slotDesktop: {
    paddingTop: WebTabBarHeight + Spacing.three,
  },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  tabListTop: {
    top: 0,
    left: 0,
    paddingTop: Spacing.three,
  },
  tabListBottom: {
    bottom: 0,
    left: 0,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tabButtonIconOnly: {
    paddingHorizontal: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
