import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { linkPatient } from '@/src/services/api/auth-api';
import { useAuthStore } from '@/src/stores/auth-store';

export default function LinkPatientScreen() {
  const setPatientLinked = useAuthStore((s) => s.setPatientLinked);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.includes('@') && email.length > 4;

  async function handleLink() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      await linkPatient(email.trim().toLowerCase());
      await setPatientLinked(true);
      router.replace('/(tabs)/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError('No patient found with that email. Make sure they have registered first.');
      } else {
        setError('Could not link patient. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView className="flex-1" behavior="height">
        <View className="flex-1 px-6 py-12">
          <Text className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Link Patient</Text>
          <Text className="mb-10 text-base text-gray-500 dark:text-gray-400">
            Enter the email address of the patient you are monitoring. They must already have a FeelSync account.
          </Text>

          {error ? (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Patient's Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="patient@email.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            className="mb-8 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
          />

          <TouchableOpacity
            onPress={handleLink}
            disabled={!canSubmit || isLoading}
            className={`items-center rounded-2xl py-4 ${canSubmit && !isLoading ? 'bg-brand-primary' : 'bg-brand-light'}`}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Link Patient</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
