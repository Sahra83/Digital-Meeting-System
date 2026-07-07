import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { meetingApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';

type Stats = Record<string, number | string | undefined>;
type ChartPoint = { label?: string; value?: number };
type Comparison = {
  meeting_id?: string;
  meeting_title?: string;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  completed_pct?: number;
};

type DashboardReport = {
  stats?: Stats;
  meetingTaskComparison?: Comparison[];
  statusDistribution?: ChartPoint[];
  topParticipants?: {
    participant_name?: string;
    meetings_attended?: number;
    tasks_assigned?: number;
    tasks_completed?: number;
    tasks_pending?: number;
  }[];
  delinquentMeetings?: {
    id?: string;
    title?: string;
    total_tasks?: number;
    pending_tasks?: number;
  }[];
};

function numberValue(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function ReportMetric({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{numberValue(value)}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View style={styles.barRow}>
      <Text numberOfLines={1} style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max((value / Math.max(max, 1)) * 100, value ? 8 : 0)}%` }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

export function ReportsScreen() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await meetingApi.dashboard();
      setReport((result.dashboard || {}) as DashboardReport);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const comparisons = report?.meetingTaskComparison || [];
  const maxTasks = Math.max(...comparisons.map((item) => numberValue(item.total_tasks)), 1);

  return (
    <Screen>
      <FlatList
        data={comparisons}
        keyExtractor={(item, index) => item.meeting_id || `comparison-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>Report data from the backend meeting dashboard endpoint.</Text>
            <DataState loading={loading} error={error} onRetry={load} />
            {!loading && !error ? (
              <>
                <View style={styles.metricsGrid}>
                  <ReportMetric label="Meetings" value={report?.stats?.total_meetings} />
                  <ReportMetric label="Scheduled" value={report?.stats?.scheduled_meetings} />
                  <ReportMetric label="Completed" value={report?.stats?.completed_meetings} />
                  <ReportMetric label="Pending Items" value={report?.stats?.pending_action_items} />
                </View>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Status Distribution</Text>
                  {(report?.statusDistribution || []).length ? report?.statusDistribution?.map((item, index) => (
                    <View key={`${item.label}-${index}`} style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{item.label || 'scheduled'}</Text>
                      <Text style={styles.statusValue}>{numberValue(item.value)}</Text>
                    </View>
                  )) : <Text style={styles.empty}>No status distribution returned.</Text>}
                </View>
                <Text style={styles.sectionTitle}>Meeting Task Comparison</Text>
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No report rows returned by the backend." /> : null}
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <Text style={styles.itemTitle}>{item.meeting_title || 'Untitled meeting'}</Text>
            <MiniBar label="Total" value={numberValue(item.total_tasks)} max={maxTasks} />
            <MiniBar label="Completed" value={numberValue(item.completed_tasks)} max={maxTasks} />
            <MiniBar label="Pending" value={numberValue(item.pending_tasks)} max={maxTasks} />
            <Text style={styles.meta}>{numberValue(item.completed_pct)}% complete</Text>
          </View>
        )}
        ListFooterComponent={!loading && !error ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attention Needed</Text>
            {(report?.delinquentMeetings || []).length ? report?.delinquentMeetings?.map((item) => (
              <View key={item.id || item.title} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{item.title || 'Untitled meeting'}</Text>
                <Text style={styles.statusValue}>{numberValue(item.pending_tasks)} pending</Text>
              </View>
            )) : <Text style={styles.empty}>No delinquent meetings returned.</Text>}
          </View>
        ) : null}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  barFill: {
    backgroundColor: colors.secondary,
    borderRadius: radii.sm,
    height: '100%',
  },
  barLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    width: 76,
  },
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  barTrack: {
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  barValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    width: 32,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  metricValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  statusRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statusValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
});
