import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { userApi, type UserPayload } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { Role, User, UserLog } from '@/types/app';
import { displayName, formatDate, getRoleName } from '@/utils/format';

type UserForm = {
  fullname: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
};

const emptyForm: UserForm = {
  fullname: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  roleId: '',
};

function userToForm(user: User): UserForm {
  return {
    fullname: user.fullname || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    roleId: user.role_id ? String(user.role_id) : '',
  };
}

function compact(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildPayload(form: UserForm, editing: boolean): UserPayload {
  const payload: UserPayload = {
    fullname: form.fullname.trim(),
    username: form.username.trim(),
    email: compact(form.email),
    phone: compact(form.phone),
    roleId: Number(form.roleId),
  };

  if (!editing || form.password.trim()) {
    payload.password = form.password.trim();
  }

  return payload;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [participationUserId, setParticipationUserId] = useState<string | null>(null);
  const [participation, setParticipation] = useState<string[]>([]);
  const [participationLoading, setParticipationLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [usersResult, rolesResult, logsResult] = await Promise.all([
        userApi.getUsers(),
        userApi.listRoles(),
        userApi.listUserLogs(12),
      ]);
      setUsers(usersResult.users || []);
      setRoles(rolesResult.roles || []);
      setLogs(logsResult.logs || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load user management');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    users.forEach((user) => {
      const role = getRoleName(user) || 'Unknown';
      counts.set(role, (counts.get(role) || 0) + 1);
    });
    return Array.from(counts, ([role, count]) => ({ role, count }));
  }, [users]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ ...emptyForm, roleId: roles[0]?.id ? String(roles[0].id) : '' });
    setModalVisible(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm(userToForm(user));
    setModalVisible(true);
  };

  const submit = async () => {
    const roleId = Number(form.roleId);
    if (!form.fullname.trim() || !form.username.trim() || !roleId || (!editingUser && form.password.trim().length < 4)) {
      Alert.alert('Missing details', 'Full name, username, role, and a 4+ character password are required for new users.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, Boolean(editingUser));
      if (editingUser) {
        await userApi.updateUser(editingUser.id, payload);
      } else {
        await userApi.createUser(payload);
      }
      setModalVisible(false);
      await load();
    } catch (nextError) {
      Alert.alert('Save failed', nextError instanceof Error ? nextError.message : 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (user: User) => {
    Alert.alert(
      'Delete user',
      `Delete ${displayName(user)}? This follows the backend delete behavior and clears related references.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.deleteUser(user.id);
              if (participationUserId === user.id) {
                setParticipationUserId(null);
                setParticipation([]);
              }
              await load();
            } catch (nextError) {
              Alert.alert('Delete failed', nextError instanceof Error ? nextError.message : 'Unable to delete user');
            }
          },
        },
      ],
    );
  };

  const toggleParticipation = async (user: User) => {
    if (participationUserId === user.id) {
      setParticipationUserId(null);
      setParticipation([]);
      return;
    }

    setParticipationUserId(user.id);
    setParticipation([]);
    setParticipationLoading(true);
    try {
      const result = await userApi.getParticipation(user.id);
      setParticipation(result.meetings || []);
    } catch (nextError) {
      Alert.alert('Participation failed', nextError instanceof Error ? nextError.message : 'Unable to load participation');
    } finally {
      setParticipationLoading(false);
    }
  };

  return (
    <Screen>
      <FlatList
        data={users}
        keyExtractor={(item, index) => item.id || `user-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>Admin portal</Text>
                <Text style={styles.title}>User Management</Text>
                <Text style={styles.subtitle}>Users, roles, participation, and audit logs from the backend.</Text>
              </View>
              <AppButton title="New User" onPress={openCreate} style={styles.newButton} />
            </View>
            <DataState loading={loading} error={error} onRetry={load} />
            {!loading && !error ? (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{users.length}</Text>
                    <Text style={styles.summaryLabel}>Total users</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{users.filter((user) => user.status === 'active').length}</Text>
                    <Text style={styles.summaryLabel}>Active</Text>
                  </View>
                </View>
                <View style={styles.roleStrip}>
                  {roleCounts.map((item) => (
                    <View key={item.role} style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{item.role}</Text>
                      <Text style={styles.rolePillCount}>{item.count}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.sectionTitle}>Users</Text>
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={!loading && !error ? <DataState empty="No users returned by the backend." /> : null}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userTopRow}>
              <View style={styles.userIdentity}>
                <Text style={styles.userName}>{displayName(item)}</Text>
                <Text style={styles.userMeta}>{item.username} · {item.email || 'No email'}</Text>
              </View>
              <StatusBadge label={item.status || 'active'} />
            </View>
            <Text style={styles.userMeta}>{getRoleName(item) || 'No role'} · {item.phone || 'No phone'} · {item.portal || 'admin'}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={() => toggleParticipation(item)}>
                <Text style={styles.actionText}>{participationUserId === item.id ? 'Hide meetings' : 'Meetings'}</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => openEdit(item)}>
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.deleteAction]} onPress={() => deleteUser(item)}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
            {participationUserId === item.id ? (
              <View style={styles.participationBox}>
                {participationLoading ? (
                  <Text style={styles.userMeta}>Loading participation...</Text>
                ) : participation.length ? (
                  participation.map((meeting) => <Text key={meeting} style={styles.participationText}>{meeting}</Text>)
                ) : (
                  <Text style={styles.userMeta}>No meeting participation found.</Text>
                )}
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={!loading && !error ? (
          <View style={styles.logsCard}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            {logs.length ? logs.map((log, index) => (
              <View key={`${log.occurred_at}-${index}`} style={styles.logRow}>
                <Text style={styles.logTitle}>{log.details || log.title || log.type || 'User activity'}</Text>
                <Text style={styles.userMeta}>{log.actor_name || log.actor_username || 'System'} · {formatDate(log.occurred_at)}</Text>
              </View>
            )) : <Text style={styles.userMeta}>No audit logs yet.</Text>}
          </View>
        ) : null}
        contentContainerStyle={styles.content}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Create User'}</Text>
            <FormField label="Full name" value={form.fullname} onChangeText={(fullname) => setForm((prev) => ({ ...prev, fullname }))} />
            <FormField label="Username" value={form.username} onChangeText={(username) => setForm((prev) => ({ ...prev, username }))} autoCapitalize="none" />
            <FormField label="Email" value={form.email} onChangeText={(email) => setForm((prev) => ({ ...prev, email }))} autoCapitalize="none" keyboardType="email-address" />
            <FormField label="Phone" value={form.phone} onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))} keyboardType="phone-pad" />
            <FormField
              label={editingUser ? 'New password (optional)' : 'Password'}
              value={form.password}
              onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
              secureTextEntry
            />
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleChoices}>
              {roles.map((role) => {
                const selected = form.roleId === String(role.id);
                return (
                  <Pressable
                    key={role.id}
                    style={[styles.roleChoice, selected && styles.roleChoiceSelected]}
                    onPress={() => setForm((prev) => ({ ...prev, roleId: String(role.id) }))}
                  >
                    <Text style={[styles.roleChoiceText, selected && styles.roleChoiceTextSelected]}>{role.role_name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={styles.modalButton} disabled={saving} />
              <AppButton title={saving ? 'Saving' : 'Save'} onPress={submit} style={styles.modalButton} disabled={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

type FormFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
};

function FormField({ label, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  actionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  deleteAction: {
    borderColor: '#FEE4E2',
  },
  deleteText: {
    color: colors.danger,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  fieldWrap: {
    marginTop: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
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
  logsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    maxHeight: '92%',
    padding: spacing.lg,
    width: '100%',
  },
  modalShade: {
    backgroundColor: 'rgba(31, 41, 55, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  newButton: {
    minWidth: 104,
  },
  participationBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  participationText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  roleChoice: {
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  roleChoiceSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChoiceText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  roleChoiceTextSelected: {
    color: colors.surface,
  },
  roleChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rolePill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rolePillCount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  rolePillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  roleStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  userIdentity: {
    flex: 1,
  },
  userMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  userName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  userTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
