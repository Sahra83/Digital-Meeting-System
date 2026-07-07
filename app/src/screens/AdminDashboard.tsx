import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { meetingApi, systemApi, userApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { MainTabParamList, Meeting, User, UserLog } from '@/types/app';
import { formatDate, formatTime } from '@/utils/format';

type DashboardStats = {
  total_meetings?: number;
  scheduled_meetings?: number;
  completed_meetings?: number;
  upcoming_soon?: number;
  scheduled_past_meetings?: number;
  closing_soon_meetings?: number;
  meetings_with_minutes?: number;
  pending_action_items?: number;
  total_action_items?: number;
  total_users?: number;
  active_users?: number;
};

type ChartPoint = {
  label: string;
  value: number;
};

type TaskComparison = {
  meeting_id?: string;
  meeting_title?: string;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  completed_pct?: number;
};

type AdminDashboardResponse = {
  stats?: DashboardStats;
  upcomingMeetings?: Meeting[];
  meetingTaskComparison?: TaskComparison[];
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
    meeting_date?: string;
    total_tasks?: number;
    pending_tasks?: number;
  }[];
  statusDistribution?: ChartPoint[];
};

type LoadState = {
  dashboard: AdminDashboardResponse | null;
  logs: UserLog[];
  systemOverview: unknown;
  users: User[];
};

const chartColors = ['#2F3A8F', '#2ED3B7', '#F59E0B', '#7C3AED', '#16A34A', '#EF4444'];

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'danger' | 'muted' }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, tone === 'danger' && styles.dangerText, tone === 'muted' && styles.mutedText]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarChart({ data }: { data: ChartPoint[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Action Items By Meeting</Text>
      {data.length ? (
        data.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.barRow}>
            <Text numberOfLines={1} style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max((item.value / maxValue) * 100, item.value ? 8 : 0)}%`, backgroundColor: chartColors[index % chartColors.length] }]} />
            </View>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No action item data yet.</Text>
      )}
    </View>
  );
}

function PieChart({ data }: { data: ChartPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Meeting Status Pie Chart</Text>
      {total ? (
        <>
          <View style={styles.pieStack}>
            {data.map((item, index) => (
              <View
                key={`${item.label}-${index}`}
                style={[
                  styles.pieSegment,
                  {
                    backgroundColor: chartColors[index % chartColors.length],
                    flexGrow: item.value,
                    flexBasis: `${Math.max((item.value / total) * 100, 1)}%`,
                  },
                ]}
              />
            ))}
          </View>
          {data.map((item, index) => (
            <View key={`${item.label}-legend-${index}`} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: chartColors[index % chartColors.length] }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendValue}>{item.value} ({Math.round((item.value / total) * 100)}%)</Text>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.emptyText}>No status data yet.</Text>
      )}
    </View>
  );
}

export function AdminDashboard() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [data, setData] = useState<LoadState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [dashboardResult, usersResult, logsResult, systemOverview] = await Promise.all([
        meetingApi.dashboard(),
        userApi.getUsers(),
        userApi.listUserLogs(8),
        systemApi.getOverview(),
      ]);
      setData({
        dashboard: (dashboardResult.dashboard || {}) as AdminDashboardResponse,
        logs: logsResult.logs || [],
        systemOverview,
        users: usersResult.users || [],
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const stats = data?.dashboard?.stats || {};
  const statusDistribution = (data?.dashboard?.statusDistribution || []).map((item) => ({
    label: item.label || 'scheduled',
    value: toNumber(item.value),
  }));
  const taskBars = (data?.dashboard?.meetingTaskComparison || []).slice(0, 6).map((item) => ({
    label: item.meeting_title || 'Untitled meeting',
    value: toNumber(item.total_tasks),
  }));

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();
    (data?.users || []).forEach((user) => {
      const role = user.role_name || user.role || 'Unknown';
      counts.set(role, (counts.get(role) || 0) + 1);
    });
    return Array.from(counts, ([label, value]) => ({ label, value }));
  }, [data?.users]);

  return (
    <Screen>
      <FlatList
        data={data?.dashboard?.upcomingMeetings || []}
        keyExtractor={(item, index) => item.id || `meeting-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>Admin portal</Text>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Dashboard</Text>
                <Text style={styles.subtitle}>Live data from meetings, users, logs, and system overview.</Text>
              </View>
            </View>

            <DataState loading={loading} error={error} onRetry={load} />

            {!loading && !error ? (
              <>
                <View style={styles.statsGrid}>
                  <StatCard label="Meetings" value={toNumber(stats.total_meetings)} />
                  <StatCard label="Users" value={toNumber(stats.total_users || data?.users.length)} />
                  <StatCard label="Active Users" value={toNumber(stats.active_users)} />
                  <StatCard label="Action Items" value={toNumber(stats.total_action_items)} />
                  <StatCard label="Pending Items" value={toNumber(stats.pending_action_items)} tone="danger" />
                  <StatCard label="Minutes" value={toNumber(stats.meetings_with_minutes)} tone="muted" />
                </View>

                <PieChart data={statusDistribution.length ? statusDistribution : roleSummary} />
                <BarChart data={taskBars} />

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Top Participants</Text>
                  {(data?.dashboard?.topParticipants || []).length ? (
                    data?.dashboard?.topParticipants?.map((item, index) => (
                      <View key={`${item.participant_name}-${index}`} style={styles.rankRow}>
                        <Text numberOfLines={1} style={styles.rankName}>{item.participant_name || 'Unnamed participant'}</Text>
                        <Text style={styles.rankMeta}>{toNumber(item.tasks_completed)}/{toNumber(item.tasks_assigned)} tasks</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No participant activity yet.</Text>
                  )}
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
                  <Text style={styles.sectionMeta}>{data?.dashboard?.upcomingMeetings?.length || 0}</Text>
                </View>
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No upcoming meetings found." /> : null}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <StatusBadge label={item.status} />
            </View>
            <Text style={styles.meta}>{formatDate(item.meeting_date)} {formatTime(item.meeting_time)}</Text>
            <Text style={styles.meta}>{item.location || item.organizer_name || 'No location provided'}</Text>
          </View>
        )}
        ListFooterComponent={!loading && !error ? (
          <View style={styles.footer}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Recent User Logs</Text>
              {data?.logs.length ? data.logs.map((log, index) => (
                <View key={`${log.occurred_at}-${index}`} style={styles.logRow}>
                  <Text style={styles.logTitle}>{log.details || log.title || log.type || 'User activity'}</Text>
                  <Text style={styles.meta}>{log.actor_name || log.actor_username || 'System'} · {formatDate(log.occurred_at)}</Text>
                </View>
              )) : <Text style={styles.emptyText}>No logs recorded yet.</Text>}
            </View>
            <Text style={styles.systemMeta}>System overview sections: {Object.keys((data?.systemOverview || {}) as Record<string, unknown>).length}</Text>
          </View>
        ) : null}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  barFill: {
    borderRadius: radii.sm,
    height: '100%',
  },
  barLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
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
    height: 12,
    overflow: 'hidden',
    width: 110,
  },
  barValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    width: 28,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  chartTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  dangerText: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  itemHeader: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legendValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  logRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 3,
    paddingVertical: spacing.sm,
  },
  logTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  menuButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  mutedText: {
    color: colors.muted,
  },
  pieSegment: {
    minWidth: 4,
  },
  pieStack: {
    borderRadius: 999,
    flexDirection: 'row',
    height: 28,
    marginTop: spacing.sm,
    overflow: 'hidden',
    width: '100%',
  },
  rankMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  rankName: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  rankRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  statValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  systemMeta: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
});
