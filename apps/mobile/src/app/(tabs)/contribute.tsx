/**
 * Contribute tab — placeholder.
 * Full implementation: Phase 2f.
 */
import { View, Text, StyleSheet } from 'react-native';

export default function ContributeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contribute</Text>
      <Text style={styles.body}>Coming soon — set up SIPs and lump-sum contributions here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  title:     { fontSize: 22, fontWeight: '800', color: '#1e1b4b', marginBottom: 8 },
  body:      { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
