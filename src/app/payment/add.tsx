import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import uuid from 'react-native-uuid';
import { insertPayment, getProjectById } from '@/database/database';
import { Project } from '@/types';
import { useEffect } from 'react';

export default function AddPaymentScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'material' | 'labor' | 'transport' | 'permit' | 'equipment' | 'misc'>('material');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | null>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (projectId) {
      const projectData = await getProjectById(projectId);
      setProject(projectData as Project);
    }
  };

  const handleSave = async () => {
    if (!itemDescription.trim()) {
      Alert.alert('Error', 'Please enter item description');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const payment = {
      id: uuid.v4() as string,
      project_id: projectId,
      payment_date: Math.floor(date.getTime() / 1000),
      category: category,
      item_description: itemDescription,
      quantity: 1,
      unit_price: parseFloat(amount),
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
      receipt_image_path: null,
    };

    try {
      await insertPayment(payment);
      Alert.alert('Success', 'Payment added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add payment');
      console.error(error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card rounded-xl p-5 shadow-sm">
        {/* Project Name Display */}
        {project && (
          <View className="mb-4 p-3 bg-primary/10 rounded-lg">
            <Text className="text-xs text-muted-foreground">Project</Text>
            <Text className="text-foreground font-semibold">{project.project_name}</Text>
          </View>
        )}

        {/* Date Picker */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Payment Date <Text className="text-destructive">*</Text>
        </Text>
        <TouchableOpacity
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 flex-row justify-between items-center"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-foreground">{date.toLocaleDateString('en-GB')}</Text>
          <Ionicons name="calendar-outline" size={20} color="hsl(var(--muted-foreground))" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Item Description */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Item Description <Text className="text-destructive">*</Text>
        </Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="e.g., Cement, Mabati, Labor payment"
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={itemDescription}
          onChangeText={setItemDescription}
        />

        {/* Amount */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Amount (KSH) <Text className="text-destructive">*</Text>
        </Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="0.00"
          placeholderTextColor="hsl(var(--muted-foreground))"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Category */}
        <Text className="text-sm font-semibold text-foreground mb-1">Category</Text>
        <View className="bg-input border border-border rounded-lg mb-4">
          <Picker
            selectedValue={category}
            onValueChange={(value) => setCategory(value as any)}
            dropdownIconColor="hsl(var(--foreground))"
          >
            <Picker.Item label="Materials" value="material" />
            <Picker.Item label="Labor" value="labor" />
            <Picker.Item label="Transport" value="transport" />
            <Picker.Item label="Permit" value="permit" />
            <Picker.Item label="Equipment" value="equipment" />
            <Picker.Item label="Miscellaneous" value="misc" />
          </Picker>
        </View>

        {/* Payment Method */}
        <Text className="text-sm font-semibold text-foreground mb-1">Payment Method</Text>
        <View className="bg-input border border-border rounded-lg mb-4">
          <Picker
            selectedValue={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as any)}
            dropdownIconColor="hsl(var(--foreground))"
          >
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="M-PESA" value="mpesa" />
            <Picker.Item label="Bank Transfer" value="bank_transfer" />
            <Picker.Item label="Cheque" value="cheque" />
          </Picker>
        </View>

        {/* Reference Number (shown for M-PESA) */}
        {paymentMethod === 'mpesa' && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-1">M-PESA Reference</Text>
            <TextInput
              className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
              placeholder="e.g., QWK3L4M9"
              placeholderTextColor="hsl(var(--muted-foreground))"
              value={referenceNumber}
              onChangeText={setReferenceNumber}
            />
          </>
        )}

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
            Add Payment
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}