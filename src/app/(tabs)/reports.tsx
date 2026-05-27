import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getAllProjects, getAllPayments } from '@/database/database';
import { Project, Payment } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const fmt = (n: number) => `KSh ${n.toLocaleString()}`;

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: string; dot: string; muted: string }> = {
  material:  { icon: 'cube-outline',         dot: '#3B82F6', muted: '#1D3A6E' },
  labor:     { icon: 'people-outline',        dot: '#10B981', muted: '#0C4A36' },
  transport: { icon: 'car-outline',           dot: '#F59E0B', muted: '#6B420A' },
  permit:    { icon: 'document-text-outline', dot: '#A855F7', muted: '#4A1A6E' },
  equipment: { icon: 'hardware-chip-outline', dot: '#EF4444', muted: '#5C1A1A' },
};
const DEFAULT_CAT = { icon: 'receipt-outline', dot: '#8E8CA8', muted: '#2A2A36' };

const STATUS_CONFIG = [
  { key: 'active',    label: 'Active',    dot: '#10B981', muted: '#0C4A36', icon: 'pulse'             },
  { key: 'proposal',  label: 'Proposals', dot: '#F59E0B', muted: '#6B420A', icon: 'document-text'     },
  { key: 'completed', label: 'Completed', dot: '#3B82F6', muted: '#1D3A6E', icon: 'checkmark-circle'  },
  { key: 'on_hold',   label: 'On Hold',   dot: '#EF4444', muted: '#5C1A1A', icon: 'pause-circle'      },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, accentColor, children }: {
  title: string; accentColor: string; children: React.ReactNode;
}) {
  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
      <View style={{ height: 3, backgroundColor: accentColor }} />
      <View className="p-5">
        <Text className="text-foreground text-base font-bold mb-4">{title}</Text>
        {children}
      </View>
    </View>
  );
}

// ─── Bar row ─────────────────────────────────────────────────────────────────
function BarRow({
  label, value, pct, dot, muted, icon, suffix,
}: {
  label: string; value: string; pct: number;
  dot: string; muted: string; icon?: string; suffix?: string;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-2 flex-1">
          {icon && (
            <View className="w-6 h-6 rounded-lg items-center justify-center" style={{ backgroundColor: muted }}>
              <Ionicons name={icon as any} size={13} color={dot} />
            </View>
          )}
          <Text className="text-foreground text-sm font-medium flex-1" numberOfLines={1}>{label}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-foreground text-sm font-bold">{value}</Text>
          {suffix && <Text className="text-muted-foreground text-[10px]">{suffix}</Text>}
        </View>
      </View>
      <View className="h-1.5 bg-border rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: dot }}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getAllProjects(), getAllPayments()]).then(([p, pay]) => {
        setProjects(p as Project[]);
        setPayments(pay as Payment[]);
      });
    }, [])
  );

  const totalBudget    = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent     = payments.reduce((s, p) => s + p.amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const pctSpent       = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudget     = totalRemaining < 0;

  const categoryTotals: Record<string, number> = {};
  payments.forEach(p => {
    categoryTotals[p.category] = (categoryTotals[p.category] || 0) + p.amount;
  });

  const statusCounts = STATUS_CONFIG.map(s => ({
    ...s,
    count: projects.filter(p => p.status === s.key).length,
  }));

  const topProjects = [...projects]
    .sort((a, b) => b.actual_cost - a.actual_cost)
    .slice(0, 5);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View className="px-5 pt-14 pb-5">
        <Text className="text-primary text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">
          Analytics
        </Text>
        <Text className="text-foreground text-3xl font-black tracking-tight">Reports</Text>
      </View>

      <View className="px-5">

        {/* ── Summary strip ── */}
        <View className="flex-row gap-3 mb-4">
          {[
            { label: 'Budget',    value: fmt(totalBudget),             color: '#F1F0FA', dot: '#7C5CFC', muted: '#2E1A6E' },
            { label: 'Spent',     value: fmt(totalSpent),              color: '#10B981', dot: '#10B981', muted: '#0C4A36' },
            { label: 'Remaining', value: fmt(Math.abs(totalRemaining)), color: overBudget ? '#EF4444' : '#F1F0FA',
              dot: overBudget ? '#EF4444' : '#5C5A72', muted: overBudget ? '#5C1A1A' : '#2A2A36' },
          ].map(({ label, value, color, dot, muted }) => (
            <View key={label} className="flex-1 bg-card rounded-2xl border border-border overflow-hidden">
              <View style={{ height: 3, backgroundColor: dot }} />
              <View className="p-3 items-center">
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">{label}</Text>
                <Text className="font-black text-sm text-center" style={{ color }} numberOfLines={1}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Overall budget progress ── */}
        <Section title="Budget Utilisation" accentColor="#7C5CFC">
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted-foreground text-sm">Spent so far</Text>
            <Text className="font-bold text-sm" style={{ color: overBudget ? '#EF4444' : '#7C5CFC' }}>
              {pctSpent.toFixed(1)}%
            </Text>
          </View>
          <View className="h-3 bg-border rounded-full overflow-hidden mb-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(pctSpent, 100)}%`,
                backgroundColor: overBudget ? '#EF4444' : '#7C5CFC',
              }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground text-[10px]">{fmt(0)}</Text>
            <Text className="text-muted-foreground text-[10px]">{fmt(totalBudget)}</Text>
          </View>
        </Section>

        {/* ── Project status ── */}
        <Section title="Project Status" accentColor="#3B82F6">
          <View className="flex-row gap-2">
            {statusCounts.map(({ key, label, dot, muted, icon, count }) => (
              <View key={key} className="flex-1 rounded-xl border border-border overflow-hidden">
                <View style={{ height: 2, backgroundColor: dot }} />
                <View className="p-3 items-center">
                  <View className="w-8 h-8 rounded-xl items-center justify-center mb-1.5" style={{ backgroundColor: muted }}>
                    <Ionicons name={icon as any} size={15} color={dot} />
                  </View>
                  <Text className="text-foreground text-xl font-black">{count}</Text>
                  <Text className="text-muted-foreground text-[10px] text-center mt-0.5">{label}</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* ── Spending by category ── */}
        <Section title="Spending by Category" accentColor="#F59E0B">
          {Object.entries(categoryTotals).length > 0 ? (
            Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const cfg = CATEGORY_CONFIG[category] ?? DEFAULT_CAT;
                return (
                  <BarRow
                    key={category}
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                    value={fmt(amount)}
                    pct={(amount / totalSpent) * 100}
                    dot={cfg.dot}
                    muted={cfg.muted}
                    icon={cfg.icon}
                    suffix={`${((amount / totalSpent) * 100).toFixed(0)}%`}
                  />
                );
              })
          ) : (
            <View className="items-center py-6">
              <Ionicons name="pie-chart-outline" size={36} color="#5C5A72" />
              <Text className="text-muted-foreground text-sm mt-2">No spending data yet</Text>
            </View>
          )}
        </Section>

        {/* ── Top projects by spending ── */}
        <Section title="Top Projects by Spending" accentColor="#10B981">
          {topProjects.length > 0 ? (
            topProjects.map((project, i) => {
              const pct = project.budget > 0 ? (project.actual_cost / project.budget) * 100 : 0;
              const over = pct > 100;
              return (
                <BarRow
                  key={project.id}
                  label={`${i + 1}. ${project.project_name}`}
                  value={fmt(project.actual_cost)}
                  pct={pct}
                  dot={over ? '#EF4444' : '#10B981'}
                  muted={over ? '#5C1A1A' : '#0C4A36'}
                  suffix={`${pct.toFixed(0)}% of budget`}
                />
              );
            })
          ) : (
            <View className="items-center py-6">
              <Ionicons name="bar-chart-outline" size={36} color="#5C5A72" />
              <Text className="text-muted-foreground text-sm mt-2">No projects yet</Text>
            </View>
          )}
        </Section>

      </View>
    </ScrollView>
  );
}