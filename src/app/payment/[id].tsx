import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getProjectById } from '@/database/database';
import { Payment, Project } from '@/types';

const fmt = (n: number) => `KSh ${n.toLocaleString()}`;
const fmtDt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const CATEGORY = {
  material:  { icon: 'cube-outline',          dot: '#3B82F6', muted: '#1D3A6E', label: 'Material'  },
  labor:     { icon: 'people-outline',        dot: '#10B981', muted: '#0C4A36', label: 'Labor'     },
  transport: { icon: 'car-outline',           dot: '#F59E0B', muted: '#6B420A', label: 'Transport' },
  permit:    { icon: 'document-text-outline', dot: '#A855F7', muted: '#4A1A6E', label: 'Permit'    },
  equipment: { icon: 'hardware-chip-outline', dot: '#EF4444', muted: '#5C1A1A', label: 'Equipment' },
  misc:      { icon: 'receipt-outline',       dot: '#8E8CA8', muted: '#2A2A36', label: 'Other'    },
} as const;

type CatKey = keyof typeof CATEGORY;

// Helper to get payment by ID
const getPaymentById = async (id: string): Promise<Payment | null> => {
  const { db } = await import('@/database/connection');
  const result = await db.getFirstAsync('SELECT * FROM payments WHERE id = ?', [id]);
  return result as Payment | null;
};

const deletePayment = async (id: string, projectId: string) => {
  const { db } = await import('@/database/connection');
  await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
  // Update project actual cost
  const result = await db.getFirstAsync('SELECT SUM(amount) as total FROM payments WHERE project_id = ?', [projectId]);
  const total = (result as any)?.total || 0;
  await db.runAsync('UPDATE projects SET actual_cost = ? WHERE id = ?', [total, projectId]);
};

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentDetails();
  }, [id]);

  const loadPaymentDetails = async () => {
    try {
      const paymentData = await getPaymentById(id);
      if (paymentData) {
        setPayment(paymentData);
        const projectData = await getProjectById(paymentData.project_id);
        setProject(projectData as Project);
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      Alert.alert('Error', 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Payment',
      `Are you sure you want to delete this payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(id, payment!.project_id);
              Alert.alert('Success', 'Payment deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete payment');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <View className="w-12 h-12 rounded-2xl bg-card border border-border items-center justify-center">
          <Ionicons name="hourglass-outline" size={24} color="#5C5A72" />
        </View>
        <Text className="text-muted-foreground text-sm">Loading payment details…</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <Ionicons name="alert-circle-outline" size={48} color="#5C5A72" />
        <Text className="text-foreground font-bold text-lg">Payment not found</Text>
        <TouchableOpacity
          className="mt-2 bg-primary px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-primary-foreground font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cat = CATEGORY[payment.category as CatKey] ?? CATEGORY.misc;

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View className="px-5 pt-14 pb-6">
        <TouchableOpacity 
          className="flex-row items-center gap-1.5 mb-4" 
          onPress={() => router.back()} 
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={cat.dot} />
          <Text className="text-sm font-semibold" style={{ color: cat.dot }}>Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <View 
            className="w-16 h-16 rounded-2xl border-2 items-center justify-center"
            style={{ borderColor: cat.dot, backgroundColor: cat.muted }}
          >
            <Ionicons name={cat.icon as any} size={28} color={cat.dot} />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-semibold tracking-[3px] uppercase mb-0.5" style={{ color: cat.dot }}>
              Payment Receipt
            </Text>
            <Text className="text-foreground text-2xl font-black tracking-tight">
              {fmt(payment.amount)}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-5 pb-10">

        {/* ── Payment Details Card ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: cat.dot }} />
          <View className="px-4 pt-4 pb-1">
            <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-2">Payment Details</Text>
            
            {/* Description */}
            <View className="flex-row items-start gap-3 py-3.5 border-b border-border">
              <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mt-0.5">
                <Ionicons name="document-text-outline" size={15} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Description</Text>
                <Text className="text-sm font-medium text-foreground">{payment.item_description}</Text>
              </View>
            </View>

            {/* Amount */}
            <View className="flex-row items-start gap-3 py-3.5 border-b border-border">
              <View className="w-8 h-8 rounded-xl bg-success/10 items-center justify-center mt-0.5">
                <Ionicons name="cash-outline" size={15} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Amount</Text>
                <Text className="text-sm font-medium text-success">{fmt(payment.amount)}</Text>
              </View>
            </View>

            {/* Category */}
            <View className="flex-row items-start gap-3 py-3.5 border-b border-border">
              <View className="w-8 h-8 rounded-xl items-center justify-center mt-0.5" style={{ backgroundColor: cat.muted }}>
                <Ionicons name={cat.icon as any} size={15} color={cat.dot} />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Category</Text>
                <Text className="text-sm font-medium text-foreground">{cat.label}</Text>
              </View>
            </View>

            {/* Date */}
            <View className="flex-row items-start gap-3 py-3.5 border-b border-border">
              <View className="w-8 h-8 rounded-xl bg-warning/10 items-center justify-center mt-0.5">
                <Ionicons name="calendar-outline" size={15} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Payment Date</Text>
                <Text className="text-sm font-medium text-foreground">{fmtDt(payment.payment_date)}</Text>
              </View>
            </View>

            {/* Payment Method */}
            {payment.payment_method && (
              <View className="flex-row items-start gap-3 py-3.5 border-b border-border">
                <View className="w-8 h-8 rounded-xl bg-purple-500/10 items-center justify-center mt-0.5">
                  <Ionicons name="card-outline" size={15} color="#A855F7" />
                </View>
                <View className="flex-1">
                  <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Payment Method</Text>
                  <Text className="text-sm font-medium text-foreground capitalize">
                    {payment.payment_method.replace('_', ' ')}
                  </Text>
                  {payment.reference_number && (
                    <Text className="text-xs text-muted-foreground mt-0.5">Ref: {payment.reference_number}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Receipt Image ── */}
        {payment.receipt_image_path && (
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
            <View className="p-4">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">Receipt Image</Text>
              <Image 
                source={{ uri: payment.receipt_image_path }} 
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
            </View>
          </View>
        )}

        {/* ── Project Card ── */}
        {project && (
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#8E8CA8' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">Related Project</Text>
              
              <TouchableOpacity 
                onPress={() => router.push(`/project/${project.id}`)}
                className="flex-row items-start gap-3 py-3.5"
              >
                <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mt-0.5">
                  <Ionicons name="construct-outline" size={15} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{project.project_name}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    Budget: {fmt(project.budget)} • Status: {project.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#5C5A72" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Notes ── */}
        {payment.notes && (
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            <View style={{ height: 3, backgroundColor: '#8E8CA8' }} />
            <View className="p-5">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-3">Notes</Text>
              <Text className="text-muted-foreground text-sm leading-relaxed">{payment.notes}</Text>
            </View>
          </View>
        )}

        {/* ── Actions ── */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-2xl py-3.5 flex-row justify-center items-center gap-2"
            activeOpacity={0.85}
            onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be added')}
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="text-white font-bold text-sm">Edit Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-card border border-[#EF4444] rounded-2xl py-3.5 flex-row justify-center items-center gap-2"
            activeOpacity={0.85}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text className="font-bold text-sm text-[#EF4444]">Delete</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}