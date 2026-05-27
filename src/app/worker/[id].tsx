import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getWorkerById, deleteWorker } from '@/database/database';
import { Worker } from '@/types';

const fmtDt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View className="flex-row items-start gap-3 py-3.5 border-b border-border last:border-0">
      <View className="w-8 h-8 rounded-xl bg-green-500/10 items-center justify-center mt-0.5">
        <Ionicons name={icon as any} size={15} color="#10B981" />
      </View>
      <View className="flex-1">
        <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{label}</Text>
        <Text className="text-sm font-medium" style={{ color: valueColor ?? '#F1F0FA' }}>{value}</Text>
      </View>
    </View>
  );
}

export default function WorkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkerById(id)
      .then(d => setWorker(d as Worker))
      .catch(() => Alert.alert('Error', 'Failed to load worker details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Worker',
      `Are you sure you want to delete ${worker?.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorker(id);
              Alert.alert('Success', 'Worker deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete worker');
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
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View className="px-5 pt-14 pb-6">
        <TouchableOpacity className="flex-row items-center gap-1.5 mb-4" onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#10B981" />
          <Text className="text-[#10B981] text-sm font-semibold">Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-2xl border-2 border-[#10B981] bg-green-500/10 items-center justify-center">
            <Text className="text-2xl font-black text-[#10B981]">{initials(worker.full_name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[#10B981] text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">Worker / Fundi</Text>
            <Text className="text-foreground text-2xl font-black tracking-tight">{worker.full_name}</Text>
            {worker.trade && (
              <Text className="text-muted-foreground text-sm mt-0.5">{worker.trade}</Text>
            )}
          </View>
        </View>
      </View>

      <View className="px-5 pb-10">

        {/* ── Contact ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#10B981' }} />
          <View className="px-4 pt-4 pb-1">
            <Text className="text-[#10B981] text-[10px] font-bold tracking-widest uppercase mb-2">Contact</Text>
            <InfoRow icon="call-outline" label="Phone" value={worker.phone_number} />
          </View>
        </View>

        {/* ── Professional / Work ── */}
        {(worker.trade || worker.daily_wage || worker.id_number) && (
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#3B82F6' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-2">Work Details</Text>
              {worker.trade && <InfoRow icon="briefcase-outline" label="Trade" value={worker.trade} />}
              {worker.id_number && <InfoRow icon="card-outline" label="ID Number" value={worker.id_number} />}
              {worker.daily_wage && (
                <InfoRow
                  icon="cash-outline"
                  label="Daily Wage"
                  value={`KSh ${worker.daily_wage.toLocaleString()}/day`}
                  valueColor="#10B981"
                />
              )}
            </View>
          </View>
        )}

        {/* ── Rating ── */}
        {worker.rating && (
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase mb-2">Rating</Text>
              <View className="flex-row items-center gap-2 py-3.5">
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= (worker.rating || 0) ? 'star' : 'star-outline'}
                      size={18}
                      color={star <= (worker.rating || 0) ? '#F59E0B' : '#5C5A72'}
                    />
                  ))}
                </View>
                <Text className="text-muted-foreground text-sm">({worker.rating}/5)</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Notes ── */}
        {worker.notes && (
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
            <View className="p-5">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-3">Notes</Text>
              <Text className="text-muted-foreground text-sm leading-relaxed">{worker.notes}</Text>
            </View>
          </View>
        )}

        {/* ── Record ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
          <View className="px-4 pt-4 pb-1">
            <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">Record</Text>
            <InfoRow icon="calendar-outline" label="Added On" value={fmtDt(worker.created_at)} />
          </View>
        </View>

        {/* ── Actions ── */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-2xl py-3.5 flex-row justify-center items-center gap-2"
            activeOpacity={0.85}
            onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be added')}
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="text-white font-bold text-sm">Edit Worker</Text>
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