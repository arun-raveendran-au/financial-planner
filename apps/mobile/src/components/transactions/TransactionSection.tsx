/**
 * TransactionSection — reusable list + bottom-sheet modal for any transaction
 * type (sip, lumpsum, swp, oneTimeWithdrawal).
 * Used by the Contribute and Withdraw screens.
 */
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import type { Investment } from '@financial-planner/types';
import { getTodayDateString } from '@financial-planner/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxType = 'sip' | 'lumpsum' | 'swp' | 'oneTimeWithdrawal';

export interface AnyTransaction {
  id: number;
  investmentId: number;
  amount: number;
  // recurring
  startDate?: string;
  durationYears?: number;
  frequency?: 'Monthly' | 'Yearly';
  stepUpPercent?: number;
  // one-time
  date?: string;
}

interface Props {
  title: string;
  type: TxType;
  transactions: AnyTransaction[];
  investments: Investment[];
  onAdd: (tx: Omit<AnyTransaction, 'id'>) => void;
  onUpdate: (tx: AnyTransaction) => void;
  onRemove: (id: number) => void;
  accentColor: string;
}

// ─── Default values ───────────────────────────────────────────────────────────

function defaultTx(type: TxType, firstInvestmentId: number): Omit<AnyTransaction, 'id'> {
  const today = getTodayDateString();
  if (type === 'sip' || type === 'swp') {
    return { investmentId: firstInvestmentId, amount: 5_000, startDate: today, durationYears: 10, frequency: 'Monthly', stepUpPercent: 5 };
  }
  return { investmentId: firstInvestmentId, amount: 100_000, date: today };
}

// ─── Transaction row ──────────────────────────────────────────────────────────

interface RowProps {
  tx: AnyTransaction;
  investments: Investment[];
  isRecurring: boolean;
  isContribution: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

function TxRow({ tx, investments, isRecurring, isContribution, onEdit, onRemove }: RowProps) {
  const inv = investments.find((i) => i.id === tx.investmentId);
  const invName = inv?.name ?? 'Unknown';

  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.body}>
        <Text style={rowStyles.amount} numberOfLines={1}>
          ₹{tx.amount.toLocaleString('en-IN')}
          {isRecurring ? ` / ${tx.frequency}` : ''}
          {'  '}
          <Text style={rowStyles.direction}>{isContribution ? 'into' : 'from'}</Text>
          {'  '}
          <Text style={rowStyles.invName}>{invName}</Text>
        </Text>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {isRecurring
            ? `Starts ${tx.startDate} · ${tx.durationYears} yrs${tx.stepUpPercent ? ` · ${tx.stepUpPercent}% step-up` : ''}`
            : tx.date}
        </Text>
      </View>
      <View style={rowStyles.actions}>
        <TouchableOpacity style={rowStyles.editBtn} onPress={onEdit}>
          <Text style={rowStyles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={rowStyles.removeBtn} onPress={onRemove}>
          <Text style={rowStyles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:          { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  body:         { flex: 1 },
  amount:       { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  direction:    { fontWeight: '400', color: '#6b7280' },
  invName:      { color: '#4f46e5', fontWeight: '700' },
  meta:         { fontSize: 12, color: '#9ca3af' },
  actions:      { flexDirection: 'row', gap: 6, marginLeft: 8 },
  editBtn:      { backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  editBtnText:  { fontSize: 12, fontWeight: '600', color: '#374151' },
  removeBtn:    { backgroundColor: '#fef2f2', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  removeBtnText:{ fontSize: 12, fontWeight: '600', color: '#dc2626' },
});

// ─── Modal ────────────────────────────────────────────────────────────────────

interface TxModalProps {
  type: TxType;
  transaction: Partial<AnyTransaction>;
  investments: Investment[];
  accentColor: string;
  onSave: (tx: Partial<AnyTransaction>) => void;
  onCancel: () => void;
}

const TX_TITLES: Record<TxType, string> = {
  sip:               'Recurring Contribution (SIP)',
  lumpsum:           'One-Time Contribution',
  swp:               'Recurring Withdrawal (SWP)',
  oneTimeWithdrawal: 'One-Time Withdrawal',
};

function TxModal({ type, transaction, investments, accentColor, onSave, onCancel }: TxModalProps) {
  const isRecurring     = type === 'sip' || type === 'swp';
  const isEdit          = !!transaction.id;
  const dateField       = isRecurring ? 'startDate' : 'date';

  const [investmentId, setInvestmentId] = useState<number>(
    transaction.investmentId ?? investments[0]?.id ?? 0,
  );
  const [amount, setAmount]             = useState(String(transaction.amount ?? (isRecurring ? 5000 : 100000)));
  const [date, setDate]                 = useState<string>(
    (isRecurring ? transaction.startDate : transaction.date) ?? getTodayDateString(),
  );
  const [durationYears, setDurationYears] = useState(String(transaction.durationYears ?? 10));
  const [frequency, setFrequency]       = useState<'Monthly' | 'Yearly'>(transaction.frequency ?? 'Monthly');
  const [stepUp, setStepUp]             = useState(String(transaction.stepUpPercent ?? 5));

  const handleSave = () => {
    const base = {
      ...transaction,
      investmentId,
      amount: parseInt(amount) || 0,
    };
    if (isRecurring) {
      onSave({ ...base, startDate: date, durationYears: parseInt(durationYears) || 1, frequency, stepUpPercent: parseFloat(stepUp) || 0 });
    } else {
      onSave({ ...base, date });
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onCancel} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>
            {isEdit ? 'Edit' : 'Add'} {TX_TITLES[type]}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Investment picker */}
            <Text style={modalStyles.label}>Investment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.chipScroll}>
              {investments.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={[modalStyles.chip, investmentId === inv.id && { ...modalStyles.chipActive, borderColor: accentColor }]}
                  onPress={() => setInvestmentId(inv.id)}
                >
                  <Text style={[modalStyles.chipText, investmentId === inv.id && { color: accentColor }]}>
                    {inv.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Amount */}
            <Text style={modalStyles.label}>Amount (₹)</Text>
            <TextInput
              style={modalStyles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="5000"
              testID="tx-amount-input"
            />

            {/* Date */}
            <Text style={modalStyles.label}>{isRecurring ? 'Start Date' : 'Date'} (YYYY-MM-DD)</Text>
            <TextInput
              style={modalStyles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              testID="tx-date-input"
            />

            {/* Recurring-only fields */}
            {isRecurring && (
              <>
                <View style={modalStyles.row2}>
                  <View style={modalStyles.halfField}>
                    <Text style={modalStyles.label}>Duration (years)</Text>
                    <TextInput
                      style={modalStyles.input}
                      value={durationYears}
                      onChangeText={setDurationYears}
                      keyboardType="number-pad"
                      placeholder="10"
                    />
                  </View>
                  <View style={modalStyles.halfField}>
                    <Text style={modalStyles.label}>Step-up (%)</Text>
                    <TextInput
                      style={modalStyles.input}
                      value={stepUp}
                      onChangeText={setStepUp}
                      keyboardType="decimal-pad"
                      placeholder="5"
                    />
                  </View>
                </View>

                <Text style={modalStyles.label}>Frequency</Text>
                <View style={modalStyles.toggleRow}>
                  {(['Monthly', 'Yearly'] as const).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[modalStyles.toggleBtn, frequency === f && { ...modalStyles.toggleBtnActive, backgroundColor: accentColor }]}
                      onPress={() => setFrequency(f)}
                    >
                      <Text style={[modalStyles.toggleText, frequency === f && modalStyles.toggleTextActive]}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={modalStyles.actions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.saveBtn, { backgroundColor: accentColor }]}
                onPress={handleSave}
                testID="save-tx-button"
              >
                <Text style={modalStyles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay:         { flex: 1, justifyContent: 'flex-end' },
  backdrop:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:           { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '92%' },
  handle:          { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:           { fontSize: 18, fontWeight: '800', color: '#1e1b4b', marginBottom: 16 },
  label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:           { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  chipScroll:      { marginBottom: 4 },
  chip:            { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipActive:      { backgroundColor: '#ede9fe' },
  chipText:        { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  row2:            { flexDirection: 'row', gap: 12 },
  halfField:       { flex: 1 },
  toggleRow:       { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4, gap: 4 },
  toggleBtn:       { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  toggleText:      { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  toggleTextActive:{ color: '#fff' },
  actions:         { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:       { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:   { color: '#374151', fontWeight: '600', fontSize: 15 },
  saveBtn:         { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ─── TransactionSection (exported) ───────────────────────────────────────────

export function TransactionSection({
  title, type, transactions, investments, onAdd, onUpdate, onRemove, accentColor,
}: Props) {
  const isRecurring    = type === 'sip' || type === 'swp';
  const isContribution = type === 'sip' || type === 'lumpsum';
  const [modalTx, setModalTx] = useState<Partial<AnyTransaction> | null>(null);

  const openAdd = () =>
    setModalTx(defaultTx(type, investments[0]?.id ?? 0));

  const handleSave = (tx: Partial<AnyTransaction>) => {
    if (tx.id) onUpdate(tx as AnyTransaction);
    else       onAdd(tx as Omit<AnyTransaction, 'id'>);
    setModalTx(null);
  };

  const handleRemove = (tx: AnyTransaction) => {
    const inv = investments.find((i) => i.id === tx.investmentId);
    Alert.alert(
      'Remove Transaction',
      `Remove ₹${tx.amount.toLocaleString('en-IN')} ${isContribution ? 'into' : 'from'} ${inv?.name ?? 'Unknown'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(tx.id) },
      ],
    );
  };

  return (
    <View style={sectionStyles.container}>
      {/* Section header */}
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.title}>{title}</Text>
        <TouchableOpacity
          style={[sectionStyles.addBtn, { backgroundColor: accentColor }]}
          onPress={openAdd}
          testID={`add-${type}-button`}
        >
          <Text style={sectionStyles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {transactions.length === 0 ? (
        <View style={sectionStyles.empty}>
          <Text style={sectionStyles.emptyText}>No {title.toLowerCase()} yet.</Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <TxRow
            key={tx.id}
            tx={tx}
            investments={investments}
            isRecurring={isRecurring}
            isContribution={isContribution}
            onEdit={() => setModalTx(tx)}
            onRemove={() => handleRemove(tx)}
          />
        ))
      )}

      {/* Modal */}
      {modalTx !== null && (
        <TxModal
          type={type}
          transaction={modalTx}
          investments={investments}
          accentColor={accentColor}
          onSave={handleSave}
          onCancel={() => setModalTx(null)}
        />
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container:  { marginBottom: 28 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title:      { fontSize: 16, fontWeight: '700', color: '#1e1b4b' },
  addBtn:     { borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty:      { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText:  { fontSize: 13, color: '#9ca3af' },
});
