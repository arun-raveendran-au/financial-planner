/**
 * ProfilePicker — horizontal scrollable tab row for switching the active profile.
 * Includes an "All" tab and inline rename on long-press.
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { usePlannerStore } from '@financial-planner/store';

export function ProfilePicker() {
  const profiles           = usePlannerStore((s) => s.profiles);
  const activeProfileId    = usePlannerStore((s) => s.activeProfileId);
  const setActiveProfile   = usePlannerStore((s) => s.setActiveProfile);
  const addProfile         = usePlannerStore((s) => s.addProfile);
  const updateProfileName  = usePlannerStore((s) => s.updateProfileName);

  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const startRename = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const commitRename = () => {
    if (editingId !== null && editingName.trim()) {
      updateProfileName(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {profiles.map((p) => {
          const isActive = activeProfileId === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setEditingId(null); setActiveProfile(p.id); }}
              onLongPress={() => startRename(p.id, p.name)}
            >
              {editingId === p.id ? (
                <TextInput
                  autoFocus
                  style={styles.renameInput}
                  value={editingName}
                  onChangeText={setEditingName}
                  onBlur={commitRename}
                  onSubmitEditing={commitRename}
                  selectTextOnFocus
                />
              ) : (
                <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                  {p.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* All Profiles tab */}
        <TouchableOpacity
          style={[styles.tab, activeProfileId === 'all' && styles.tabActive]}
          onPress={() => { setEditingId(null); setActiveProfile('all'); }}
        >
          <Text style={[styles.tabText, activeProfileId === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {/* Add profile */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => addProfile(`Profile ${profiles.length + 1}`)}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:         { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, overflow: 'hidden' },
  scroll:          { paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },

  tab:             { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginRight: 4, maxWidth: 140 },
  tabActive:       { backgroundColor: '#ede9fe' },
  tabText:         { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive:   { color: '#4f46e5' },

  renameInput:     { fontSize: 14, fontWeight: '600', color: '#4f46e5', minWidth: 80, padding: 0, borderBottomWidth: 1, borderBottomColor: '#4f46e5' },

  addBtn:          { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  addBtnText:      { fontSize: 18, color: '#4f46e5', lineHeight: 22, fontWeight: '700' },
});
