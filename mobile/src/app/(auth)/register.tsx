import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { register } from '@/src/services/api/auth-api';
import { useAuthStore } from '@/src/stores/auth-store';
import { UserRole } from '@/src/types/auth';

export default function RegisterScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit =
    role !== null &&
    username.trim().length >= 3 &&
    email.includes('@') &&
    password.length >= 6;

  async function handleRegister() {
    if (!canSubmit || !role) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await register({ username: username.trim(), email: email.trim(), password, role });
      setSuccess(result.message || 'Account created successfully!');
      setTimeout(() => setAuth(result.token, role), 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView className="flex-1" behavior="height">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View className="flex-1 px-6 py-12">
            <View className="mb-8 items-center">
              <Text className="text-4xl font-bold text-brand-primary">FeelSync</Text>
              <Text className="mt-2 text-base text-gray-500 dark:text-gray-400">Create your account</Text>
            </View>

            {/* Role selection */}
            <Text className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              I am a...
            </Text>
            <View className="mb-3 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setRole('PATIENT')}
                className={`flex-1 items-center rounded-2xl border-2 py-4 ${
                  role === 'PATIENT'
                    ? 'border-brand-primary bg-brand-light'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                }`}>
                <Text className="text-2xl">🩺</Text>
                <Text className={`mt-1 text-sm font-semibold ${role === 'PATIENT' ? 'text-brand-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                  Patient
                </Text>
                <Text className="mt-0.5 text-center text-xs text-gray-400 dark:text-gray-500">
                  I wear the wristband
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('GUARDIAN')}
                className={`flex-1 items-center rounded-2xl border-2 py-4 ${
                  role === 'GUARDIAN'
                    ? 'border-brand-primary bg-brand-light'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                }`}>
                <Text className="text-2xl">👥</Text>
                <Text className={`mt-1 text-sm font-semibold ${role === 'GUARDIAN' ? 'text-brand-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                  Guardian
                </Text>
                <Text className="mt-0.5 text-center text-xs text-gray-400 dark:text-gray-500">
                  I monitor someone
                </Text>
              </TouchableOpacity>
            </View>

            {role === null && (
              <Text className="mb-4 text-xs text-gray-400 dark:text-gray-500">Select a role to continue</Text>
            )}

            {success ? (
              <View className="mb-4 rounded-xl bg-green-50 px-4 py-3">
                <Text className="text-sm font-medium text-green-700">{success}</Text>
              </View>
            ) : null}

            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. johndoe"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />
            <Text className={`mb-4 mt-1 text-xs ${username.length > 0 && username.trim().length < 3 ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              At least 3 characters
            </Text>

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />
            <Text className={`mb-4 mt-1 text-xs ${email.length > 0 && !email.includes('@') ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              Must be a valid email address
            </Text>

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />
            <Text className={`mb-6 mt-1 text-xs ${password.length > 0 && password.length < 6 ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              At least 6 characters
            </Text>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={!canSubmit || isLoading}
              className={`items-center rounded-2xl py-4 ${canSubmit && !isLoading ? 'bg-brand-primary' : 'bg-brand-light'}`}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Create Account</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
