import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { JourneyGoal, JourneyMilestone } from '@/constants/journey';
import { Fonts, Spacing } from '@/constants/theme';
import { useJourneyColors } from '@/hooks/use-journey-colors';
import { useTheme } from '@/hooks/use-theme';

/** Vertical distance between the centers of two consecutive stops. */
const ROW_HEIGHT = 168;
/** Every stop's center sits this far below its row's top, so nodes of different sizes align. */
const CENTER_Y = 42;
const LINE = 4;
const CURVE = 28;
const NODE = 44;
const GOAL_NODE = 72;
const CENTER_X = 50;
const LEFT_X = 26;
const RIGHT_X = 74;
const LABEL_WIDTH = '42%';

type JourneyPathProps = {
  goal: JourneyGoal;
  milestones: JourneyMilestone[];
  currentAnchorRef?: Ref<View>;
  onCurrentLayout?: () => void;
};

export function JourneyPath({ goal, milestones, currentAnchorRef, onCurrentLayout }: JourneyPathProps) {
  const colors = useJourneyColors();

  // The destination is at the top, so the furthest milestone renders first.
  const stops = milestones.map((milestone, index) => ({ milestone, step: index + 1 })).reverse();
  const xs = stops.map((_, index) => (index % 2 === 0 ? RIGHT_X : LEFT_X));

  return (
    <View style={styles.path}>
      <View style={styles.goalCopy}>
        <ThemedText type="code" style={[styles.eyebrow, { color: colors.gold }]}>
          Graduation
        </ThemedText>
        <ThemedText type="subtitle" style={[styles.goalTitle, { fontFamily: Fonts.serif }]}>
          {goal.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.goalDetail}>
          {goal.detail}
        </ThemedText>
      </View>

      <View style={[styles.row, stops.length === 0 && styles.lastRow]}>
        {stops.length > 0 && <Connector fromX={CENTER_X} toX={xs[0]} travelled={false} />}
        <GoalNode />
      </View>

      {stops.map(({ milestone, step }, index) => {
        const isLast = index === stops.length - 1;

        return (
          <View
            key={milestone.id}
            ref={milestone.status === 'current' ? currentAnchorRef : undefined}
            collapsable={false}
            onLayout={milestone.status === 'current' ? onCurrentLayout : undefined}
            style={[styles.row, isLast && styles.lastRow]}>
            {!isLast && (
              <Connector
                fromX={xs[index]}
                toX={xs[index + 1]}
                travelled={milestone.status !== 'upcoming'}
              />
            )}
            <MilestoneStop x={xs[index]} step={step} milestone={milestone} />
          </View>
        );
      })}
    </View>
  );
}

/**
 * An S-curve from one stop down to the next, built from two rounded boxes that meet at the
 * midpoint: the upper one leaves the top stop vertically and turns toward the other side, the
 * lower one finishes the turn and drops into the bottom stop.
 */
function Connector({ fromX, toX, travelled }: { fromX: number; toX: number; travelled: boolean }) {
  const colors = useJourneyColors();
  const color = travelled ? colors.accent : colors.track;

  const goingRight = toX > fromX;
  const midX = (fromX + toX) / 2;
  const upperHeight = ROW_HEIGHT / 2;
  // Overlap by one line width so the two horizontal runs meet without a step.
  const lowerHeight = ROW_HEIGHT - upperHeight + LINE;
  const lowerTop = CENTER_Y + upperHeight - LINE;

  // The outer edge of each box is nudged half a line width so the stroke is centered on the node.
  const upper = goingRight
    ? {
        left: `${fromX}%` as const,
        right: `${100 - midX}%` as const,
        marginLeft: -LINE / 2,
        borderLeftWidth: LINE,
        borderBottomLeftRadius: CURVE,
      }
    : {
        left: `${midX}%` as const,
        right: `${100 - fromX}%` as const,
        marginRight: -LINE / 2,
        borderRightWidth: LINE,
        borderBottomRightRadius: CURVE,
      };

  const lower = goingRight
    ? {
        left: `${midX}%` as const,
        right: `${100 - toX}%` as const,
        marginRight: -LINE / 2,
        borderRightWidth: LINE,
        borderTopRightRadius: CURVE,
      }
    : {
        left: `${toX}%` as const,
        right: `${100 - midX}%` as const,
        marginLeft: -LINE / 2,
        borderLeftWidth: LINE,
        borderTopLeftRadius: CURVE,
      };

  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.segment,
          upper,
          { top: CENTER_Y, height: upperHeight, borderBottomWidth: LINE, borderColor: color },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.segment,
          lower,
          { top: lowerTop, height: lowerHeight, borderTopWidth: LINE, borderColor: color },
        ]}
      />
    </>
  );
}

function Halo({ size, nodeSize, color }: { size: number; nodeSize: number; color: string }) {
  const offset = -(size - nodeSize) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: offset,
        left: offset,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

function GoalNode() {
  const colors = useJourneyColors();

  return (
    <View style={[styles.node, styles.goalNode, { left: `${CENTER_X}%` }]}>
      <Halo size={120} nodeSize={GOAL_NODE} color={colors.goldGlow} />
      <Halo size={96} nodeSize={GOAL_NODE} color={colors.goldSoft} />
      <View style={[styles.core, styles.goalCore, { backgroundColor: colors.gold }]}>
        <ThemedText style={[styles.goalGlyph, { color: colors.onAccent }]}>★</ThemedText>
      </View>
    </View>
  );
}

const STATUS_LABEL = {
  done: 'Completed',
  current: 'You are here',
  upcoming: 'Upcoming',
} as const;

function MilestoneStop({
  x,
  step,
  milestone,
}: {
  x: number;
  step: number;
  milestone: JourneyMilestone;
}) {
  const colors = useJourneyColors();
  const theme = useTheme();
  const { status } = milestone;
  const labelOnLeft = x > CENTER_X;

  return (
    <>
      <View style={[styles.node, { left: `${x}%` }]}>
        {status === 'current' && (
          <>
            <Halo size={80} nodeSize={NODE} color={colors.accentGlow} />
            <Halo size={62} nodeSize={NODE} color={colors.accentSoft} />
          </>
        )}
        {status === 'upcoming' ? (
          <View
            style={[
              styles.core,
              { backgroundColor: theme.background, borderColor: colors.track, borderWidth: 2 },
            ]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {step}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.core, { backgroundColor: colors.accent }]}>
            {status === 'done' ? (
              <ThemedText style={[styles.checkGlyph, { color: colors.onAccent }]}>✓</ThemedText>
            ) : (
              <View style={[styles.currentDot, { backgroundColor: colors.onAccent }]} />
            )}
          </View>
        )}
      </View>

      <View
        accessible
        accessibilityLabel={`${milestone.title}, ${STATUS_LABEL[status]}, ${milestone.timeframe}`}
        style={[
          styles.label,
          labelOnLeft
            ? {
                right: `${100 - x}%`,
                marginRight: NODE / 2 + Spacing.three,
                alignItems: 'flex-end',
              }
            : { left: `${x}%`, marginLeft: NODE / 2 + Spacing.three, alignItems: 'flex-start' },
        ]}>
        {status === 'current' && (
          <View style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
            <ThemedText type="code" style={[styles.chipText, { color: colors.accent }]}>
              You are here
            </ThemedText>
          </View>
        )}
        <ThemedText
          type="smallBold"
          themeColor={status === 'upcoming' ? 'textSecondary' : 'text'}
          numberOfLines={3}
          style={labelOnLeft && styles.textRight}>
          {milestone.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={labelOnLeft && styles.textRight}>
          {milestone.timeframe}
        </ThemedText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  path: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  goalCopy: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.five,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  goalTitle: {
    textAlign: 'center',
  },
  goalDetail: {
    textAlign: 'center',
  },
  row: {
    height: ROW_HEIGHT,
  },
  lastRow: {
    height: CENTER_Y * 2,
  },
  segment: {
    position: 'absolute',
  },
  node: {
    position: 'absolute',
    top: CENTER_Y - NODE / 2,
    width: NODE,
    height: NODE,
    marginLeft: -NODE / 2,
  },
  goalNode: {
    top: CENTER_Y - GOAL_NODE / 2,
    width: GOAL_NODE,
    height: GOAL_NODE,
    marginLeft: -GOAL_NODE / 2,
  },
  core: {
    width: '100%',
    height: '100%',
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCore: {
    borderRadius: GOAL_NODE / 2,
  },
  goalGlyph: {
    fontSize: 30,
    lineHeight: 36,
  },
  checkGlyph: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: 700,
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    position: 'absolute',
    top: 0,
    width: LABEL_WIDTH,
    minHeight: CENTER_Y * 2,
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    marginBottom: Spacing.one,
  },
  chipText: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  textRight: {
    textAlign: 'right',
  },
});
