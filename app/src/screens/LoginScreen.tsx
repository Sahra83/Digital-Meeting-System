import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { useAuth } from '@/context/AuthContext';
import { colors, radii, spacing } from '@/theme/appTheme';
import type { RootStackParamList } from '@/types/app';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      // AppNavigator will automatically switch to 'Main' once isAuthenticated becomes true
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>DM</Text>
      </View>
      <Text style={styles.title}>Digital Meeting Minutes</Text>
      <Text style={styles.subtitle}>Sign in to manage meetings, minutes, and action items.</Text>

      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          placeholder="Username"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          disabled={submitting || !username.trim() || !password}
          title={submitting ? 'Signing in...' : 'Login'}
          onPress={handleLogin}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    // remove horizontal padding – we'll add margin on the form instead
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 54,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 54,
  },
  brandMarkText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
    marginHorizontal: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    height: 52,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
});
