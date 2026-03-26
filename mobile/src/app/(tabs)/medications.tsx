import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMedications } from '@/src/hooks/use-medications';
import { Medication } from '@/src/types/medication';

// ─── helpers ────────────────────────────────────────────────────────────────

function daysLeft(med: Medication) {
  return Math.floor(med.currentAmount / med.dailyDose);
}

function timeToStr(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── DaysPreview ─────────────────────────────────────────────────────────────

function DaysPreview({ amount, dose }: { amount: string; dose: string }) {
  const a = parseInt(amount, 10);
  const d = parseInt(dose, 10);
  if (!a || !d || d < 1) return null;
  const days = Math.floor(a / d);
  if (days <= 3) {
    return (
      <Text className="mt-2 text-sm font-semibold text-orange-500">
        ⚠ Only {days} day{days !== 1 ? 's' : ''} remaining — low stock!
      </Text>
    );
  }
  return (
    <Text className="mt-2 text-sm text-brand-primary">
      Notification scheduled in {days - 3} day{days - 3 !== 1 ? 's' : ''}
    </Text>
  );
}

// ─── IntakeTimesModal ─────────────────────────────────────────────────────────

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
    setLocalTimes((prev) =>
      prev.includes(str) ? prev : [...prev, str].sort()
    );
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

          {/* Time chips */}
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

          {/* iOS inline spinner */}
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

          {/* Android dialog picker */}
          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="default"
              onChange={handlePickerChange}
            />
          )}

          {/* Add Time button — hidden while iOS picker is open */}
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

          {/* Save / Cancel */}
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

// ─── MedicationCard ───────────────────────────────────────────────────────────

function MedicationCard({
  item,
  onEdit,
  onDelete,
  onSetTimes,
}: {
  item: Medication;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onSetTimes: (med: Medication) => void;
}) {
  const days = daysLeft(item);
  const isLow = days <= 3;

  return (
    <View className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
      {/* Colored top bar */}
      <View className={`h-2 w-full ${isLow ? 'bg-orange-400' : 'bg-brand-primary'}`} />

      <View className="p-4">
        {/* Name + badge row */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</Text>
          <View className={`rounded-full px-3 py-1 ${isLow ? 'bg-orange-100' : 'bg-brand-light'}`}>
            <Text
              className={`text-xs font-semibold ${isLow ? 'text-orange-600' : 'text-brand-primary'}`}>
              {isLow ? '⚠ Low stock' : `${days} days left`}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View className="mb-3 flex-row gap-3">
          <View className="flex-1 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-700">
            <Text className="text-xs text-gray-400">Remaining</Text>
            <Text className="text-base font-semibold text-gray-800 dark:text-white">
              {item.currentAmount} pills
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-700">
            <Text className="text-xs text-gray-400">Daily dose</Text>
            <Text className="text-base font-semibold text-gray-800 dark:text-white">
              {item.dailyDose} pill{item.dailyDose !== 1 ? 's' : ''}/day
            </Text>
          </View>
        </View>

        {/* Intake times row */}
        {item.intakeTimes.length > 0 && (
          <View className="mb-3 flex-row flex-wrap gap-1.5">
            {item.intakeTimes.map((t) => (
              <View key={t} className="rounded-full bg-brand-light px-2.5 py-1">
                <Text className="text-xs font-medium text-brand-primary">{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions row */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onSetTimes(item)}
            className="flex-1 items-center rounded-xl bg-brand-light py-2">
            <Text className="text-sm font-semibold text-brand-primary">
              {item.intakeTimes.length > 0 ? '⏰ Times' : '⏰ Set Times'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            className="flex-1 items-center rounded-xl border border-brand-mid py-2">
            <Text className="text-sm font-semibold text-brand-primary">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            className="flex-1 items-center rounded-xl border border-red-200 py-2">
            <Text className="text-sm font-semibold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── MedicationsScreen ────────────────────────────────────────────────────────

export default function MedicationsScreen() {
  const { medications, isLoading, addMedication, updateMedication, deleteMedication, setIntakeTimes } =
    useMedications();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDose, setFormDose] = useState('');

  const [intakeTimesMed, setIntakeTimesMed] = useState<Medication | null>(null);

  function openAdd() {
    setEditingMed(null);
    setFormName('');
    setFormAmount('');
    setFormDose('');
    setModalVisible(true);
  }

  function openEdit(med: Medication) {
    setEditingMed(med);
    setFormName(med.name);
    setFormAmount(String(med.currentAmount));
    setFormDose(String(med.dailyDose));
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingMed(null);
  }

  async function handleSave() {
    const name = formName.trim();
    const amount = parseInt(formAmount, 10);
    const dose = parseInt(formDose, 10);
    if (!name || !amount || amount <= 0 || !dose || dose < 1) return;

    if (editingMed) {
      await updateMedication(editingMed.id, {
        name,
        currentAmount: amount,
        dailyDose: dose,
        intakeTimes: editingMed.intakeTimes,
      });
    } else {
      await addMedication({ name, currentAmount: amount, dailyDose: dose, intakeTimes: [] });
    }
    closeModal();
  }

  const canSave =
    formName.trim().length > 0 &&
    parseInt(formAmount, 10) > 0 &&
    parseInt(formDose, 10) >= 1;

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">
        <Text className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Medications</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1D9E75" />
        ) : (
          <FlatList
            data={medications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MedicationCard
                item={item}
                onEdit={openEdit}
                onDelete={deleteMedication}
                onSetTimes={setIntakeTimesMed}
              />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center pt-20">
                <Text className="text-base text-gray-400 dark:text-gray-500">
                  No medications added yet.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <View className="px-4 pb-8 pt-2">
        <TouchableOpacity
          onPress={openAdd}
          className="items-center rounded-2xl bg-brand-primary py-4">
          <Text className="text-base font-semibold text-white">+ Add Medication</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add / Edit medication modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled">
              <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-gray-800">
                <Text className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                  {editingMed ? 'Edit Medication' : 'Add Medication'}
                </Text>

                <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Name
                </Text>
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

                <DaysPreview amount={formAmount} dose={formDose} />

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

      {/* ── Intake times modal ── */}
      <IntakeTimesModal
        medication={intakeTimesMed}
        onClose={() => setIntakeTimesMed(null)}
        onSave={setIntakeTimes}
      />
    </SafeAreaView>
  );
}
