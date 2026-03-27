import { router } from 'expo-router';
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

import { login } from '@/src/services/api/auth-api';
import { getRole } from '@/src/services/storage/secure-storage';
import { useAuthStore } from '@/src/stores/auth-store';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = username.trim().length > 0 && password.length >= 6;

  async function handleLogin() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await login({ username: username.trim(), password });
      // Role was saved during registration; read from SecureStore
      const role = await getRole();
      await setAuth(result.token, role ?? 'PATIENT');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid username or password';
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
          <View className="flex-1 justify-center px-6 py-12">
            {/* Logo / Title */}
            <View className="mb-10 items-center">
              <Text className="text-4xl font-bold text-brand-primary">FeelSync</Text>
              <Text className="mt-2 text-base text-gray-500 dark:text-gray-400">Sign in to continue</Text>
            </View>

            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="mb-6 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canSubmit || isLoading}
              className={`items-center rounded-2xl py-4 ${canSubmit && !isLoading ? 'bg-brand-primary' : 'bg-brand-light'}`}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Sign In</Text>
              )}
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-sm text-gray-500 dark:text-gray-400">{"Don't have an account? "}</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register' as never)}>
                <Text className="text-sm font-semibold text-brand-primary">Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
