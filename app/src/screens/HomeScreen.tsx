import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { meetingApi, participantApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { Meeting, Task } from '@/types/app';
import { displayName, formatDate, formatTime, isAdmin } from '@/utils/format';

type DashboardData = {
  meetingCount: number;
  taskCount: number;
  completedCount: number;
  pendingCount: number;
  meetings: Meeting[];
  tasks: Task[];
};

export function HomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      if (isAdmin(user)) {
        const result = await meetingApi.dashboard();
        const dashboard = result.dashboard || {};
        const meetings = ((dashboard.recentMeetings || dashboard.meetings || []) as Meeting[]);
        setData({
          meetingCount: Number(dashboard.totalMeetings || dashboard.meetingCount || meetings.length || 0),
          taskCount: Number(dashboard.totalTasks || dashboard.taskCount || 0),
          completedCount: Number(dashboard.completedTasks || dashboard.completed_count || 0),
          pendingCount: Number(dashboard.pendingTasks || dashboard.pending_count || 0),
          meetings,
          tasks: ((dashboard.urgentTasks || dashboard.tasks || []) as Task[]),
        });
      } else {
        const result = await participantApi.getDashboardStats();
        setData({
          meetingCount: result.meetingCount || 0,
          taskCount: result.taskCount || 0,
          completedCount: result.taskStats?.completed || 0,
          pendingCount: result.taskStats?.pending || 0,
          meetings: result.meetings || [],
          tasks: result.tasks || [],
        });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const stats = [
    ['Meetings', data?.meetingCount || 0],
    ['Tasks', data?.taskCount || 0],
    ['Pending', data?.pendingCount || 0],
    ['Done', data?.completedCount || 0],
  ] as const;

  return (
    <Screen>
      <FlatList
        data={data?.meetings || []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>{displayName(user)}</Text>
            <View style={styles.statsGrid}>
              {stats.map(([label, value]) => (
                <View key={label} style={styles.statCard}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Recent meetings</Text>
            <DataState loading={loading} error={error} onRetry={load} />
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No meetings available." /> : null}
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
        ListFooterComponent={
          data?.tasks?.length ? (
            <View style={styles.footer}>
              <Text style={styles.sectionTitle}>Priority tasks</Text>
              {data.tasks.map((task) => (
                <View key={task.id} style={styles.item}>
                  <Text style={styles.itemTitle}>{task.task_description}</Text>
                  <Text style={styles.meta}>{task.meeting_title || 'Meeting task'}</Text>
                  <StatusBadge label={task.status || task.priority} />
                </View>
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.lg,
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
  statValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
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
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  footer: {
    marginTop: spacing.md,
  },
});
