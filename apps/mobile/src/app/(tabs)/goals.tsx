/**
 * Goals tab — placeholder.
 * Full implementation: Phase 2g.
 */
import { View, Text, StyleSheet } from 'react-native';

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>
      <Text style={styles.body}>Coming soon — plan and track your financial goals here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  title:     { fontSize: 22, fontWeight: '800', color: '#1e1b4b', marginBottom: 8 },
  body:      { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
