/**
 * REPORT CARD — the progress summary as a sheet from the station office:
 * a navy header band, the five totals in neat cells, then skill bars and
 * mission stars as tidy rows. Calm and adult; still the station's paper.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Stars } from '@/minigames/types';
import { palette, radii, spacing } from '@/theme';
import type { MasteryRow, StatTotals } from '@/state/selectors';
import { ProgressBar, StarRow, Text } from '@/ui';
import { Rule } from './Paper';

export interface MissionRow {
  id: string;
  title: string;
  stars: Stars;
  plays: number;
}

export interface ReportCardProps {
  name: string;
  rankName: string;
  level: number;
  xp: number;
  stats: StatTotals;
  mastery: readonly MasteryRow[];
  missions: readonly MissionRow[];
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.cell}>
      <Text variant="h2" color={palette.navy} style={styles.cellValue}>
        {String(value)}
      </Text>
      <Text variant="tiny" color={palette.navyMuted} center>
        {label}
      </Text>
    </View>
  );
}

export function ReportCard({ name, rankName, level, xp, stats, mastery, missions }: ReportCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.band}>
        <Text variant="tiny" color={palette.white}>
          PROGRESS REPORT
        </Text>
        <Text variant="tiny" color="rgba(255,255,255,0.75)">
          STATION SPARK
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.who}>
          <Text variant="h3">{name}</Text>
          <Text variant="small" color={palette.navySoft}>
            {`${rankName} · Level ${level} · ${xp} XP`}
          </Text>
        </View>

        <View style={styles.cells}>
          <Cell value={stats.missions} label="missions" />
          <Cell value={stats.skills} label="games" />
          <Cell value={stats.recipes} label="recipes" />
          <Cell value={stats.words} label="words" />
          <Cell value={stats.badges} label="badges" />
        </View>

        <Rule />
        <Text variant="bodyStrong">Skills practised</Text>
        {mastery.length === 0 ? (
          <Text variant="small" color={palette.navySoft}>
            Nothing yet — skills appear here after the first few games.
          </Text>
        ) : (
          <View style={styles.rows}>
            {mastery.map((row) => (
              <View key={row.skill} style={styles.skillRow}>
                <Text variant="small" style={styles.skillLabel}>
                  {row.label}
                </Text>
                <View style={styles.skillBar}>
                  <ProgressBar value={row.ratio} height={10} color={palette.waterCyan} sheen={false} accessibilityLabel={`${row.label}: ${Math.round(row.ratio * 100)} percent`} />
                </View>
                <Text variant="tiny" color={palette.navySoft} style={styles.skillPct}>
                  {`${Math.round(row.ratio * 100)}%`}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Rule />
        <Text variant="bodyStrong">Missions</Text>
        {missions.length === 0 ? (
          <Text variant="small" color={palette.navySoft}>
            No missions completed yet.
          </Text>
        ) : (
          <View style={styles.rows}>
            {missions.map((m) => (
              <View key={m.id} style={styles.missionRow}>
                <Text variant="small" style={styles.missionTitle}>
                  {m.title}
                </Text>
                <Text variant="tiny" color={palette.navyMuted}>
                  {m.plays === 1 ? '1 play' : `${m.plays} plays`}
                </Text>
                <StarRow stars={m.stars} size={18} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.white, borderRadius: radii.card, overflow: 'hidden' },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  body: { padding: spacing.md, gap: spacing.xs },
  who: { gap: 2 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  cell: {
    flexGrow: 1,
    flexBasis: 60,
    alignItems: 'center',
    backgroundColor: palette.panel,
    borderRadius: radii.tag,
    paddingVertical: spacing.xs,
    paddingHorizontal: 4,
  },
  cellValue: { includeFontPadding: false },
  rows: { gap: 6 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  skillLabel: { flexBasis: '42%', flexShrink: 1 },
  skillBar: { flex: 1 },
  skillPct: { width: 40, textAlign: 'right' },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  missionTitle: { flex: 1 },
});
