/**
 * Settings tab — sign-out button + timeline configuration.
 * Full implementation: Phase 2h.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {user && (
        <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut} testID="sign-out-button">
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  title:        { fontSize: 22, fontWeight: '800', color: '#1e1b4b', marginBottom: 8 },
  email:        { fontSize: 14, color: '#6b7280', marginBottom: 32, maxWidth: '100%' },
  signOutBtn:   { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  signOutText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
});
