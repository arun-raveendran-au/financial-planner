/**
 * Goals tab — define life goals with target years and per-investment withdrawals.
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { usePlannerStore, selectActiveProfile } from '@financial-planner/store';
import type { Goal } from '@financial-planner/types';

// ─── Goal modal ───────────────────────────────────────────────────────────────

interface GoalModalProps {
  goal: Partial<Goal>;
  investmentNames: { id: number; name: string }[];
  onSave: (goal: Partial<Goal>) => void;
  onCancel: () => void;
}

function GoalModal({ goal, investmentNames, onSave, onCancel }: GoalModalProps) {
  const isEdit = !!goal.id;
  const [name, setName]               = useState(goal.name ?? '');
  const [year, setYear]               = useState(String(goal.year ?? new Date().getFullYear() + 5));
  const [withdrawals, setWithdrawals] = useState(goal.withdrawals ?? []);

  const updateWithdrawal = (invId: number, raw: string) => {
    const amount = parseInt(raw) || 0;
    const existing = withdrawals.find((w) => w.investmentId === invId);
    if (existing) {
      setWithdrawals(withdrawals.map((w) => w.investmentId === invId ? { ...w, amount } : w));
    } else {
      setWithdrawals([...withdrawals, { investmentId: invId, amount }]);
    }
  };

  const getWithdrawalAmount = (invId: number): string => {
    const w = withdrawals.find((w) => w.investmentId === invId);
    return w && w.amount > 0 ? String(w.amount) : '';
  };

  const handleSave = () => {
    onSave({
      ...goal,
      name: name.trim() || 'Goal',
      year: parseInt(year) || new Date().getFullYear() + 5,
      withdrawals: withdrawals.filter((w) => w.amount > 0),
    });
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{isEdit ? 'Edit' : 'Add'} Goal</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Name */}
            <Text style={styles.label}>Goal Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Child's Education"
              testID="goal-name-input"
            />

            {/* Year */}
            <Text style={styles.label}>Target Year</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              placeholder={String(new Date().getFullYear() + 5)}
              testID="goal-year-input"
            />

            {/* Withdrawals */}
            <Text style={styles.label}>Withdrawals at Goal Year</Text>
            {investmentNames.length === 0 ? (
              <Text style={styles.noInvestments}>Add investments first.</Text>
            ) : (
              investmentNames.map((inv) => (
                <View key={inv.id} style={styles.withdrawalRow}>
                  <Text style={styles.withdrawalName} numberOfLines={1}>{inv.name}</Text>
                  <TextInput
                    style={styles.withdrawalInput}
                    value={getWithdrawalAmount(inv.id)}
                    onChangeText={(v) => updateWithdrawal(inv.id, v)}
                    keyboardType="number-pad"
                    placeholder="₹ Amount"
                  />
                </View>
              ))
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} testID="save-goal-button">
                <Text style={styles.saveBtnText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  investmentNames: { id: number; name: string }[];
  onEdit: () => void;
  onRemove: () => void;
}

function GoalCard({ goal, investmentNames, onEdit, onRemove }: GoalCardProps) {
  const visibleWithdrawals = goal.withdrawals.filter((w) => w.amount > 0);
  return (
    <View style={styles.card} testID={`goal-${goal.id}`}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardName}>{goal.name}</Text>
          <Text style={styles.cardYear}>Target year: {goal.year}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {visibleWithdrawals.length > 0 && (
        <View style={styles.withdrawalList}>
          {visibleWithdrawals.map((w) => {
            const inv = investmentNames.find((i) => i.id === w.investmentId);
            return (
              <Text key={w.investmentId} style={styles.withdrawalItem}>
                Withdraw{' '}
                <Text style={styles.withdrawalAmount}>₹{w.amount.toLocaleString('en-IN')}</Text>
                {' '}from{' '}
                <Text style={styles.withdrawalInv}>{inv?.name ?? 'Unknown'}</Text>
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const profile         = usePlannerStore(selectActiveProfile);
  const addGoal         = usePlannerStore((s) => s.addGoal);
  const updateGoal      = usePlannerStore((s) => s.updateGoal);
  const removeGoal      = usePlannerStore((s) => s.removeGoal);

  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);

  if (!profile || activeProfileId === 'all') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guard}>
          <Text style={styles.guardText}>Select an individual profile to manage goals.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const investmentNames = profile.investments.map((i) => ({ id: i.id, name: i.name }));

  const handleSave = (goal: Partial<Goal>) => {
    if (goal.id) {
      updateGoal(profile.id, goal as Goal);
    } else {
      addGoal(profile.id, goal as Omit<Goal, 'id'>);
    }
    setEditingGoal(null);
  };

  const handleRemove = (goal: Goal) => {
    Alert.alert(
      'Remove Goal',
      `Remove "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeGoal(profile.id, goal.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Life Goals</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setEditingGoal({ name: '', year: new Date().getFullYear() + 5, withdrawals: [] })}
          testID="add-goal-button"
        >
          <Text style={styles.addBtnText}>+ Add Goal</Text>
        </TouchableOpacity>
      </View>

      {profile.goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyBody}>Tap "+ Add Goal" to plan a major life milestone.</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setEditingGoal({ name: '', year: new Date().getFullYear() + 5, withdrawals: [] })}
          >
            <Text style={styles.emptyAddBtnText}>Add Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {profile.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              investmentNames={investmentNames}
              onEdit={() => setEditingGoal(goal)}
              onRemove={() => handleRemove(goal)}
            />
          ))}
        </ScrollView>
      )}

      {editingGoal && (
        <GoalModal
          goal={editingGoal}
          investmentNames={investmentNames}
          onSave={handleSave}
          onCancel={() => setEditingGoal(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f8fafc' },

  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading:           { fontSize: 22, fontWeight: '800', color: '#1e1b4b' },
  addBtn:            { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },

  list:              { paddingHorizontal: 20, paddingBottom: 40 },

  card:              { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft:          { flex: 1 },
  cardName:          { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardYear:          { fontSize: 13, color: '#6b7280' },
  cardActions:       { flexDirection: 'row', gap: 8, marginLeft: 8 },
  editBtn:           { backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  editBtnText:       { fontSize: 12, fontWeight: '600', color: '#374151' },
  removeBtn:         { backgroundColor: '#fef2f2', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  removeBtnText:     { fontSize: 12, fontWeight: '600', color: '#dc2626' },

  withdrawalList:    { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  withdrawalItem:    { fontSize: 13, color: '#6b7280', marginBottom: 3 },
  withdrawalAmount:  { fontWeight: '700', color: '#111827' },
  withdrawalInv:     { color: '#4f46e5', fontWeight: '600' },

  guard:             { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guardText:         { fontSize: 15, color: '#6b7280', textAlign: 'center' },

  emptyState:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyBody:         { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 },
  emptyAddBtn:       { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  emptyAddBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay:      { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '90%' },
  modalHandle:       { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:        { fontSize: 20, fontWeight: '800', color: '#1e1b4b', marginBottom: 16 },

  label:             { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:             { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },

  noInvestments:     { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  withdrawalRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  withdrawalName:    { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  withdrawalInput:   { width: 120, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 10, fontSize: 14, textAlign: 'right' },

  modalActions:      { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:         { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:     { color: '#374151', fontWeight: '600', fontSize: 15 },
  saveBtn:           { flex: 1, backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:       { color: '#fff', fontWeight: '700', fontSize: 15 },
});
