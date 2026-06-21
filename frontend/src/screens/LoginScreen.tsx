import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';

import { useUser } from '../context/UserContext';

export default function LoginScreen() {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (input: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(input);
  };

  const handleLogin = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail);
    } catch (err) {
      Alert.alert('Login Failed', 'Could not authenticate. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await login('demo_user');
    } catch (err) {
      Alert.alert('Login Failed', 'Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginCard}>
            {/* EcoPulse Brand Graphic */}
            <View style={styles.brandIconWrapper}>
              <Svg height="60" width="60" viewBox="0 0 60 60">
                <Circle cx="30" cy="30" r="28" fill="#E2EFE7" />
                <Path
                  d="M30,12 C24,20 18,28 18,36 C18,44 24,48 30,48 C36,44 42,44 42,36 C42,28 36,20 30,12 Z"
                  fill="#2C5E43"
                />
                <Path
                  d="M30,22 Q24,32 30,42"
                  stroke="#E2EFE7"
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
            </View>

            <Text style={styles.brandName}>EcoPulse</Text>
            <Text style={styles.brandSubtitle}>Carbon Intelligence Portal</Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#B54D3D" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#8A857A" style={styles.inputIcon} />
                <TextInput accessible={true} aria-label="Input field" 
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(val) => { setEmail(val); setErrorMsg(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#8A857A" style={styles.inputIcon} />
                <TextInput accessible={true} aria-label="Input field" 
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(val) => setPassword(val)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button" 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.toggleBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#8A857A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button" 
              style={[styles.signInBtn, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.signInBtnText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Demo Login Fallback */}
            <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Button" 
              style={styles.demoBtn}
              onPress={handleDemoLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={16} color="#2C5E43" style={{ marginRight: 6 }} />
              <Text style={styles.demoBtnText}>Use Demo Account</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  brandIconWrapper: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF0ED',
    borderWidth: 1,
    borderColor: '#F5C2B8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#B54D3D',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6E2D8',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
    padding: 0,
  },
  toggleBtn: {
    padding: 8,
    position: 'absolute',
    right: 6,
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6E2D8',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E6E2D8',
    borderRadius: 12,
    height: 48,
    width: '100%',
  },
  demoBtnText: {
    color: '#2C5E43',
    fontSize: 14,
    fontWeight: '700',
  },
});
