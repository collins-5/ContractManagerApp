import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Client } from '@/types';
import { getAllClients } from '@/database/database';
import { Ionicons } from '@expo/vector-icons';

const fmtDt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3 py-3.5 border-b border-border last:border-0">
      <View className="w-8 h-8 rounded-xl bg-[#2E1A6E] items-center justify-center mt-0.5">
        <Ionicons name={icon as any} size={15} color="#7C5CFC" />
      </View>
      <View className="flex-1">
        <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{label}</Text>
        <Text className="text-foreground text-sm font-medium">{value}</Text>
      </View>
    </View>
  );
}

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    getAllClients()
      .then(clients => setClient(clients.find((c: Client) => c.id === id) || null))
      .catch(() => Alert.alert('Error', 'Failed to load client details'));
  }, [id]);

  if (!client) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <View className="w-12 h-12 rounded-2xl bg-card border border-border items-center justify-center">
          <Ionicons name="hourglass-outline" size={24} color="#5C5A72" />
        </View>
        <Text className="text-muted-foreground text-sm">Loading…</Text>
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
          <Ionicons name="chevron-back" size={18} color="#7C5CFC" />
          <Text className="text-primary text-sm font-semibold">Back</Text>
        </TouchableOpacity>

        <View className="w-16 h-16 rounded-2xl border-2 border-[#7C5CFC] bg-[#2E1A6E] items-center justify-center">
          <Text className="text-2xl font-black text-[#7C5CFC]">{initials(client.full_name)}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-primary text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">
            Client
          </Text>
          <Text className="text-foreground text-xl font-black tracking-tight">
            {client.full_name}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 py-2 bg-background" showsVerticalScrollIndicator={false}>


        <View className="px-5 pb-10">

          {/* ── Contact Info ── */}
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
            <View style={{ height: 3, backgroundColor: '#7C5CFC' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-[#7C5CFC] text-[10px] font-bold tracking-widest uppercase mb-2">
                Contact Information
              </Text>
              <InfoRow icon="call-outline" label="Phone" value={client.phone_number} />
              {client.email && <InfoRow icon="mail-outline" label="Email" value={client.email} />}
              {client.address && <InfoRow icon="location-outline" label="Address" value={client.address} />}
            </View>
          </View>

          {/* ── Notes ── */}
          {client.notes && (
            <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
              <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
              <View className="p-5">
                <Text className="text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase mb-3">
                  Notes
                </Text>
                <Text className="text-muted-foreground text-sm leading-relaxed">{client.notes}</Text>
              </View>
            </View>
          )}

          {/* ── Meta ── */}
          <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
            <View className="px-4 pt-4 pb-1">
              <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">
                Record
              </Text>
              <InfoRow icon="calendar-outline" label="Added On" value={fmtDt(client.created_at)} />
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
              <Text className="text-white font-bold text-sm">Edit Client</Text>
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