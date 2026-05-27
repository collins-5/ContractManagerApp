import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { insertWorker } from '@/database/database';

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
        <View className="px-3"><Ionicons name={iconName as any} size={16} color="#5C5A72" /></View>
      )}
      <TextInput
        className="flex-1 py-3 pr-4 text-foreground text-sm"
        placeholderTextColor="#5C5A72"
        {...props}
      />
    </View>
  );
}

export default function AddWorkerScreen() {
  const [fullName,    setFullName]    = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trade,       setTrade]       = useState('');
  const [idNumber,    setIdNumber]    = useState('');
  const [dailyWage,   setDailyWage]   = useState('');
  const [notes,       setNotes]       = useState('');

  const handleSave = async () => {
    if (!fullName.trim())    return Alert.alert('Error', 'Please enter worker name');
    if (!phoneNumber.trim()) return Alert.alert('Error', 'Please enter phone number');
    if (!trade.trim())       return Alert.alert('Error', 'Please enter trade');

    try {
      await insertWorker({
        id: uuid.v4() as string,
        full_name:    fullName,
        phone_number: phoneNumber,
        trade,
        id_number:  idNumber  || null,
        daily_wage: dailyWage ? parseFloat(dailyWage) : null,
        rating:     null,
        notes:      notes     || null,
      });
      Alert.alert('Success', 'Worker added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add worker');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View className="px-5 pt-14 pb-6">
        <TouchableOpacity className="flex-row items-center gap-1.5 mb-4" onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#10B981" />
          <Text className="text-[#10B981] text-sm font-semibold">Back</Text>
        </TouchableOpacity>
        <Text className="text-[#10B981] text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">New Entry</Text>
        <Text className="text-foreground text-3xl font-black tracking-tight">Add Worker</Text>
      </View>

      <View className="px-5 pb-12">
        {/* ── Required ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#10B981' }} />
          <View className="p-5">
            <Text className="text-[#10B981] text-[10px] font-bold tracking-widest uppercase mb-4">Required</Text>

            <FieldLabel label="Full Name" required />
            <StyledInput iconName="person-outline" placeholder="e.g. James Mwangi" value={fullName} onChangeText={setFullName} />

            <FieldLabel label="Phone Number" required />
            <StyledInput iconName="call-outline" placeholder="e.g. 0712 345 678" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />

            <FieldLabel label="Trade" required />
            <StyledInput iconName="hammer-outline" placeholder="e.g. Mason, Carpenter, Plumber" value={trade} onChangeText={setTrade} />
          </View>
        </View>

        {/* ── Employment ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#3B82F6' }} />
          <View className="p-5">
            <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-4">Employment</Text>

            <FieldLabel label="Daily Wage (KSh)" />
            <StyledInput iconName="cash-outline" placeholder="e.g. 1500" keyboardType="numeric" value={dailyWage} onChangeText={setDailyWage} />

            <FieldLabel label="ID Number" />
            <StyledInput iconName="card-outline" placeholder="National ID" keyboardType="numeric" value={idNumber} onChangeText={setIdNumber} />
          </View>
        </View>

        {/* ── Notes ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
          <View className="p-5">
            <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-4">Notes</Text>
            <View className="flex-row bg-background border border-border rounded-xl overflow-hidden">
              <View className="px-3 pt-3"><Ionicons name="document-text-outline" size={16} color="#5C5A72" /></View>
              <TextInput
                className="flex-1 py-3 pr-4 text-foreground text-sm"
                placeholder="Any additional notes…"
                placeholderTextColor="#5C5A72"
                multiline numberOfLines={4} textAlignVertical="top"
                value={notes} onChangeText={setNotes}
                style={{ minHeight: 96 }}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity className="bg-primary rounded-2xl py-4 flex-row justify-center items-center gap-2" activeOpacity={0.85} onPress={handleSave}>
          <Ionicons name="hammer-outline" size={18} color="white" />
          <Text className="text-white text-base font-bold">Save Worker</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}