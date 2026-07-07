import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme/appTheme';

export function StatusBadge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label.replaceAll('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
