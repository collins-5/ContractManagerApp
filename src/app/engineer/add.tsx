import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { insertEngineer } from '@/database/database';

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

export default function AddEngineerScreen() {
  const [fullName,    setFullName]    = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email,       setEmail]       = useState('');
  const [specialty,   setSpecialty]   = useState('');
  const [hourlyRate,  setHourlyRate]  = useState('');
  const [notes,       setNotes]       = useState('');

  const handleSave = async () => {
    if (!fullName.trim())    return Alert.alert('Error', 'Please enter engineer name');
    if (!phoneNumber.trim()) return Alert.alert('Error', 'Please enter phone number');

    try {
      await insertEngineer({
        id: uuid.v4() as string,
        full_name:    fullName,
        phone_number: phoneNumber,
        email:        email      || null,
        specialty:    specialty  || null,
        hourly_rate:  hourlyRate ? parseFloat(hourlyRate) : null,
        notes:        notes      || null,
      });
      Alert.alert('Success', 'Engineer added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add engineer');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View className="px-5 pt-14 pb-6">
        <TouchableOpacity className="flex-row items-center gap-1.5 mb-4" onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#F59E0B" />
          <Text className="text-[#F59E0B] text-sm font-semibold">Back</Text>
        </TouchableOpacity>
        <Text className="text-[#F59E0B] text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">New Entry</Text>
        <Text className="text-foreground text-3xl font-black tracking-tight">Add Engineer</Text>
      </View>

      <View className="px-5 pb-12">
        {/* ── Required ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
          <View className="p-5">
            <Text className="text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase mb-4">Required</Text>

            <FieldLabel label="Full Name" required />
            <StyledInput iconName="person-outline" placeholder="e.g. Grace Wanjiku" value={fullName} onChangeText={setFullName} />

            <FieldLabel label="Phone Number" required />
            <StyledInput iconName="call-outline" placeholder="e.g. 0712 345 678" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
          </View>
        </View>

        {/* ── Professional ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#3B82F6' }} />
          <View className="p-5">
            <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-4">Professional</Text>

            <FieldLabel label="Specialty" />
            <StyledInput iconName="briefcase-outline" placeholder="e.g. Structural, Electrical, Plumbing" value={specialty} onChangeText={setSpecialty} />

            <FieldLabel label="Hourly Rate (KSh)" />
            <StyledInput iconName="cash-outline" placeholder="e.g. 2500" keyboardType="numeric" value={hourlyRate} onChangeText={setHourlyRate} />

            <FieldLabel label="Email" />
            <StyledInput iconName="mail-outline" placeholder="engineer@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
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
          <Ionicons name="construct-outline" size={18} color="white" />
          <Text className="text-white text-base font-bold">Save Engineer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}