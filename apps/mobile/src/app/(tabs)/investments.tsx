/**
 * Investments tab — list investments, add/edit/remove via a bottom-sheet modal.
 */
import { useMemo, useState } from 'react';
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
import { calculatePortfolioTimeline } from '@financial-planner/core';
import type { Investment } from '@financial-planner/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const ASSET_CLASSES = ['Equity', 'Debt', 'Gold', 'Real Estate', 'Cash', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  const abs = Math.abs(Math.round(value));
  if (abs >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (abs >= 100_000)    return `₹${(value / 100_000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

// ─── Investment card ──────────────────────────────────────────────────────────

interface CardProps {
  investment: Investment;
  value: number;
  color: string;
  onEdit: () => void;
  onRemove: () => void;
}

function InvestmentCard({ investment, value, color, onEdit, onRemove }: CardProps) {
  const returnLabel =
    investment.returnType === 'advanced'
      ? 'Variable return'
      : `${investment.annualReturn}% p.a.`;

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={1}>{investment.name}</Text>
            <View style={[styles.badge, { backgroundColor: color + '22' }]}>
              <Text style={[styles.badgeText, { color }]}>{returnLabel}</Text>
            </View>
          </View>
          <Text style={styles.cardAsset}>{investment.assetClass || 'Unclassified'}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.cardValue}>{formatINR(value)}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.removeBtn]} onPress={onRemove}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

interface ModalState {
  open: boolean;
  investment: Partial<Investment> | null;
}

interface InvestmentModalProps {
  investment: Partial<Investment>;
  onSave: (inv: Partial<Investment>) => void;
  onCancel: () => void;
}

function InvestmentModal({ investment, onSave, onCancel }: InvestmentModalProps) {
  const [name, setName]           = useState(investment.name ?? '');
  const [assetClass, setAssetClass] = useState(investment.assetClass ?? 'Equity');
  const [returnType, setReturnType] = useState<'basic' | 'advanced'>(investment.returnType ?? 'basic');
  const [annualReturn, setAnnualReturn] = useState(String(investment.annualReturn ?? 12));
  const [variableReturns, setVariableReturns] = useState(investment.variableReturns ?? []);

  const isEdit = !!investment.id;

  const handleSave = () => {
    const parsedReturn = parseFloat(annualReturn);
    onSave({
      ...investment,
      name: name.trim() || 'Investment',
      assetClass,
      returnType,
      annualReturn: isNaN(parsedReturn) ? 12 : parsedReturn,
      variableReturns,
    });
  };

  const addVariablePeriod = () => {
    const last = variableReturns[variableReturns.length - 1];
    setVariableReturns([
      ...variableReturns,
      { from: last ? last.to + 1 : 0, to: last ? last.to + 5 : 5, rate: 12 },
    ]);
  };

  const updatePeriod = (index: number, field: 'from' | 'to' | 'rate', raw: string) => {
    const num = parseFloat(raw);
    setVariableReturns(variableReturns.map((p, i) =>
      i === index ? { ...p, [field]: isNaN(num) ? 0 : num } : p,
    ));
  };

  const removePeriod = (index: number) => {
    setVariableReturns(variableReturns.filter((_, i) => i !== index));
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
          <Text style={styles.modalTitle}>{isEdit ? 'Edit Investment' : 'Add Investment'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Name */}
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Nifty 50 Index Fund"
              testID="investment-name-input"
            />

            {/* Asset class chips */}
            <Text style={styles.label}>Asset Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {ASSET_CLASSES.map((ac) => (
                <TouchableOpacity
                  key={ac}
                  style={[styles.chip, assetClass === ac && styles.chipActive]}
                  onPress={() => setAssetClass(ac)}
                >
                  <Text style={[styles.chipText, assetClass === ac && styles.chipTextActive]}>
                    {ac}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Return type toggle */}
            <Text style={styles.label}>Return Type</Text>
            <View style={styles.toggleRow}>
              {(['basic', 'advanced'] as const).map((rt) => (
                <TouchableOpacity
                  key={rt}
                  style={[styles.toggleBtn, returnType === rt && styles.toggleBtnActive]}
                  onPress={() => setReturnType(rt)}
                >
                  <Text style={[styles.toggleText, returnType === rt && styles.toggleTextActive]}>
                    {rt === 'basic' ? 'Basic' : 'Advanced'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Basic: single rate */}
            {returnType === 'basic' && (
              <>
                <Text style={styles.label}>Annual Return (%)</Text>
                <TextInput
                  style={styles.input}
                  value={annualReturn}
                  onChangeText={setAnnualReturn}
                  keyboardType="decimal-pad"
                  placeholder="12"
                  testID="annual-return-input"
                />
              </>
            )}

            {/* Advanced: variable periods */}
            {returnType === 'advanced' && (
              <>
                <Text style={styles.label}>Variable Return Periods</Text>
                {variableReturns.map((period, i) => (
                  <View key={i} style={styles.periodRow}>
                    <View style={styles.periodField}>
                      <Text style={styles.periodLabel}>From yr</Text>
                      <TextInput
                        style={styles.periodInput}
                        value={String(period.from)}
                        onChangeText={(v) => updatePeriod(i, 'from', v)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.periodField}>
                      <Text style={styles.periodLabel}>To yr</Text>
                      <TextInput
                        style={styles.periodInput}
                        value={String(period.to)}
                        onChangeText={(v) => updatePeriod(i, 'to', v)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.periodField}>
                      <Text style={styles.periodLabel}>Rate %</Text>
                      <TextInput
                        style={styles.periodInput}
                        value={String(period.rate)}
                        onChangeText={(v) => updatePeriod(i, 'rate', v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <TouchableOpacity onPress={() => removePeriod(i)} style={styles.periodRemove}>
                      <Text style={styles.periodRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addPeriodBtn} onPress={addVariablePeriod}>
                  <Text style={styles.addPeriodText}>+ Add Period</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} testID="save-investment-button">
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InvestmentsScreen() {
  const globalSettings  = usePlannerStore((s) => s.globalSettings);
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const activeProfile   = usePlannerStore(selectActiveProfile);
  const addInvestment    = usePlannerStore((s) => s.addInvestment);
  const updateInvestment = usePlannerStore((s) => s.updateInvestment);
  const removeInvestment = usePlannerStore((s) => s.removeInvestment);

  const [yearOffset, setYearOffset] = useState(globalSettings.timelineYears);
  const [modal, setModal] = useState<ModalState>({ open: false, investment: null });

  const timeline = useMemo(() => {
    if (!activeProfile) return null;
    return calculatePortfolioTimeline(activeProfile, globalSettings);
  }, [activeProfile, globalSettings]);

  const maxYear = globalSettings.timelineYears;
  const projectedYear = globalSettings.startYear + yearOffset;

  const openAdd = () => {
    setModal({
      open: true,
      investment: {
        name: `Investment ${(activeProfile?.investments.length ?? 0) + 1}`,
        assetClass: 'Equity',
        annualReturn: 12,
        returnType: 'basic',
        variableReturns: [],
      },
    });
  };

  const openEdit = (inv: Investment) => setModal({ open: true, investment: inv });

  const handleSave = (inv: Partial<Investment>) => {
    if (!activeProfile) return;
    if (inv.id) {
      updateInvestment(activeProfile.id, inv as Investment);
    } else {
      addInvestment(activeProfile.id, inv as Omit<Investment, 'id'>);
    }
    setModal({ open: false, investment: null });
  };

  const handleRemove = (inv: Investment) => {
    Alert.alert(
      'Remove Investment',
      `Remove "${inv.name}"? This will also delete all associated transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => activeProfile && removeInvestment(activeProfile.id, inv.id),
        },
      ],
    );
  };

  // All Profiles guard
  if (activeProfileId === 'all') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guardContainer}>
          <Text style={styles.guardText}>
            Select an individual profile to manage investments.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Investments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} testID="add-investment-button">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Year navigator */}
      <View style={styles.yearBar}>
        <TouchableOpacity
          style={[styles.yearBtn, yearOffset === 0 && styles.yearBtnDisabled]}
          onPress={() => setYearOffset((y) => Math.max(0, y - 1))}
          disabled={yearOffset === 0}
        >
          <Text style={styles.yearBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.yearLabel}>Values in {projectedYear}</Text>
        <TouchableOpacity
          style={[styles.yearBtn, yearOffset === maxYear && styles.yearBtnDisabled]}
          onPress={() => setYearOffset((y) => Math.min(maxYear, y + 1))}
          disabled={yearOffset === maxYear}
        >
          <Text style={styles.yearBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Investment list */}
      {!activeProfile || activeProfile.investments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No investments yet</Text>
          <Text style={styles.emptyBody}>Tap "+ Add" to create your first investment.</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
            <Text style={styles.emptyAddBtnText}>Add Investment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {activeProfile.investments.map((inv, i) => {
            const value = timeline?.yearlyData[yearOffset]?.investments[inv.id]?.closing ?? 0;
            return (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                value={value}
                color={CARD_COLORS[i % CARD_COLORS.length] ?? '#6366f1'}
                onEdit={() => openEdit(inv)}
                onRemove={() => handleRemove(inv)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Modal */}
      {modal.open && modal.investment && (
        <InvestmentModal
          investment={modal.investment}
          onSave={handleSave}
          onCancel={() => setModal({ open: false, investment: null })}
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

  yearBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  yearBtn:           { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  yearBtnDisabled:   { opacity: 0.3 },
  yearBtnText:       { fontSize: 20, color: '#4f46e5', fontWeight: '700', lineHeight: 24 },
  yearLabel:         { fontSize: 14, fontWeight: '600', color: '#374151' },

  list:              { paddingHorizontal: 20, paddingBottom: 40 },

  card:              { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardAccent:        { width: 6 },
  cardBody:          { flex: 1, padding: 14 },
  cardTop:           { marginBottom: 10 },
  cardTitleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  cardName:          { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  badge:             { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:         { fontSize: 11, fontWeight: '700' },
  cardAsset:         { fontSize: 12, color: '#6b7280' },
  cardBottom:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValue:         { fontSize: 18, fontWeight: '800', color: '#111827' },
  cardActions:       { flexDirection: 'row', gap: 8 },
  actionBtn:         { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f3f4f6' },
  actionBtnText:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  removeBtn:         { backgroundColor: '#fef2f2' },
  removeBtnText:     { fontSize: 13, fontWeight: '600', color: '#dc2626' },

  guardContainer:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
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
  modalTitle:        { fontSize: 20, fontWeight: '800', color: '#1e1b4b', marginBottom: 20 },

  label:             { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:             { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },

  chipScroll:        { marginBottom: 4 },
  chip:              { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipActive:        { backgroundColor: '#ede9fe', borderColor: '#4f46e5' },
  chipText:          { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  chipTextActive:    { color: '#4f46e5' },

  toggleRow:         { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4, gap: 4 },
  toggleBtn:         { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive:   { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  toggleText:        { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  toggleTextActive:  { color: '#1e1b4b' },

  periodRow:         { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-end' },
  periodField:       { flex: 1 },
  periodLabel:       { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  periodInput:       { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, textAlign: 'center' },
  periodRemove:      { paddingBottom: 10, paddingHorizontal: 4 },
  periodRemoveText:  { fontSize: 16, color: '#dc2626' },
  addPeriodBtn:      { borderWidth: 1, borderColor: '#4f46e5', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  addPeriodText:     { color: '#4f46e5', fontWeight: '600', fontSize: 14 },

  modalActions:      { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:         { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:     { color: '#374151', fontWeight: '600', fontSize: 15 },
  saveBtn:           { flex: 1, backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:       { color: '#fff', fontWeight: '700', fontSize: 15 },
});
