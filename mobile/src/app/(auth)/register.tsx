import { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { register } from '@/src/services/api/auth-api';
import { useAuthStore } from '@/src/stores/auth-store';

export default function RegisterScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          setExpoPushToken(tokenData.data);
        }
      } catch {
        // Push token unavailable (simulator or no Play Services) — proceed without it
      }
    })();
  }, []);

  const canSubmit =
    username.trim().length >= 3 &&
    email.includes('@') &&
    password.length >= 6;

  async function handleRegister() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        expoPushToken: expoPushToken ?? undefined,
      });
      await setAuth(result.token, null);
      router.replace('/(auth)/role-select');
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
            <View className="mb-10 items-center">
              <Text className="text-4xl font-bold text-brand-primary">FeelSync</Text>
              <Text className="mt-2 text-base text-gray-500 dark:text-gray-400">Create your account</Text>
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
              placeholder="At least 3 characters"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />

            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="mb-8 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
            />

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
