/**
 * Contribute tab — SIPs and lump-sum contributions for the active profile.
 */
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import type { SIP, Lumpsum } from '@financial-planner/types';
import { TransactionSection } from '../../components/transactions/TransactionSection';

export default function ContributeScreen() {
  const activeProfileId   = usePlannerStore((s) => s.activeProfileId);
  const profile           = usePlannerStore(selectActiveProfile);
  const addSip            = usePlannerStore((s) => s.addSip);
  const updateSip         = usePlannerStore((s) => s.updateSip);
  const removeSip         = usePlannerStore((s) => s.removeSip);
  const addLumpsum        = usePlannerStore((s) => s.addLumpsum);
  const updateLumpsum     = usePlannerStore((s) => s.updateLumpsum);
  const removeLumpsum     = usePlannerStore((s) => s.removeLumpsum);

  if (!profile || activeProfileId === 'all') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guard}>
          <Text style={styles.guardText}>
            Select an individual profile to manage contributions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Contributions</Text>

        <TransactionSection
          title="Recurring Contributions (SIPs)"
          type="sip"
          transactions={profile.sips}
          investments={profile.investments}
          onAdd={(tx) => addSip(profile.id, tx as Omit<SIP, 'id'>)}
          onUpdate={(tx) => updateSip(profile.id, tx as SIP)}
          onRemove={(id) => removeSip(profile.id, id)}
          accentColor="#4f46e5"
        />

        <TransactionSection
          title="One-Time Contributions (Lumpsums)"
          type="lumpsum"
          transactions={profile.lumpsums}
          investments={profile.investments}
          onAdd={(tx) => addLumpsum(profile.id, tx as Omit<Lumpsum, 'id'>)}
          onUpdate={(tx) => updateLumpsum(profile.id, tx as Lumpsum)}
          onRemove={(id) => removeLumpsum(profile.id, id)}
          accentColor="#4f46e5"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#f8fafc' },
  scroll:    { padding: 20, paddingBottom: 40 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#1e1b4b', marginBottom: 20 },
  guard:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guardText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
});
