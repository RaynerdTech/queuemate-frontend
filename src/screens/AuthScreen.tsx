import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const auth = useContext(AuthContext)!;

  const submit = async () => {
    setErr(null);
    
    // Validation
    if (!email.trim()) {
      setErr('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setErr('Please enter your password');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const fn = isSignup ? auth.signup : auth.login;
    const res = await fn(email, password);
    setLoading(false);
    
    if (!res.ok) {
      setErr(res.message || 'Something went wrong. Please try again.');
      AccessibilityInfo.announceForAccessibility(res.message || 'Something went wrong');
    }
  };

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setErr(null);
    AccessibilityInfo.announceForAccessibility(
      !isSignup ? 'Switched to create account mode' : 'Switched to login mode'
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER SECTION */}
      <LinearGradient
        colors={['#4f46e5', '#3b82f6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <View 
            style={styles.iconCircle}
            accessible={true}
            accessibilityLabel="QueueMate logo"
          >
            <MaterialCommunityIcons name="account-group" size={36} color="#4f46e5" />
          </View>
          <Text 
            style={styles.appName}
            accessible={true}
            accessibilityRole="header"
          >
            QueueMate
          </Text>
          <Text 
            style={styles.heroSubtitle}
            accessible={true}
          >
            Manage your shop, queues, and customers effortlessly.
          </Text>
        </View>

        {/* Perfect Smooth Wave - Triple Layer for Seamless Curve */}
        <View style={styles.waveContainer}>
          <View style={styles.waveLayer3} />
          <View style={styles.waveLayer2} />
          <View style={styles.waveLayer1} />
        </View>
      </LinearGradient>

      {/* FORM SECTION */}
      <View style={styles.formContainer}>
        {/* CUSTOM TOGGLE */}
        <View 
          style={styles.toggleWrapper}
          accessible={true}
          accessibilityLabel="Authentication mode selector"
          accessibilityRole="radiogroup"
        >
          <TouchableOpacity
            onPress={toggleAuthMode}
            style={[styles.toggleBtn, !isSignup && styles.toggleBtnActive]}
            accessible={true}
            accessibilityRole="radio"
            accessibilityState={{ selected: !isSignup }}
            accessibilityLabel="Log In"
            accessibilityHint="Switch to login mode"
          >
            <Text style={[styles.toggleText, !isSignup && styles.toggleTextActive]}>
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleAuthMode}
            style={[styles.toggleBtn, isSignup && styles.toggleBtnActive]}
            accessible={true}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSignup }}
            accessibilityLabel="Create Account"
            accessibilityHint="Switch to create account mode"
          >
            <Text style={[styles.toggleText, isSignup && styles.toggleTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* EMAIL INPUT */}
        <View 
          style={styles.inputWrapper}
          accessible={false}
        >
          <MaterialCommunityIcons 
            name="email-outline" 
            size={22} 
            color="#94a3b8" 
            style={styles.inputIcon}
            importantForAccessibility="no"
          />
          <TextInput
            placeholder="Email address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErr(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            style={styles.input}
            accessible={true}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address"
            editable={!loading}
          />
        </View>

        {/* PASSWORD INPUT */}
        <View 
          style={styles.inputWrapper}
          accessible={false}
        >
          <MaterialCommunityIcons 
            name="lock-outline" 
            size={22} 
            color="#94a3b8" 
            style={styles.inputIcon}
            importantForAccessibility="no"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErr(null);
            }}
            secureTextEntry={!showPassword}
            textContentType={isSignup ? "newPassword" : "password"}
            autoComplete={isSignup ? "password-new" : "password"}
            style={[styles.input, { flex: 1 }]}
            accessible={true}
            accessibilityLabel="Password"
            accessibilityHint={isSignup ? "Enter a password with at least 6 characters" : "Enter your password"}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            accessible={true}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityRole="button"
            disabled={loading}
          >
            <MaterialCommunityIcons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>

        {/* ERROR MESSAGE */}
        {err && (
          <View 
            style={styles.errorContainer}
            accessible={true}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.err}>{err}</Text>
          </View>
        )}

        {/* GRADIENT BUTTON */}
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={submit} 
          style={styles.submitBtnContainer}
          disabled={loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isSignup ? 'Create account' : 'Log in'}
          accessibilityHint={`Tap to ${isSignup ? 'create your account' : 'log into your account'}`}
          accessibilityState={{ disabled: loading }}
        >
          <LinearGradient
            colors={loading ? ['#94a3b8', '#94a3b8', '#94a3b8'] : ['#4f46e5', '#3b82f6', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isSignup ? 'Create Account' : 'Log In'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* FOOTER */}
        <TouchableOpacity 
          onPress={toggleAuthMode}
          disabled={loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isSignup ? "Switch to login" : "Switch to create account"}
          accessibilityHint={isSignup ? "Tap to go to login screen" : "Tap to go to create account screen"}
        >
          <Text style={styles.footerText}>
            {isSignup ? "Already have an account? " : "No account? "}
            <Text style={styles.footerLink}>
              {isSignup ? "Log In" : "Create one"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: '46%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    position: 'relative',
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 2,
    marginTop: -10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: '85%',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    height: 100,
    overflow: 'hidden',
  },
  waveLayer1: {
    position: 'absolute',
    width: width * 4,
    height: width * 4,
    backgroundColor: '#fff',
    borderRadius: width * 2,
    bottom: -width * 4 + 70,
    left: -width * 1.5,
  },
  waveLayer2: {
    position: 'absolute',
    width: width * 4,
    height: width * 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: width * 2,
    bottom: -width * 4 + 65,
    left: -width * 1.5 + 30,
  },
  waveLayer3: {
    position: 'absolute',
    width: width * 4,
    height: width * 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: width * 2,
    bottom: -width * 4 + 60,
    left: -width * 1.5 + 60,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 28,
    backgroundColor: '#fff',
    zIndex: 3,
    paddingTop: 10,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 30,
    padding: 5,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 26,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toggleText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  toggleTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    minHeight: 62,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
    paddingVertical: 18,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  err: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  submitBtnContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    minHeight: 64,
  },
  primaryBtn: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    marginTop: 28,
    fontWeight: '500',
  },
  footerLink: {
    color: '#4f46e5',
    fontWeight: '700',
  },
});