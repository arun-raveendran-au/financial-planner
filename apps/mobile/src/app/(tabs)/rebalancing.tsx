/**
 * Rebalancing tab — log events that move money between investments.
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
import type { RebalancingEvent } from '@financial-planner/types';
import { getTodayDateString } from '@financial-planner/core';

// ─── Investment picker (horizontal chips) ─────────────────────────────────────

interface InvPickerProps {
  label: string;
  selectedId: number | undefined;
  investments: { id: number; name: string }[];
  onSelect: (id: number) => void;
}

function InvPicker({ label, selectedId, investments, onSelect }: InvPickerProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {investments.map((inv) => (
          <TouchableOpacity
            key={inv.id}
            style={[styles.chip, selectedId === inv.id && styles.chipActive]}
            onPress={() => onSelect(inv.id)}
          >
            <Text style={[styles.chipText, selectedId === inv.id && styles.chipTextActive]}>
              {inv.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface RebalanceModalProps {
  event: Partial<RebalancingEvent>;
  investments: { id: number; name: string }[];
  onSave: (e: Partial<RebalancingEvent>) => void;
  onCancel: () => void;
}

function RebalanceModal({ event, investments, onSave, onCancel }: RebalanceModalProps) {
  const isEdit = !!event.id;
  const [amount, setAmount]     = useState(String(event.amount ?? 10_000));
  const [date, setDate]         = useState(event.date ?? getTodayDateString());
  const [fromId, setFromId]     = useState<number | undefined>(event.fromInvestmentId);
  const [toId, setToId]         = useState<number | undefined>(event.toInvestmentId);

  const handleSave = () => {
    onSave({
      ...event,
      amount: parseInt(amount) || 0,
      date,
      fromInvestmentId: fromId ?? 0,
      toInvestmentId: toId ?? 0,
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
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit' : 'New'} Rebalancing Event
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <View style={styles.row2}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                  testID="rebalancing-amount-input"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <InvPicker
              label="From (sell)"
              selectedId={fromId}
              investments={investments}
              onSelect={setFromId}
            />

            <InvPicker
              label="To (buy)"
              selectedId={toId}
              investments={investments}
              onSelect={setToId}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} testID="save-rebalancing-button">
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

interface CardProps {
  event: RebalancingEvent;
  investments: { id: number; name: string }[];
  onEdit: () => void;
  onRemove: () => void;
}

function EventCard({ event, investments, onEdit, onRemove }: CardProps) {
  const from = investments.find((i) => i.id === event.fromInvestmentId);
  const to   = investments.find((i) => i.id === event.toInvestmentId);

  return (
    <View style={styles.card} testID={`rebalancing-${event.id}`}>
      <View style={styles.cardBody}>
        <Text style={styles.cardAmount}>₹{event.amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.cardDate}>{event.date}</Text>
        <View style={styles.arrowRow}>
          <Text style={styles.fromText} numberOfLines={1}>{from?.name ?? 'Unknown'}</Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={styles.toText} numberOfLines={1}>{to?.name ?? 'Unknown'}</Text>
        </View>
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
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RebalancingScreen() {
  const activeProfileId        = usePlannerStore((s) => s.activeProfileId);
  const profile                = usePlannerStore(selectActiveProfile);
  const addRebalancingEvent    = usePlannerStore((s) => s.addRebalancingEvent);
  const updateRebalancingEvent = usePlannerStore((s) => s.updateRebalancingEvent);
  const removeRebalancingEvent = usePlannerStore((s) => s.removeRebalancingEvent);

  const [editing, setEditing] = useState<Partial<RebalancingEvent> | null>(null);

  if (!profile || activeProfileId === 'all') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guard}>
          <Text style={styles.guardText}>Select an individual profile to manage rebalancing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const investments = profile.investments.map((i) => ({ id: i.id, name: i.name }));

  const openAdd = () =>
    setEditing({ date: getTodayDateString(), amount: 10_000, fromInvestmentId: undefined, toInvestmentId: undefined });

  const handleSave = (e: Partial<RebalancingEvent>) => {
    if (e.id) updateRebalancingEvent(profile.id, e as RebalancingEvent);
    else      addRebalancingEvent(profile.id, e as Omit<RebalancingEvent, 'id'>);
    setEditing(null);
  };

  const handleRemove = (e: RebalancingEvent) => {
    Alert.alert(
      'Remove Event',
      `Remove ₹${e.amount.toLocaleString('en-IN')} on ${e.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeRebalancingEvent(profile.id, e.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>Rebalancing</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} testID="add-rebalancing-button">
          <Text style={styles.addBtnText}>+ Add Event</Text>
        </TouchableOpacity>
      </View>

      {profile.rebalancingEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No rebalancing events yet</Text>
          <Text style={styles.emptyBody}>
            Record a rebalancing event when you move money between investments.
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
            <Text style={styles.emptyAddBtnText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {profile.rebalancingEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              investments={investments}
              onEdit={() => setEditing(e)}
              onRemove={() => handleRemove(e)}
            />
          ))}
        </ScrollView>
      )}

      {editing && (
        <RebalanceModal
          event={editing}
          investments={investments}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#f8fafc' },

  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading:         { fontSize: 22, fontWeight: '800', color: '#1e1b4b' },
  addBtn:          { backgroundColor: '#0891b2', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText:      { color: '#fff', fontWeight: '700', fontSize: 14 },

  list:            { paddingHorizontal: 20, paddingBottom: 40 },

  card:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardBody:        { flex: 1 },
  cardAmount:      { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  cardDate:        { fontSize: 12, color: '#9ca3af', marginBottom: 6 },
  arrowRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  fromText:        { fontSize: 13, color: '#e11d48', fontWeight: '600', flexShrink: 1 },
  arrow:           { fontSize: 13, color: '#9ca3af' },
  toText:          { fontSize: 13, color: '#16a34a', fontWeight: '600', flexShrink: 1 },
  cardActions:     { flexDirection: 'row', gap: 8, marginLeft: 10 },
  editBtn:         { backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  editBtnText:     { fontSize: 12, fontWeight: '600', color: '#374151' },
  removeBtn:       { backgroundColor: '#fef2f2', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  removeBtnText:   { fontSize: 12, fontWeight: '600', color: '#dc2626' },

  guard:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guardText:       { fontSize: 15, color: '#6b7280', textAlign: 'center' },

  emptyState:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyBody:       { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  emptyAddBtn:     { backgroundColor: '#0891b2', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  emptyAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay:    { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '90%' },
  modalHandle:     { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: '#1e1b4b', marginBottom: 16 },

  label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:           { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  row2:            { flexDirection: 'row', gap: 12 },
  halfField:       { flex: 1 },

  chipScroll:      { marginBottom: 4 },
  chip:            { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipActive:      { backgroundColor: '#ecfdf5', borderColor: '#16a34a' },
  chipText:        { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  chipTextActive:  { color: '#16a34a' },

  modalActions:    { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:       { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:   { color: '#374151', fontWeight: '600', fontSize: 15 },
  saveBtn:         { flex: 1, backgroundColor: '#0891b2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});
