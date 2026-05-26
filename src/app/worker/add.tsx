import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { insertWorker } from '@/database/database';

export default function AddWorkerScreen() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trade, setTrade] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter worker name');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (!trade.trim()) {
      Alert.alert('Error', 'Please enter trade');
      return;
    }

    const worker = {
      id: uuid.v4() as string,
      full_name: fullName,
      phone_number: phoneNumber,
      trade: trade,
      id_number: idNumber || null,
      daily_wage: dailyWage ? parseFloat(dailyWage) : null,
      rating: null,
      notes: notes || null,
    };

    try {
      await insertWorker(worker);
      Alert.alert('Success', 'Worker added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add worker');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="bg-primary px-4 pt-2 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <Ionicons name="arrow-back" size={24} color="hsl(var(--primary-foreground))" />
          </TouchableOpacity>
          <Text className="text-primary-foreground text-xl font-bold flex-1">
            Add New Worker (Fundi)
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-card rounded-xl p-5 shadow-sm">
          <Text className="text-sm font-semibold text-foreground mb-1">
            Full Name <Text className="text-destructive">*</Text>
          </Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
            placeholder="Enter worker name"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={fullName}
            onChangeText={setFullName}
          />

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

          <Text className="text-sm font-semibold text-foreground mb-1">
            Trade <Text className="text-destructive">*</Text>
          </Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
            placeholder="e.g., Mason, Carpenter, Plumber"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={trade}
            onChangeText={setTrade}
          />

          <Text className="text-sm font-semibold text-foreground mb-1">ID Number</Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
            placeholder="Optional"
            placeholderTextColor="hsl(var(--muted-foreground))"
            keyboardType="numeric"
            value={idNumber}
            onChangeText={setIdNumber}
          />

          <Text className="text-sm font-semibold text-foreground mb-1">Daily Wage (KSH)</Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
            placeholder="Optional"
            placeholderTextColor="hsl(var(--muted-foreground))"
            keyboardType="numeric"
            value={dailyWage}
            onChangeText={setDailyWage}
          />

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

          <TouchableOpacity
            className="bg-primary py-4 rounded-lg mt-2"
            onPress={handleSave}
          >
            <Text className="text-primary-foreground text-center font-semibold text-base">
              Save Worker
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}