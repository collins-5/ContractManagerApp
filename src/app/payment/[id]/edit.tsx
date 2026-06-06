import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getAllProjects, updatePayment, deletePayment, getPaymentById } from '@/database/database';
import { Payment, Project } from '@/types';


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

export default function EditPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [projectId, setProjectId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Payment['category']>('material');
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, proj] = await Promise.all([getPaymentById(id as string), getAllProjects()]);
        if (!p) {
          Alert.alert('Error', 'Payment not found', [{ text: 'OK', onPress: () => router.back() }]);
          return;
        }
        setPayment(p as Payment);
        setProjects(proj as Project[]);

        setProjectId((p as Payment).project_id);
        setItemDescription((p as Payment).item_description);
        setAmount(String((p as Payment).amount ?? ''));
        setCategory((p as Payment).category);
        setPaymentMethod((p as Payment).payment_method);
        setReferenceNumber((p as Payment).reference_number ?? '');
        setNotes((p as Payment).notes ?? '');
      } catch {
        Alert.alert('Error', 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canSave = useMemo(
    () => projectId.trim().length > 0 && itemDescription.trim().length > 0 && Number(amount) > 0,
    [projectId, itemDescription, amount]
  );

  const handleSave = async () => {
    if (!canSave) return Alert.alert('Error', 'Please enter valid fields');

    try {
      await updatePayment(id as string, {
        project_id: projectId,
        item_description: itemDescription,
        amount: Number(amount),
        category,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      });
      Alert.alert('Success', 'Payment updated', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Error', 'Failed to update payment');
    }
  };

  const handleDelete = () => {
    if (!payment) return;
    Alert.alert('Delete Payment', `Are you sure you want to delete this payment?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePayment(id as string, payment.project_id);
            Alert.alert('Success', 'Payment deleted', [{ text: 'OK', onPress: () => router.back() }]);
          } catch {
            Alert.alert('Error', 'Failed to delete payment');
          }
        },
      },
    ]);
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

  if (!payment) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <Ionicons name="alert-circle-outline" size={48} color="#5C5A72" />
        <Text className="text-foreground font-bold text-lg">Payment not found</Text>
      </View>
    );
  }

  return (
    <>
      <View className="px-5 bg-primary/20 border-b border-l border-r border-primary/30 rounded-r-3xl rounded-l-3xl pt-4 pb-6 flex-row items-center justify-between gap-3">
        <TouchableOpacity
          className="flex-row mr-8 items-center gap-1.5"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color="#059669" />
          <Text className="text-primary text-sm font-semibold">Back</Text>
        </TouchableOpacity>
        <Text className="text-foreground text-3xl font-black tracking-tight">Edit Payment</Text>
        <View />
      </View>

      <ScrollView className="flex-1 py-2 bg-background" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-12">
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#059669' }} />
            <View className="p-5">
              <Text className="text-[#059669] text-[10px] font-bold tracking-widest uppercase mb-4">Required</Text>

              <FieldLabel label="Project ID" required />
              <StyledInput
                iconName="briefcase-outline"
                value={projectId}
                onChangeText={setProjectId}
                placeholder="project id"
              />

              <FieldLabel label="Description" required />
              <StyledInput
                iconName="document-text-outline"
                value={itemDescription}
                onChangeText={setItemDescription}
                placeholder="e.g. Cement"
              />

              <FieldLabel label="Amount" required />
              <StyledInput
                iconName="cash-outline"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-card border border-[#EF4444] rounded-2xl py-4 flex-row justify-center items-center gap-2"
              activeOpacity={0.85}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text className="font-bold text-base" style={{ color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-primary rounded-2xl py-4 flex-row justify-center items-center gap-2"
              activeOpacity={0.85}
              onPress={handleSave}
            >
              <Ionicons name="save-outline" size={18} color="white" />
              <Text className="text-white font-bold text-base">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

