import { Component, ErrorInfo, PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/theme/appTheme';

type State = {
  error: Error | null;
};

export class StartupErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Startup render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>The app hit a startup error.</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  message: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    padding: spacing.md,
  },
});
