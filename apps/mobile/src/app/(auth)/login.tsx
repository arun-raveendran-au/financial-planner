/**
 * Mobile login screen — mirrors web login, uses same Supabase auth.
 * Scaffold only — full implementation in a later phase.
 */
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Planner</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title:     { fontSize: 28, fontWeight: '800', color: '#1e1b4b', textAlign: 'center', marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input:     { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  button:    { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
