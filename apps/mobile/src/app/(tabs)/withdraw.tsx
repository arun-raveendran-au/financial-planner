/**
 * Withdraw tab — SWPs and one-time withdrawals for the active profile.
 */
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import type { SWP, OneTimeWithdrawal } from '@financial-planner/types';
import { TransactionSection } from '../../components/transactions/TransactionSection';

export default function WithdrawScreen() {
  const activeProfileId        = usePlannerStore((s) => s.activeProfileId);
  const profile                = usePlannerStore(selectActiveProfile);
  const addSwp                 = usePlannerStore((s) => s.addSwp);
  const updateSwp              = usePlannerStore((s) => s.updateSwp);
  const removeSwp              = usePlannerStore((s) => s.removeSwp);
  const addOneTimeWithdrawal   = usePlannerStore((s) => s.addOneTimeWithdrawal);
  const updateOneTimeWithdrawal = usePlannerStore((s) => s.updateOneTimeWithdrawal);
  const removeOneTimeWithdrawal = usePlannerStore((s) => s.removeOneTimeWithdrawal);

  if (!profile || activeProfileId === 'all') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guard}>
          <Text style={styles.guardText}>
            Select an individual profile to manage withdrawals.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Withdrawals</Text>

        <TransactionSection
          title="Recurring Withdrawals (SWPs)"
          type="swp"
          transactions={profile.swps}
          investments={profile.investments}
          onAdd={(tx) => addSwp(profile.id, tx as Omit<SWP, 'id'>)}
          onUpdate={(tx) => updateSwp(profile.id, tx as SWP)}
          onRemove={(id) => removeSwp(profile.id, id)}
          accentColor="#e11d48"
        />

        <TransactionSection
          title="One-Time Withdrawals"
          type="oneTimeWithdrawal"
          transactions={profile.oneTimeWithdrawals}
          investments={profile.investments}
          onAdd={(tx) => addOneTimeWithdrawal(profile.id, tx as Omit<OneTimeWithdrawal, 'id'>)}
          onUpdate={(tx) => updateOneTimeWithdrawal(profile.id, tx as OneTimeWithdrawal)}
          onRemove={(id) => removeOneTimeWithdrawal(profile.id, id)}
          accentColor="#e11d48"
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
