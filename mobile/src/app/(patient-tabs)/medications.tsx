import { useEffect, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MedicationCard } from '@/src/components/medication-card';
import { getBleService } from '@/src/services/ble';
import { MedicationReminder, useMedicationRemindersStore } from '@/src/stores/medication-reminders-store';
import { useMedicationsStore } from '@/src/stores/medications-store';
import { Medication } from '@/src/types/medication';

function timeToStr(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function IntakeTimesModal({
  medication,
  onClose,
  onSave,
}: {
  medication: Medication | null;
  onClose: () => void;
  onSave: (id: string, times: string[]) => void;
}) {
  const [localTimes, setLocalTimes] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    if (medication) {
      setLocalTimes([...medication.intakeTimes]);
      setShowPicker(false);
    }
  }, [medication?.id]);

  function handlePickerChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) addTime(date);
    } else {
      if (date) setPickerDate(date);
    }
  }

  function addTime(date: Date) {
    const str = timeToStr(date);
    setLocalTimes((prev) => (prev.includes(str) ? prev : [...prev, str].sort()));
  }

  function removeTime(time: string) {
    setLocalTimes((prev) => prev.filter((t) => t !== time));
  }

  if (!medication) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-gray-800">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Intake Times</Text>
          <Text className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {medication.name}
          </Text>

          {localTimes.length === 0 ? (
            <Text className="mb-4 text-center text-sm text-gray-400 dark:text-gray-500">
              No times set yet.
            </Text>
          ) : (
            <View className="mb-4 flex-row flex-wrap gap-2">
              {localTimes.map((t) => (
                <View
                  key={t}
                  className="flex-row items-center rounded-full bg-brand-light px-3 py-1.5">
                  <Text className="mr-2 text-sm font-semibold text-brand-primary">{t}</Text>
                  <TouchableOpacity onPress={() => removeTime(t)} hitSlop={8}>
                    <Text className="text-base font-bold leading-none text-brand-primary">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {showPicker && Platform.OS === 'ios' && (
            <View className="mb-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handlePickerChange}
                themeVariant="light"
              />
              <TouchableOpacity
                onPress={() => {
                  addTime(pickerDate);
                  setShowPicker(false);
                }}
                className="mx-4 mb-3 items-center rounded-xl bg-brand-primary py-2">
                <Text className="text-sm font-semibold text-white">+ Add this time</Text>
              </TouchableOpacity>
            </View>
          )}

          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="default"
              onChange={handlePickerChange}
            />
          )}

          {!showPicker && (
            <TouchableOpacity
              onPress={() => {
                setPickerDate(new Date());
                setShowPicker(true);
              }}
              className="mb-5 items-center rounded-xl border border-brand-mid py-2.5">
              <Text className="text-sm font-semibold text-brand-primary">+ Add Time</Text>
            </TouchableOpacity>
          )}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center rounded-xl border border-gray-200 py-3 dark:border-gray-600">
              <Text className="text-base font-medium text-gray-600 dark:text-gray-300">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSave(medication.id, localTimes);
                onClose();
              }}
              className="flex-1 items-center rounded-xl bg-brand-primary py-3">
              <Text className="text-base font-semibold text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatTime(hhmm: string): string {
  const [hh, mm] = hhmm.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hour = hh % 12 || 12;
  return `${hour}:${String(mm).padStart(2, '0')} ${period}`;
}

function ReminderBanner({ reminder, onDismiss }: { reminder: MedicationReminder; onDismiss: () => void }) {
  const isMissed = reminder.missedAt != null;
  return (
    <View
      className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
      style={{
        backgroundColor: isMissed ? '#FFF7ED' : '#F0FDF4',
        borderLeftWidth: 4,
        borderLeftColor: isMissed ? '#F97316' : '#1D9E75',
      }}>
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold" style={{ color: isMissed ? '#C2410C' : '#15803D' }}>
          {isMissed ? 'Missed dose' : 'Time for your dose'}
        </Text>
        <Text className="mt-0.5 text-base text-gray-800 dark:text-gray-100">
          <Text className="font-bold">{reminder.medicationName}</Text>
          {'  •  '}
          {formatTime(reminder.intakeTime)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDismiss}
        className="rounded-lg px-3 py-1.5 active:opacity-70"
        style={{ backgroundColor: isMissed ? '#F97316' : '#1D9E75' }}>
        <Text className="text-sm font-semibold text-white">OK</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PatientMedicationsScreen() {
  const medications = useMedicationsStore((s) => s.medications);
  const isLoading = useMedicationsStore((s) => s.isLoading);
  const addMedication = useMedicationsStore((s) => s.addMedication);
  const deleteMedication = useMedicationsStore((s) => s.deleteMedication);
  const setIntakeTimes = useMedicationsStore((s) => s.setIntakeTimes);
  const fetchMedications = useMedicationsStore((s) => s.fetchMedications);

  const pendingReminders = useMedicationRemindersStore((s) => s.pendingReminders);
  const dismissReminder = useMedicationRemindersStore((s) => s.dismissReminder);

  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDose, setFormDose] = useState('');
  const [intakeTimesMed, setIntakeTimesMed] = useState<Medication | null>(null);

  function openAdd() {
    setFormName('');
    setFormAmount('');
    setFormDose('');
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
  }

  async function handleSave() {
    const name = formName.trim();
    const amount = parseInt(formAmount, 10);
    const dose = parseInt(formDose, 10);
    if (!name || !amount || amount <= 0 || !dose || dose < 1) return;
    await addMedication({ name, currentAmount: amount, dailyDose: dose, intakeTimes: [] });
    closeModal();
  }

  const canSave =
    formName.trim().length > 0 &&
    parseInt(formAmount, 10) > 0 &&
    parseInt(formDose, 10) >= 1;

  const listHeader =
    pendingReminders.length > 0 ? (
      <View className="mb-2">
        {pendingReminders.map((r) => (
          <ReminderBanner key={r.id} reminder={r} onDismiss={() => dismissReminder(r.id)} />
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">
        <Text className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Medications</Text>

        {isLoading && medications.length === 0 ? (
          <ActivityIndicator size="large" color="#1D9E75" />
        ) : (
          <FlatList
            data={medications}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchMedications} tintColor="#1D9E75" />
            }
            ListHeaderComponent={listHeader}
            renderItem={({ item }) => (
              <MedicationCard
                item={item}
                showActions
                onSetTimes={setIntakeTimesMed}
                onDelete={deleteMedication}
              />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              pendingReminders.length === 0 ? (
                <View className="items-center pt-20">
                  <Text className="text-base text-gray-400 dark:text-gray-500">
                    No medications assigned.
                  </Text>
                  <Text className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">
                    Your guardian can add medications from their app.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      <View className="gap-2 px-4 pb-8 pt-2">
        <TouchableOpacity
          onPress={openAdd}
          className="items-center rounded-2xl bg-brand-primary py-4">
          <Text className="text-base font-semibold text-white">+ Add Medication</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            getBleService()
              .writeToDevice('VIBRATE')
              .then(() => Alert.alert('Vibration sent'))
              .catch((e: Error) => Alert.alert('BLE Error', e.message));
          }}
          className="items-center rounded-2xl border border-brand-mid py-4">
          <Text className="text-base font-semibold text-brand-primary">Test Vibration</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-gray-800">
                <Text className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                  Add Medication
                </Text>

                <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Name</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Lithium"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
                />

                <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Current amount (pills)
                </Text>
                <TextInput
                  value={formAmount}
                  onChangeText={setFormAmount}
                  placeholder="e.g. 60"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
                />

                <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Daily dose (pills/day)
                </Text>
                <TextInput
                  value={formDose}
                  onChangeText={setFormDose}
                  placeholder="e.g. 2"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  className="mb-2 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 dark:border-gray-600 dark:text-white"
                />

                <View className="mt-6 flex-row gap-3">
                  <TouchableOpacity
                    onPress={closeModal}
                    className="flex-1 items-center rounded-xl border border-gray-200 py-3 dark:border-gray-600">
                    <Text className="text-base font-medium text-gray-600 dark:text-gray-300">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!canSave}
                    className={`flex-1 items-center rounded-xl py-3 ${canSave ? 'bg-brand-primary' : 'bg-brand-light'}`}>
                    <Text className="text-base font-semibold text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <IntakeTimesModal
        medication={intakeTimesMed}
        onClose={() => setIntakeTimesMed(null)}
        onSave={setIntakeTimes}
      />
    </SafeAreaView>
  );
}
