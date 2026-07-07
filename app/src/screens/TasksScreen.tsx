import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { participantApi, taskApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { Meeting, Task } from '@/types/app';
import { formatDate, isAdmin } from '@/utils/format';

export function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const admin = isAdmin(user);

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId),
    [meetings, selectedMeetingId],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      if (admin) {
        const meetingsResult = await taskApi.getMeetings();
        const nextMeetings = meetingsResult.meetings || [];
        const meetingId = selectedMeetingId || nextMeetings[0]?.id || '';
        setMeetings(nextMeetings);
        setSelectedMeetingId(meetingId);
        if (meetingId) {
          const taskResult = await taskApi.getTasksByMeeting(meetingId);
          setTasks((taskResult.tasks || []).filter((task) => !['completed', 'submitted'].includes((task.status || '').toLowerCase())));
        } else {
          setTasks([]);
        }
      } else {
        const result = await participantApi.getMyTasks();
        setTasks((result.tasks || []).filter((task) => !['completed', 'submitted'].includes((task.status || '').toLowerCase())));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [admin, selectedMeetingId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function startTask(taskId: string) {
    try {
      await participantApi.startTask(taskId);
      load();
    } catch (nextError) {
      Alert.alert('Unable to start task', nextError instanceof Error ? nextError.message : 'Request failed');
    }
  }

  async function submitTask(taskId: string) {
    try {
      await participantApi.submitTask(taskId, completionNotes[taskId] || '');
      setCompletionNotes((current) => ({ ...current, [taskId]: '' }));
      load();
    } catch (nextError) {
      Alert.alert('Unable to submit task', nextError instanceof Error ? nextError.message : 'Request failed');
    }
  }

  async function resendEmail(taskId: string) {
    try {
      const result = await taskApi.resendEmail(taskId);
      Alert.alert('Reminder sent', result.message);
    } catch (nextError) {
      Alert.alert('Unable to resend email', nextError instanceof Error ? nextError.message : 'Request failed');
    }
  }

  return (
    <Screen>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{admin ? 'Action Items' : 'Tasks'}</Text>
            <Text style={styles.subtitle}>{admin ? selectedMeeting?.title || 'Select a meeting with tasks.' : 'Your action items and submission workflow.'}</Text>
            {admin && meetings.length > 1 ? (
              <View style={styles.meetingPicker}>
                {meetings.map((meeting) => (
                  <AppButton
                    key={meeting.id}
                    title={meeting.title}
                    variant={meeting.id === selectedMeetingId ? 'secondary' : 'outline'}
                    onPress={() => setSelectedMeetingId(meeting.id)}
                    style={styles.meetingButton}
                  />
                ))}
              </View>
            ) : null}
            <DataState loading={loading} error={error} onRetry={load} />
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No pending tasks found." /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.task_description}</Text>
            <Text style={styles.meta}>{item.meeting_title || selectedMeeting?.title || 'Meeting task'}</Text>
            <Text style={styles.meta}>Deadline: {formatDate(item.deadline)}</Text>
            {item.assigned_to_name ? <Text style={styles.meta}>Assigned to {item.assigned_to_name}</Text> : null}
            {item.rejection_reason ? <Text style={styles.warning}>{item.rejection_reason}</Text> : null}
            <StatusBadge label={item.is_overdue ? 'overdue' : item.status} />
            {!admin && item.status !== 'completed' && item.status !== 'submitted' ? (
              <View style={styles.actions}>
                {item.status === 'pending' ? <AppButton title="Start" variant="outline" onPress={() => startTask(item.id)} /> : null}
                <TextInput
                  multiline
                  placeholder="Completion note"
                  placeholderTextColor={colors.muted}
                  style={styles.noteInput}
                  value={completionNotes[item.id] || ''}
                  onChangeText={(text) => setCompletionNotes((current) => ({ ...current, [item.id]: text }))}
                />
                <AppButton title="Submit" onPress={() => submitTask(item.id)} />
              </View>
            ) : null}
            {admin ? <AppButton title="Resend Reminder" variant="outline" onPress={() => resendEmail(item.id)} /> : null}
          </View>
        )}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  meetingPicker: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  meetingButton: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
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
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  warning: {
    color: colors.danger,
    fontSize: 13,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  noteInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 76,
    padding: spacing.sm,
    textAlignVertical: 'top',
  },
});
