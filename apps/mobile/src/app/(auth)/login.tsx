/**
 * Login screen — email + password sign-in via Supabase.
 * On success the AuthGuard in _layout.tsx automatically redirects to (tabs).
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success: onAuthStateChange fires → AuthGuard redirects to (tabs)
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Financial Planner</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          testID="email-input"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          testID="password-input"
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} testID="error-message">
              {error}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          testID="login-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" style={styles.link}>
            Sign up
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: '#f8fafc' },
  container:       { flex: 1, justifyContent: 'center', padding: 24 },
  title:           { fontSize: 28, fontWeight: '800', color: '#1e1b4b', textAlign: 'center', marginBottom: 4 },
  subtitle:        { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input:           { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  errorBox:        { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText:       { color: '#dc2626', fontSize: 14 },
  button:          { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer:          { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText:      { color: '#6b7280', fontSize: 14 },
  link:            { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
});
