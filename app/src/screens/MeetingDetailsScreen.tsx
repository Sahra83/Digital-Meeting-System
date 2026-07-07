import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { meetingApi, participantApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { Meeting, RootStackParamList, Task } from '@/types/app';
import { formatDate, formatTime, isAdmin } from '@/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'MeetingDetails'>;

type Details = {
  meeting?: Meeting;
  minutes?: Record<string, unknown> | null;
  discussionPoints?: Record<string, unknown>[];
  decisions?: Record<string, unknown>[];
  documents?: Record<string, unknown>[];
  tasks?: Task[];
};

export function MeetingDetailsScreen({ route }: Props) {
  const { user } = useAuth();
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await participantApi.getMeetingDetails(route.params.meetingId);
      setDetails({
        meeting: result.meeting,
        minutes: (result.minutes as Record<string, unknown>) || null,
        discussionPoints: result.discussionPoints as Record<string, unknown>[],
        decisions: result.decisions as Record<string, unknown>[],
        documents: result.documents as Record<string, unknown>[],
        tasks: result.tasks,
      });
    } catch (nextError) {
      if (isAdmin(user)) {
        const [meetingResult, minutesResult] = await Promise.all([
          meetingApi.get(route.params.meetingId),
          meetingApi.getMinutes(route.params.meetingId).catch(() => ({ minutes: null })),
        ]);
        setDetails({
          meeting: meetingResult.meeting,
          minutes: (minutesResult.minutes as Record<string, unknown>) || null,
          discussionPoints: [],
          decisions: [],
          documents: [],
          tasks: [],
        });
      } else {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load meeting details');
      }
    } finally {
      setLoading(false);
    }
  }, [route.params.meetingId, user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const meeting = details?.meeting;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <DataState loading={loading} error={error} onRetry={load} />
        {meeting ? (
          <>
            <Text style={styles.title}>{meeting.title}</Text>
            <StatusBadge label={meeting.status} />
            <View style={styles.panel}>
              <Info label="Date" value={`${formatDate(meeting.meeting_date)} ${formatTime(meeting.meeting_time)}`} />
              <Info label="Location" value={meeting.location || 'Not provided'} />
              <Info label="Organizer" value={meeting.organizer_name || meeting.organizer_fullname || 'Not provided'} />
              <Info label="Agenda" value={meeting.agenda || 'No agenda provided'} />
            </View>
            <Section title="Minutes">
              {details?.minutes ? (
                <Text style={styles.body}>{String(details.minutes.summary || details.minutes.content || 'Minutes are available for this meeting.')}</Text>
              ) : (
                <Text style={styles.muted}>No minutes have been recorded yet.</Text>
              )}
            </Section>
            <Section title="Discussion Points">
              {details?.discussionPoints?.length ? details.discussionPoints.map((point, index) => (
                <Text key={String(point.id || index)} style={styles.body}>{String(point.point || point.description || point.content || '')}</Text>
              )) : <Text style={styles.muted}>No discussion points available.</Text>}
            </Section>
            <Section title="Decisions">
              {details?.decisions?.length ? details.decisions.map((decision, index) => (
                <Text key={String(decision.id || index)} style={styles.body}>{String(decision.decision_text || decision.description || decision.content || '')}</Text>
              )) : <Text style={styles.muted}>No decisions available.</Text>}
            </Section>
            <Section title="Tasks">
              {details?.tasks?.length ? details.tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <Text style={styles.body}>{task.task_description}</Text>
                  <StatusBadge label={task.status} />
                </View>
              )) : <Text style={styles.muted}>No assigned tasks available.</Text>}
            </Section>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoRow: {
    gap: 3,
  },
  infoLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
  taskRow: {
    gap: spacing.xs,
  },
});
