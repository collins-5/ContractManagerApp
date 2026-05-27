import { View, Text, FlatList, Animated, TouchableOpacity } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { getAllPayments, getProjectById } from '@/database/database';
import { Payment, Project } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const fmt = (n: number) => `KSh ${n.toLocaleString()}`;
const fmtDt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY = {
  material: { icon: 'cube-outline', dot: '#3B82F6', muted: '#1D3A6E', label: 'Material' },
  labor: { icon: 'people-outline', dot: '#10B981', muted: '#0C4A36', label: 'Labor' },
  transport: { icon: 'car-outline', dot: '#F59E0B', muted: '#6B420A', label: 'Transport' },
  permit: { icon: 'document-text-outline', dot: '#A855F7', muted: '#4A1A6E', label: 'Permit' },
  equipment: { icon: 'hardware-chip-outline', dot: '#EF4444', muted: '#5C1A1A', label: 'Equipment' },
} as const;

const DEFAULT_CAT = { icon: 'receipt-outline', dot: '#8E8CA8', muted: '#2A2A36', label: 'Other' };

type CatKey = keyof typeof CATEGORY;

// ─── Payment Card ─────────────────────────────────────────────────────────────
function PaymentCard({ item, project, onPress }: { item: Payment; project?: Project; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const cat = CATEGORY[item.category as CatKey] ?? DEFAULT_CAT;

  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPressIn={onIn} 
      onPressOut={onOut}
      onPress={onPress}
    >
      <Animated.View
        className="bg-card rounded-2xl mb-3 border border-border overflow-hidden"
        style={{ transform: [{ scale }] }}
      >
        {/* Top accent */}
        <View style={{ height: 3, backgroundColor: cat.dot }} />

        <View className="p-4">
          {/* Row 1: icon avatar + description + amount */}
          <View className="flex-row items-start gap-3">
            {/* Category avatar */}
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mt-0.5"
              style={{ backgroundColor: cat.muted }}
            >
              <Ionicons name={cat.icon as any} size={18} color={cat.dot} />
            </View>

            {/* Middle: description + project */}
            <View className="flex-1">
              <Text className="text-foreground text-[15px] font-bold tracking-tight" numberOfLines={2}>
                {item.item_description}
              </Text>
              {project && (
                <Text className="text-xs font-semibold mt-0.5" style={{ color: cat.dot }} numberOfLines={1}>
                  {project.project_name}
                </Text>
              )}
            </View>

            {/* Amount */}
            <Text className="text-[#10B981] font-black text-base">{fmt(item.amount)}</Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-border my-3" />

          {/* Row 2: category pill + date */}
          <View className="flex-row items-center justify-between">
            {/* Category pill */}
            <View
              className="flex-row items-center rounded-full px-2.5 py-1 gap-1.5"
              style={{ backgroundColor: cat.muted }}
            >
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.dot }} />
              <Text className="text-[10px] font-bold tracking-wide" style={{ color: cat.dot }}>
                {cat.label.toUpperCase()}
              </Text>
            </View>

            {/* Date */}
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={12} color="#5C5A72" />
              <Text className="text-muted-foreground text-[11px]">{fmtDt(item.payment_date)}</Text>
            </View>
          </View>

          {/* Notes */}
          {item.notes && (
            <View className="flex-row items-center mt-2.5 gap-1.5">
              <Ionicons name="document-outline" size={11} color="#5C5A72" />
              <Text className="text-muted-foreground text-[11px] flex-1" numberOfLines={1}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Map<string, Project>>(new Map());

  const loadPayments = async () => {
    const data = await getAllPayments();
    setPayments(data as Payment[]);
    const map = new Map<string, Project>();
    for (const p of data) {
      if (!map.has(p.project_id)) {
        const proj = await getProjectById(p.project_id);
        if (proj) map.set(p.project_id, proj as Project);
      }
    }
    setProjects(map);
  };

  useFocusEffect(useCallback(() => { loadPayments(); }, []));

  // Totals
  const total = payments.reduce((s, p) => s + p.amount, 0);

  const handlePaymentPress = (paymentId: string) => {
    router.push(`/payment/${paymentId}`);
  };

  return (
    <View className="flex-1 bg-background">

      {/* ── Header ── */}
      <View className="flex-row bg-primary/20 border-b border-l border-r border-primary/30 rounded-r-3xl rounded-l-3xl justify-between items-end px-5 pt-14 pb-5">
        <View>
          <Text className="text-primary text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">
            Ledger
          </Text>
          <Text className="text-foreground text-3xl font-black tracking-tight">Payments</Text>
        </View>
        <Link href="/payment/add" asChild>
          <TouchableOpacity
            className="flex-row items-center bg-primary rounded-xl px-3.5 py-2.5 gap-1"
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white text-[13px] font-bold">Add Payment</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* ── Summary Card ── */}
      <View className="mx-5 mb-4 mt-3 bg-card rounded-2xl border border-border overflow-hidden">
        <View style={{ height: 3, backgroundColor: '#10B981' }} />
        <View className="flex-row divide-x divide-border">
          <View className="flex-1 p-4 items-center">
            <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">Total Paid</Text>
            <Text className="text-[#10B981] text-lg font-black">{fmt(total)}</Text>
          </View>
          <View className="flex-1 p-4 items-center">
            <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">Transactions</Text>
            <Text className="text-foreground text-lg font-black">{payments.length}</Text>
          </View>
        </View>
      </View>

      {/* ── List ── */}
      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PaymentCard 
            item={item} 
            project={projects.get(item.project_id)} 
            onPress={() => handlePaymentPress(item.id)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              All Transactions
            </Text>
            <View className="bg-card rounded-full px-2 py-0.5">
              <Text className="text-muted-foreground text-[11px] font-bold">{payments.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center pt-16 gap-2">
            <View className="w-16 h-16 rounded-2xl bg-card border border-border items-center justify-center mb-1">
              <Ionicons name="receipt-outline" size={32} color="#5C5A72" />
            </View>
            <Text className="text-foreground text-lg font-bold">No payments yet</Text>
            <Text className="text-muted-foreground text-sm">Tap "Add Payment" to record one.</Text>
          </View>
        }
      />
    </View>
  );
}