/**
 * Settings tab — timeline configuration, profile management, and sign-out.
 * Import/export is omitted on mobile (no expo-file-system in this project).
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { usePlannerStore } from '@financial-planner/store';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const globalSettings       = usePlannerStore((s) => s.globalSettings);
  const updateGlobalSettings = usePlannerStore((s) => s.updateGlobalSettings);
  const profiles             = usePlannerStore((s) => s.profiles);
  const removeProfile        = usePlannerStore((s) => s.removeProfile);
  const addProfile           = usePlannerStore((s) => s.addProfile);

  const [startYear, setStartYear]         = useState(String(globalSettings.startYear));
  const [timelineYears, setTimelineYears] = useState(String(globalSettings.timelineYears));

  const commitStartYear = () => {
    const val = parseInt(startYear);
    updateGlobalSettings({ startYear: isNaN(val) ? new Date().getFullYear() : val });
  };

  const commitTimelineYears = () => {
    const val = parseInt(timelineYears);
    updateGlobalSettings({ timelineYears: isNaN(val) ? 30 : Math.min(50, Math.max(1, val)) });
  };

  const handleRemoveProfile = (id: number, name: string) => {
    Alert.alert(
      'Remove Profile',
      `Remove "${name}" and all its data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeProfile(id) },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text style={styles.emailText} numberOfLines={1}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.row2}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Start Year</Text>
              <TextInput
                style={styles.input}
                value={startYear}
                onChangeText={setStartYear}
                onBlur={commitStartYear}
                keyboardType="number-pad"
                testID="start-year-input"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Duration (years)</Text>
              <TextInput
                style={styles.input}
                value={timelineYears}
                onChangeText={setTimelineYears}
                onBlur={commitTimelineYears}
                keyboardType="number-pad"
                testID="timeline-years-input"
              />
            </View>
          </View>
          <Text style={styles.hint}>
            Planning from {globalSettings.startYear} to{' '}
            {globalSettings.startYear + globalSettings.timelineYears} ({globalSettings.timelineYears} years)
          </Text>
        </View>

        {/* Profiles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profiles</Text>
            <TouchableOpacity
              style={styles.addProfileBtn}
              onPress={() => addProfile(`Profile ${profiles.length + 1}`)}
            >
              <Text style={styles.addProfileBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {profiles.map((p) => (
            <View key={p.id} style={styles.profileRow}>
              <Text style={styles.profileName}>{p.name}</Text>
              {profiles.length > 1 && (
                <TouchableOpacity
                  style={styles.profileRemoveBtn}
                  onPress={() => handleRemoveProfile(p.id, p.name)}
                >
                  <Text style={styles.profileRemoveBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          testID="sign-out-button"
        >
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f8fafc' },
  scroll:            { padding: 20, paddingBottom: 48 },
  heading:           { fontSize: 22, fontWeight: '800', color: '#1e1b4b', marginBottom: 20 },

  section:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:      { fontSize: 15, fontWeight: '700', color: '#1e1b4b', marginBottom: 12 },

  accountRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:     { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  emailText:         { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },

  row2:              { flexDirection: 'row', gap: 12, marginBottom: 8 },
  halfField:         { flex: 1 },
  label:             { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  input:             { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  hint:              { fontSize: 12, color: '#9ca3af', marginTop: 4 },

  addProfileBtn:     { backgroundColor: '#ede9fe', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  addProfileBtnText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },

  profileRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderRadius: 10, marginBottom: 8 },
  profileName:       { fontSize: 14, fontWeight: '600', color: '#374151' },
  profileRemoveBtn:  { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#fef2f2', borderRadius: 6 },
  profileRemoveBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },

  signOutBtn:        { backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  signOutBtnText:    { color: '#dc2626', fontWeight: '700', fontSize: 16 },
});
