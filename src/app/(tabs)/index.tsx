import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStats, getRecentPayments } from '@/database/database';

const fmt   = (n: number) => `KSh ${n.toLocaleString()}`;
const fmtDt = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

// Dynamic colors
const STAT_CARDS = [
  { label: 'Active',    sub: 'ongoing',  icon: 'pulse',            dot: '#10B981', muted: '#0C4A36' },
  { label: 'Proposals', sub: 'pending',  icon: 'document-text',    dot: '#F59E0B', muted: '#6B420A' },
  { label: 'Completed', sub: 'finished', icon: 'checkmark-circle', dot: '#3B82F6', muted: '#1D3A6E' },
  { label: 'On Hold',   sub: 'paused',   icon: 'pause-circle',     dot: '#EF4444', muted: '#5C1A1A' },
] as const;

const QUICK_ACTIONS = [
  { icon: 'briefcase-outline',  label: 'New Project', href: '/project/add',  dot: '#3B82F6', muted: '#1D3A6E' },
  { icon: 'cash-outline',       label: 'Add Payment', href: '/payment/add',  dot: '#10B981', muted: '#0C4A36' },
  { icon: 'person-add-outline', label: 'New Client',  href: '/client/add',   dot: '#F59E0B', muted: '#6B420A' },
  { icon: 'construct-outline',  label: 'New Worker',  href: '/worker/add',   dot: '#A855F7', muted: '#4A1A6E' },
] as const;

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, sub, icon, dot, muted, value,
}: { label: string; sub: string; icon: string; dot: string; muted: string; value: number }) {
  return (
    <View className="flex-1 bg-card rounded-2xl border border-border overflow-hidden">
      <View style={{ height: 3, backgroundColor: dot }} />
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-muted-foreground text-[10px] uppercase tracking-widest">{label}</Text>
            <Text className="text-foreground text-3xl font-black mt-0.5">{value}</Text>
          </View>
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: muted }}>
            <Ionicons name={icon as any} size={18} color={dot} />
          </View>
        </View>
        <Text className="text-muted-foreground text-[11px]">{sub} projects</Text>
      </View>
    </View>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ icon, label, href, dot, muted }: typeof QUICK_ACTIONS[number]) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity activeOpacity={1} onPressIn={onIn} onPressOut={onOut} style={{ width: '48%' }}>
        <Animated.View
          className="bg-card rounded-2xl border border-border p-4 flex-row items-center gap-3"
          style={{ transform: [{ scale }] }}
        >
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: muted }}>
            <Ionicons name={icon as any} size={18} color={dot} />
          </View>
          <Text className="text-foreground text-sm font-semibold flex-1">{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────────
function PaymentRow({ payment }: { payment: any }) {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-2.5 flex-row items-center gap-3">
      {/* Icon */}
      <View className="w-10 h-10 rounded-xl bg-[#0C4A36] items-center justify-center">
        <Ionicons name="cash" size={18} color="#10B981" />
      </View>
      {/* Info */}
      <View className="flex-1">
        <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
          {payment.item_description}
        </Text>
        <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
          {payment.project_name}
        </Text>
        <View className="flex-row items-center mt-1 gap-1">
          <Ionicons name="calendar-outline" size={11} color="#5C5A72" />
          <Text className="text-muted-foreground text-[11px]">{fmtDt(payment.payment_date)}</Text>
          <View className="w-1 h-1 rounded-full bg-border mx-1" />
          <Text className="text-muted-foreground text-[11px] capitalize">{payment.category}</Text>
        </View>
      </View>
      {/* Amount */}
      <Text className="text-[#10B981] font-bold text-sm">{fmt(payment.amount)}</Text>
    </View>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-foreground text-base font-bold">{title}</Text>
      </View>
      {action && href && (
        <Link href={href as any} asChild>
          <TouchableOpacity>
            <Text className="text-primary text-xs font-semibold">{action} →</Text>
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [stats, setStats] = useState({
    activeProjects: 0, proposalProjects: 0,
    completedProjects: 0, onHoldProjects: 0,
    totalBudget: 0, totalSpent: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [s, p] = await Promise.all([getDashboardStats(), getRecentPayments(5)]);
    setStats(s);
    setRecentPayments(p);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const remaining      = stats.totalBudget - stats.totalSpent;
  const pctSpent       = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;
  const overBudget     = remaining < 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C5CFC" />}
    >
      {/* ── Hero Header ── */}
      <View className="px-5 pt-14 pb-6">
        <Text className="text-primary text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">
          Overview
        </Text>
        <View className="flex-row justify-between items-end">
          <Text className="text-foreground text-3xl font-black tracking-tight">Dashboard</Text>
          <View className="bg-card border border-border rounded-xl px-3 py-2 flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-[#10B981]" />
            <Text className="text-foreground text-xs font-semibold">
              {stats.activeProjects} Active
            </Text>
          </View>
        </View>
      </View>

      {/* ── Stat Cards 2×2 ── */}
      <View className="px-5 mb-5 gap-3">
        <View className="flex-row gap-3">
          <StatCard {...STAT_CARDS[0]} value={stats.activeProjects} />
          <StatCard {...STAT_CARDS[1]} value={stats.proposalProjects} />
        </View>
        <View className="flex-row gap-3">
          <StatCard {...STAT_CARDS[2]} value={stats.completedProjects} />
          <StatCard {...STAT_CARDS[3]} value={stats.onHoldProjects} />
        </View>
      </View>

      {/* ── Financial Overview ── */}
      <View className="mx-5 mb-5 bg-card rounded-2xl border border-border overflow-hidden">
        <View style={{ height: 3, backgroundColor: '#7C5CFC' }} />
        <View className="p-5">
          <SectionLabel title="Financial Overview" />

          {/* Budget / Spent / Remaining */}
          <View className="gap-3 mb-4">
            {[
              { label: 'Total Budget', value: fmt(stats.totalBudget),      color: '#F1F0FA' },
              { label: 'Total Spent',  value: fmt(stats.totalSpent),       color: '#10B981' },
              { label: 'Remaining',    value: fmt(Math.abs(remaining)),    color: overBudget ? '#EF4444' : '#F1F0FA',
                prefix: overBudget ? '−' : '' },
            ].map(({ label, value, color, prefix }) => (
              <View key={label} className="flex-row justify-between items-center">
                <Text className="text-muted-foreground text-sm">{label}</Text>
                <Text className="text-sm font-bold" style={{ color }}>
                  {prefix}{value}
                </Text>
              </View>
            ))}
          </View>

          {/* Progress bar */}
          <View className="h-2 bg-border rounded-full overflow-hidden mb-1.5">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(pctSpent, 100)}%`,
                backgroundColor: overBudget ? '#EF4444' : '#7C5CFC',
              }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground text-[10px]">0%</Text>
            <Text
              className="text-[10px] font-semibold"
              style={{ color: overBudget ? '#EF4444' : '#8E8CA8' }}
            >
              {pctSpent.toFixed(1)}% spent
            </Text>
            <Text className="text-muted-foreground text-[10px]">100%</Text>
          </View>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View className="px-5 mb-5">
        <SectionLabel title="Quick Actions" />
        <View className="flex-row flex-wrap gap-2.5">
          {QUICK_ACTIONS.map((a) => <QuickAction key={a.label} {...a} />)}
        </View>
      </View>

      {/* ── Recent Payments ── */}
      <View className="px-5 mb-10">
        <SectionLabel title="Recent Payments" action="See All" href="/(tabs)/payments" />

        {recentPayments.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl py-12 items-center gap-2">
            <View className="w-14 h-14 rounded-2xl bg-border items-center justify-center mb-1">
              <Ionicons name="receipt-outline" size={28} color="#5C5A72" />
            </View>
            <Text className="text-foreground font-bold text-base">No payments yet</Text>
            <Text className="text-muted-foreground text-sm">Payments will appear here.</Text>
          </View>
        ) : (
          recentPayments.map((p) => <PaymentRow key={p.id} payment={p} />)
        )}
      </View>
    </ScrollView>
  );
}