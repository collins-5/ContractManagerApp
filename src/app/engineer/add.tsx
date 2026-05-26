import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { insertEngineer } from '@/database/database';

export default function AddEngineerScreen() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter engineer name');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    const engineer = {
      id: uuid.v4() as string,
      full_name: fullName,
      phone_number: phoneNumber,
      email: email || null,
      specialty: specialty || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      notes: notes || null,
    };

    try {
      await insertEngineer(engineer);
      Alert.alert('Success', 'Engineer added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add engineer');
      console.error(error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card rounded-xl p-5 shadow-sm">
        {/* Full Name */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Full Name <Text className="text-destructive">*</Text>
        </Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="Enter engineer name"
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Phone Number */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Phone Number <Text className="text-destructive">*</Text>
        </Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="e.g., 0712345678"
          placeholderTextColor="hsl(var(--muted-foreground))"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        {/* Email */}
        <Text className="text-sm font-semibold text-foreground mb-1">Email</Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="engineer@email.com"
          placeholderTextColor="hsl(var(--muted-foreground))"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Specialty */}
        <Text className="text-sm font-semibold text-foreground mb-1">Specialty</Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="e.g., Structural, Electrical, Plumbing"
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={specialty}
          onChangeText={setSpecialty}
        />

        {/* Hourly Rate */}
        <Text className="text-sm font-semibold text-foreground mb-1">Hourly Rate (KSH)</Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="Optional"
          placeholderTextColor="hsl(var(--muted-foreground))"
          keyboardType="numeric"
          value={hourlyRate}
          onChangeText={setHourlyRate}
        />

        {/* Notes */}
        <Text className="text-sm font-semibold text-foreground mb-1">Notes</Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="Additional notes"
          placeholderTextColor="hsl(var(--muted-foreground))"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-lg mt-2"
          onPress={handleSave}
        >
          <Text className="text-primary-foreground text-center font-semibold text-base">
            Save Engineer
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}