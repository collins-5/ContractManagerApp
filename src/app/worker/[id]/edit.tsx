import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { deleteWorker, getWorkerById, updateWorker } from '@/database/database';
import { Worker } from '@/types';

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View className="flex-row items-center mb-1.5 gap-1">
      <Text className="text-foreground text-sm font-bold">{label}</Text>
      {required && <Text className="text-[#EF4444] text-sm font-bold">*</Text>}
    </View>
  );
}

function StyledInput({ iconName, ...props }: React.ComponentProps<typeof TextInput> & { iconName?: string }) {
  return (
    <View className="flex-row items-center bg-background border border-border rounded-xl mb-5 overflow-hidden">
      {iconName && (
        <View className="px-3">
          <Ionicons name={iconName as any} size={16} color="#5C5A72" />
        </View>
      )}
      <TextInput
        className="flex-1 py-3 pr-4 text-foreground text-sm"
        placeholderTextColor="#5C5A72"
        {...props}
      />
    </View>
  );
}

export default function EditWorkerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<Worker | null>(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trade, setTrade] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const w = await getWorkerById(id as string);
        if (!w) {
          Alert.alert('Error', 'Worker not found', [{ text: 'OK', onPress: () => router.back() }]);
          return;
        }
        setWorker(w);
        setFullName(w.full_name);
        setPhoneNumber(w.phone_number);
        setTrade(w.trade);
        setIdNumber(w.id_number ?? '');
        setDailyWage(w.daily_wage != null ? String(w.daily_wage) : '');
        setNotes(w.notes ?? '');
      } catch {
        Alert.alert('Error', 'Failed to load worker');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canSave = useMemo(
    () => fullName.trim().length > 0 && phoneNumber.trim().length > 0 && trade.trim().length > 0,
    [fullName, phoneNumber, trade]
  );

  const handleSave = async () => {
    if (!canSave) return Alert.alert('Error', 'Please enter worker name, phone number and trade');

    try {
      await updateWorker(id as string, {
        full_name: fullName,
        phone_number: phoneNumber,
        trade,
        id_number: idNumber || null,
        daily_wage: dailyWage ? parseFloat(dailyWage) : null,
        notes: notes || null,
      });
      Alert.alert('Success', 'Worker updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Error', 'Failed to update worker');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Worker',
      `Are you sure you want to delete ${worker?.full_name ?? 'this worker'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorker(id as string);
              Alert.alert('Success', 'Worker deleted successfully', [{ text: 'OK', onPress: () => router.back() }]);
            } catch {
              Alert.alert('Error', 'Failed to delete worker');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <View className="w-12 h-12 rounded-2xl bg-card border border-border items-center justify-center">
          <Ionicons name="hourglass-outline" size={24} color="#5C5A72" />
        </View>
        <Text className="text-muted-foreground text-sm">Loading…</Text>
      </View>
    );
  }

  if (!worker) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <Ionicons name="alert-circle-outline" size={48} color="#5C5A72" />
        <Text className="text-foreground font-bold text-lg">Worker not found</Text>
      </View>
    );
  }

  return (
    <>
      <View className="px-5 bg-primary/20 border-b border-l border-r border-primary/30 rounded-r-3xl rounded-l-3xl pt-4 pb-6 flex-row items-center justify-between gap-3">
        <TouchableOpacity
          className="flex-row items-center gap-1.5 mr-8"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color="#10B981" />
          <Text className="text-primary text-sm font-semibold">Back</Text>
        </TouchableOpacity>
        <Text className="text-foreground text-3xl font-black tracking-tight">Edit Worker</Text>
        <View />
      </View>

      <ScrollView className="flex-1 py-2 bg-background" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-12">
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#10B981' }} />
            <View className="p-5">
              <Text className="text-[#10B981] text-[10px] font-bold tracking-widest uppercase mb-4">Required</Text>

              <FieldLabel label="Full Name" required />
              <StyledInput
                iconName="person-outline"
                placeholder="e.g. James Mwangi"
                value={fullName}
                onChangeText={setFullName}
              />

              <FieldLabel label="Phone Number" required />
              <StyledInput
                iconName="call-outline"
                placeholder="e.g. 0712 345 678"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <FieldLabel label="Trade" required />
              <StyledInput
                iconName="hammer-outline"
                placeholder="e.g. Mason, Carpenter, Plumber"
                value={trade}
                onChangeText={setTrade}
              />
            </View>
          </View>

          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#3B82F6' }} />
            <View className="p-5">
              <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-4">Employment</Text>

              <FieldLabel label="Daily Wage (KSh)" />
              <StyledInput
                iconName="cash-outline"
                placeholder="e.g. 1500"
                keyboardType="numeric"
                value={dailyWage}
                onChangeText={setDailyWage}
              />

              <FieldLabel label="ID Number" />
              <StyledInput
                iconName="card-outline"
                placeholder="National ID"
                keyboardType="numeric"
                value={idNumber}
                onChangeText={setIdNumber}
              />
            </View>
          </View>

          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
            <View className="p-5">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-4">Notes</Text>

              <View className="flex-row bg-background border border-border rounded-xl overflow-hidden">
                <View className="px-3 pt-3">
                  <Ionicons name="document-text-outline" size={16} color="#5C5A72" />
                </View>
                <TextInput
                  className="flex-1 py-3 pr-4 text-foreground text-sm"
                  placeholder="Any additional notes…"
                  placeholderTextColor="#5C5A72"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={setNotes}
                  style={{ minHeight: 96 }}
                />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-card border border-[#EF4444] rounded-2xl py-4 flex-row justify-center items-center gap-2"
              activeOpacity={0.85}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text className="font-bold text-base" style={{ color: '#EF4444' }}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-2xl py-4 flex-row justify-center items-center gap-2"
              activeOpacity={0.85}
              onPress={handleSave}
            >
              <Ionicons name="save-outline" size={18} color="white" />
              <Text className="text-white text-base font-bold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

