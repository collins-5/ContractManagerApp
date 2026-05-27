import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getEngineerById } from '@/database/database';
import { Engineer } from '@/types';

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
      <View className="w-8 h-8 rounded-xl bg-[#6B420A] items-center justify-center mt-0.5">
        <Ionicons name={icon as any} size={15} color="#F59E0B" />
      </View>
      <View className="flex-1">
        <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{label}</Text>
        <Text className="text-sm font-medium" style={{ color: valueColor ?? '#F1F0FA' }}>{value}</Text>
      </View>
    </View>
  );
}

export default function EngineerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEngineerById(id)
      .then(d => setEngineer(d as Engineer))
      .catch(() => Alert.alert('Error', 'Failed to load engineer details'))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (!engineer) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <Ionicons name="alert-circle-outline" size={48} color="#5C5A72" />
        <Text className="text-foreground font-bold text-lg">Engineer not found</Text>
      </View>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <View className="px-5 bg-primary/20 border-b border-l border-r border-primary/30 rounded-r-3xl rounded-l-3xl pt-4 pb-6 flex-row items-center justify-between gap-3">
        <TouchableOpacity className="flex-row mr-4 items-center gap-1.5 mb-4" onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#F59E0B" />
          <Text className="text-[#F59E0B] text-sm font-semibold">Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-2xl border-2 border-[#F59E0B] bg-[#6B420A] items-center justify-center">
            <Text className="text-2xl font-black text-[#F59E0B]">{initials(engineer.full_name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[#F59E0B] text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">Engineer</Text>
            <Text className="text-foreground text-2xl font-black tracking-tight">{engineer.full_name}</Text>
            {engineer.specialty && (
              <Text className="text-muted-foreground text-sm mt-0.5">{engineer.specialty}</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 py-2 bg-background" showsVerticalScrollIndicator={false}>


        <View className="px-5 pb-10">

          {/* ── Contact ── */}
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase mb-2">Contact</Text>
              <InfoRow icon="call-outline" label="Phone" value={engineer.phone_number} />
              {engineer.email && <InfoRow icon="mail-outline" label="Email" value={engineer.email} />}
            </View>
          </View>

          {/* ── Professional ── */}
          {(engineer.specialty || engineer.hourly_rate) && (
            <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
              <View style={{ height: 3, backgroundColor: '#3B82F6' }} />
              <View className="px-4 pt-4 pb-1">
                <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-2">Professional</Text>
                {engineer.specialty && <InfoRow icon="briefcase-outline" label="Specialty" value={engineer.specialty} />}
                {engineer.hourly_rate && (
                  <InfoRow
                    icon="cash-outline"
                    label="Hourly Rate"
                    value={`KSh ${engineer.hourly_rate.toLocaleString()}/hour`}
                    valueColor="#10B981"
                  />
                )}
              </View>
            </View>
          )}

          {/* ── Notes ── */}
          {engineer.notes && (
            <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
              <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
              <View className="p-5">
                <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-3">Notes</Text>
                <Text className="text-muted-foreground text-sm leading-relaxed">{engineer.notes}</Text>
              </View>
            </View>
          )}

          {/* ── Record ── */}
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">Record</Text>
              <InfoRow icon="calendar-outline" label="Added On" value={fmtDt(engineer.created_at)} />
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
              <Text className="text-white font-bold text-sm">Edit Engineer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-card border border-[#EF4444] rounded-2xl py-3.5 flex-row justify-center items-center gap-2"
              activeOpacity={0.85}
              onPress={() => Alert.alert('Coming Soon', 'Delete functionality will be added')}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text className="font-bold text-sm text-[#EF4444]">Delete</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </>
  );
}