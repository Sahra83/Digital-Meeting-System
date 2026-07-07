import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { DataState } from '@/components/DataState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { participantApi, userApi } from '@/services/api';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { User } from '@/types/app';
import { displayName, getRoleName, isAdmin } from '@/utils/format';

export function ProfileScreen() {
  const { logout, updateCurrentUser, user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = isAdmin(user) ? await userApi.getProfile() : await participantApi.getProfile();
      const nextProfile = 'user' in result ? result.user : result.profile;
      setProfile(nextProfile);
      setUsername(nextProfile.username || '');
      setFullname(nextProfile.fullname || '');
      setEmail(nextProfile.email || '');
      setPhone(nextProfile.phone || '');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    try {
      if (isAdmin(user)) {
        const result = await userApi.updateProfile({ fullname, email, phone });
        setProfile(result.user);
        updateCurrentUser(result.user);
      } else {
        const result = await participantApi.updateProfile({ username });
        setProfile(result.profile);
        updateCurrentUser({ ...user, ...result.profile } as User);
      }
      Alert.alert('Profile updated', 'Your profile was saved successfully.');
    } catch (nextError) {
      Alert.alert('Unable to save profile', nextError instanceof Error ? nextError.message : 'Request failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <DataState loading={loading} error={error} onRetry={load} />
        {profile ? (
          <>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName(profile).slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{displayName(profile)}</Text>
                <Text style={styles.role}>{getRoleName(profile) || getRoleName(user)}</Text>
              </View>
            </View>
            <View style={styles.form}>
              <Field label="Username" value={username} onChangeText={setUsername} editable={!isAdmin(user)} />
              <Field label="Full name" value={fullname} onChangeText={setFullname} editable={isAdmin(user)} />
              <Field label="Email" value={email} onChangeText={setEmail} editable={isAdmin(user)} keyboardType="email-address" />
              <Field label="Phone" value={phone} onChangeText={setPhone} editable={isAdmin(user)} keyboardType="phone-pad" />
              <AppButton title={saving ? 'Saving...' : 'Save profile'} disabled={saving} onPress={saveProfile} />
              <AppButton title="Logout" variant="outline" onPress={logout} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Field({
  editable,
  keyboardType,
  label,
  onChangeText,
  value,
}: {
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor={colors.muted}
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
      />
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
    fontSize: 28,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  avatarText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '900',
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  role: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  inputDisabled: {
    color: colors.muted,
  },
});
