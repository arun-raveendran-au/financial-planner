/**
 * Signup screen — creates a new account via Supabase.
 * Shows a confirmation message after successful registration (email
 * verification is required before the user can sign in).
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
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.successBody}>
          We sent a confirmation link to{' '}
          <Text style={styles.bold}>{email}</Text>. Click it to activate your
          account.
        </Text>
        <Link href="/(auth)/login" style={styles.backLink}>
          Back to sign in
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start planning your financial future</Text>

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
          placeholder="Password (min. 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="password-input"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="confirm-password-input"
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
          onPress={handleSignUp}
          disabled={loading}
          testID="signup-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: '#f8fafc' },
  container:      { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title:          { fontSize: 28, fontWeight: '800', color: '#1e1b4b', textAlign: 'center', marginBottom: 4 },
  subtitle:       { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input:          { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  errorBox:       { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText:      { color: '#dc2626', fontSize: 14 },
  button:         { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText:     { color: '#6b7280', fontSize: 14 },
  link:           { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  // Success state
  successIcon:    { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  successCheck:   { fontSize: 28, color: '#16a34a' },
  successBody:    { color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  bold:           { fontWeight: '700', color: '#374151' },
  backLink:       { color: '#4f46e5', fontWeight: '600', textAlign: 'center', marginTop: 24, fontSize: 15 },
});
