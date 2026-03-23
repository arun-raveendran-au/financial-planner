/**
 * Dashboard screen — shows the portfolio projection value for a selected year
 * and a diversification breakdown across asset classes.
 */
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { usePlannerStore } from '@financial-planner/store';
import { calculatePortfolioTimeline } from '@financial-planner/core';
import { ProfilePicker } from '../../components/ui/ProfilePicker';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  const abs = Math.abs(Math.round(value));
  if (abs >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `₹${(value / 100_000).toFixed(2)} L`;
  }
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const globalSettings = usePlannerStore((s) => s.globalSettings);
  const activeProfileId = usePlannerStore((s) => s.activeProfileId);
  const profiles = usePlannerStore((s) => s.profiles);

  const activeProfile = useMemo(() => {
    if (activeProfileId === 'all') {
      return {
        id: 0,
        name: 'All Profiles',
        investments: profiles.flatMap((p) => p.investments),
        sips: profiles.flatMap((p) => p.sips),
        lumpsums: profiles.flatMap((p) => p.lumpsums),
        swps: profiles.flatMap((p) => p.swps),
        oneTimeWithdrawals: profiles.flatMap((p) => p.oneTimeWithdrawals),
        goals: profiles.flatMap((p) => p.goals),
        rebalancingEvents: profiles.flatMap((p) => p.rebalancingEvents),
      };
    }
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  }, [activeProfileId, profiles]);

  const [yearOffset, setYearOffset] = useState(globalSettings.timelineYears);

  const timeline = useMemo(() => {
    if (!activeProfile) return null;
    return calculatePortfolioTimeline(activeProfile, globalSettings);
  }, [activeProfile, globalSettings]);

  const projectedValue = timeline?.yearlyData[yearOffset]?.closing ?? 0;
  const projectedYear = globalSettings.startYear + yearOffset;
  const maxYear = globalSettings.timelineYears;

  // Asset class breakdown for the selected year
  const assetBreakdown = useMemo(() => {
    if (!activeProfile || !timeline) return [];
    const yearData = timeline.yearlyData[yearOffset];
    if (!yearData) return [];

    const map = new Map<string, number>();
    for (const inv of activeProfile.investments) {
      const assetClass = inv.assetClass ?? 'Unclassified';
      const invData = yearData.investments[inv.id];
      const value = invData?.closing ?? 0;
      if (value > 0) {
        map.set(assetClass, (map.get(assetClass) ?? 0) + value);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [activeProfile, timeline, yearOffset]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.profileName}>
            {activeProfile?.name ?? 'Portfolio'}
          </Text>
          <Text style={styles.headerSub}>Financial Dashboard</Text>
        </View>

        {/* Profile switcher */}
        <ProfilePicker />

        {/* Portfolio value card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Portfolio Value in {projectedYear}</Text>
          <Text style={styles.portfolioValue} testID="portfolio-value">
            {formatINR(projectedValue)}
          </Text>

          {/* Year navigator */}
          <View style={styles.yearRow}>
            <TouchableOpacity
              style={[styles.yearBtn, yearOffset === 0 && styles.yearBtnDisabled]}
              onPress={() => setYearOffset((y) => Math.max(0, y - 1))}
              disabled={yearOffset === 0}
            >
              <Text style={styles.yearBtnText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.yearDisplay}>
              <Text style={styles.yearText}>{projectedYear}</Text>
              <Text style={styles.yearSub}>
                Year {yearOffset} of {maxYear}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.yearBtn, yearOffset === maxYear && styles.yearBtnDisabled]}
              onPress={() => setYearOffset((y) => Math.min(maxYear, y + 1))}
              disabled={yearOffset === maxYear}
            >
              <Text style={styles.yearBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick stats */}
        {timeline && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Invested</Text>
              <Text style={styles.statValue}>
                {formatINR(
                  Object.values(timeline.yearlyData[yearOffset]?.investments ?? {}).reduce(
                    (sum, d) => sum + (d?.invested ?? 0),
                    0,
                  ),
                )}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Growth</Text>
              <Text style={[styles.statValue, styles.growthValue]}>
                {formatINR(
                  Object.values(timeline.yearlyData[yearOffset]?.investments ?? {}).reduce(
                    (sum, d) => sum + (d?.growth ?? 0),
                    0,
                  ),
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Asset breakdown */}
        {assetBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset Breakdown</Text>
            {assetBreakdown.map(([assetClass, value]) => {
              const pct = projectedValue > 0 ? (value / projectedValue) * 100 : 0;
              return (
                <View key={assetClass} style={styles.assetRow}>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{assetClass}</Text>
                    <Text style={styles.assetValue}>{formatINR(value)}</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                  </View>
                  <Text style={styles.assetPct}>{pct.toFixed(1)}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* No investments empty state */}
        {activeProfile && activeProfile.investments.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No investments yet</Text>
            <Text style={styles.emptyBody}>
              Go to the Investments tab to add your first investment.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f8fafc' },
  scroll:           { padding: 20, paddingBottom: 40 },

  header:           { marginBottom: 20 },
  profileName:      { fontSize: 22, fontWeight: '800', color: '#1e1b4b' },
  headerSub:        { fontSize: 13, color: '#6b7280', marginTop: 2 },

  card:             { backgroundColor: '#4f46e5', borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  cardLabel:        { color: '#c7d2fe', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  portfolioValue:   { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 20 },

  yearRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8 },
  yearBtn:          { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  yearBtnDisabled:  { opacity: 0.3 },
  yearBtnText:      { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '700' },
  yearDisplay:      { alignItems: 'center' },
  yearText:         { color: '#fff', fontSize: 18, fontWeight: '800' },
  yearSub:          { color: '#c7d2fe', fontSize: 11, marginTop: 2 },

  statsRow:         { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statLabel:        { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  statValue:        { fontSize: 18, fontWeight: '800', color: '#111827' },
  growthValue:      { color: '#16a34a' },

  section:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#1e1b4b', marginBottom: 14 },

  assetRow:         { marginBottom: 12 },
  assetInfo:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  assetName:        { fontSize: 13, color: '#374151', fontWeight: '600' },
  assetValue:       { fontSize: 13, color: '#374151', fontWeight: '600' },
  barBg:            { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginBottom: 2 },
  barFill:          { height: 6, backgroundColor: '#4f46e5', borderRadius: 3 },
  assetPct:         { fontSize: 11, color: '#9ca3af', textAlign: 'right' },

  emptyState:       { alignItems: 'center', paddingVertical: 48 },
  emptyTitle:       { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyBody:        { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 21 },
});
