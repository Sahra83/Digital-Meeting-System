import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { meetingApi, participantApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { MainTabParamList, Meeting, RootStackParamList } from '@/types/app';
import { formatDate, formatTime, isAdmin } from '@/utils/format';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Meetings' | 'ManageMeetings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function MeetingsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = isAdmin(user) ? await meetingApi.list() : await participantApi.getMyMeetings();
      setMeetings(result.meetings || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <Screen>
      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{isAdmin(user) ? 'Manage Meetings' : 'Meetings'}</Text>
            <Text style={styles.subtitle}>{isAdmin(user) ? 'All scheduled meetings from the backend.' : 'Meetings assigned to you.'}</Text>
            <DataState loading={loading} error={error} onRetry={load} />
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No meetings found." /> : null}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('MeetingDetails', { meetingId: item.id, title: item.title })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <StatusBadge label={item.status} />
            </View>
            <Text style={styles.meta}>{formatDate(item.meeting_date)} {formatTime(item.meeting_time)}</Text>
            <Text style={styles.meta}>{item.location || item.organizer_name || 'No location provided'}</Text>
          </Pressable>
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    borderColor: colors.secondary,
  },
  row: {
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
});
