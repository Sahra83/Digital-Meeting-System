import { useCallback, useEffect, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';


import { AppButton } from '@/components/AppButton';
import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { organizerTaskApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { Task } from '@/types/app';
import { formatDate } from '@/utils/format';

export function SubmittedTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState('');
  const [error, setError] = useState('');



  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await organizerTaskApi.getSubmittedTasks();
      const all = result.tasks || [];
      setTasks(all);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load submitted tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);



  // Fetch tasks initially
  useEffect(() => {
    void Promise.resolve().then(loadTasks);
  }, [loadTasks]);

  async function approve(task: Task) {
    setReviewingId(task.id);
    try {
      await organizerTaskApi.approveTask(task.id);
      await loadTasks();
    } catch (nextError) {
      Alert.alert('Approve failed', nextError instanceof Error ? nextError.message : 'Unable to approve task');
    } finally {
      setReviewingId('');
    }
  }

  async function reject(task: Task) {
    setReviewingId(task.id);
    try {
      await organizerTaskApi.rejectTask(task.id, 'Rejected from mobile admin portal');
      await loadTasks();
    } catch (nextError) {
      Alert.alert('Reject failed', nextError instanceof Error ? nextError.message : 'Unable to reject task');
    } finally {
      setReviewingId('');
    }
  }

  async function downloadAttachment(attachmentId: string) {
    try {
      const blob = await organizerTaskApi.downloadTaskAttachment(attachmentId);
      Alert.alert('Download', 'Attachment downloaded (blob length: ' + blob.size + ')');
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <Screen>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Submitted Tasks</Text>
            <Text style={styles.subtitle}>Submitted action items for the selected meeting.</Text>
            <DataState loading={loading} error={error} onRetry={loadTasks} />
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No submitted tasks for this meeting." /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.task_description}</Text>
              <StatusBadge label={item.status} />
            </View>
            <Text style={styles.meta}>{item.meeting_title || 'Meeting task'} · {formatDate(item.meeting_date)}</Text>
            <Text style={styles.meta}>Submitted by {item.participant_name || item.assigned_to_name || 'Participant'}</Text>
            <Text style={styles.meta}>Deadline: {formatDate(item.deadline)}</Text>
            {item.completion_note ? <Text style={styles.note}>{item.completion_note}</Text> : null}
            {item.attachments?.length ? (
              <View style={styles.attachments}>
                {item.attachments.map((att) => (
                  <Text key={att.id} style={styles.attachmentLink} onPress={() => downloadAttachment(att.id)}>{att.filename}</Text>
                ))}
              </View>
            ) : null}
            {item.status === 'submitted' ? (
              <View style={styles.actions}>
                <AppButton title="Approve" onPress={() => approve(item)} disabled={reviewingId === item.id} style={styles.actionButton} />
                <AppButton title="Reject" variant="outline" onPress={() => reject(item)} disabled={reviewingId === item.id} style={styles.actionButton} />
              </View>
            ) : null}
          </View>
        )}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  attachmentLink: { color: colors.primary, textDecorationLine: 'underline' },
  attachments: { marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  note: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 13,
    padding: spacing.sm,
  },

  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
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
