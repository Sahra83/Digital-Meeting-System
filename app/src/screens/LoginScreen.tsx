import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
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

      <View style={styles.card}>
        <TextInput
          autoCapitalize="none"
          placeholder="Username"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCorrect={false}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          title={submitting ? 'Signing in...' : 'Login'}
          disabled={submitting || !username.trim() || !password}
          onPress={handleLogin}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 54,
    justifyContent: 'center',
    width: 54,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
